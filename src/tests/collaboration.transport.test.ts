// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { request as httpRequest } from "node:http";
import { createCollaborationRelay } from "../../server/relay";
import {
  activeIds,
  CollaborationClient,
  type CollaborationAction,
  type CollaborationOperation,
  type CollaborationSession,
  deleteAxisActions,
  insertAxisActions,
  sharedDocumentRows,
  validateCollaborationEndpoint,
} from "../lib/collaboration";

const origin = "http://localhost:1420";
let relay: ReturnType<typeof createCollaborationRelay>;
let endpoint: string;
const clients: CollaborationClient[] = [];

async function start(options: Partial<Parameters<typeof createCollaborationRelay>[0]> = {}) {
  relay = createCollaborationRelay({ allowedOrigins: [origin], ...options });
  await new Promise<void>((resolve) => relay.server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(relay.server.address() as AddressInfo).port}`;
}

function client(fetcher?: typeof fetch) {
  const result = new CollaborationClient({
    endpoint,
    origin,
    ...(fetcher ? { fetch: fetcher } : {}),
  });
  clients.push(result);
  return result;
}

async function raw(
  path: string,
  method = "GET",
  body?: unknown,
  token?: string,
  requestOrigin = origin,
) {
  return fetch(`${endpoint}${path}`, {
    method,
    headers: {
      Origin: requestOrigin,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function rawOwner(): Promise<CollaborationSession> {
  return (await raw("/rooms", "POST", { rows: [["seed", "other"]], displayName: "Owner" })).json();
}

async function pair() {
  const owner = client();
  const editor = client();
  const room = await owner.createRoom(
    [
      ["seed", "other"],
      ["second", "row"],
    ],
    "Owner",
  );
  const invite = await owner.invite("editor");
  await editor.joinRoom(room.roomId, invite.token, "Editor");
  await owner.sync();
  return { owner, editor, room };
}

function cell(
  owner: CollaborationClient,
  row: number,
  col: number,
  value: string,
): CollaborationAction {
  const document = owner.getDocument()!;
  return {
    type: "set-cell",
    rowId: activeIds(document, "row")[row],
    columnId: activeIds(document, "column")[col],
    value,
  };
}

beforeEach(async () => {
  await start();
});
afterEach(async () => {
  clients.splice(0).forEach((item) => item.dispose());
  relay.server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    relay.server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("explicit real HTTP collaboration provider", () => {
  it("is initially OFF, never fetches on construction, and disallows unsafe remote endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const off = new CollaborationClient({ fetch: fetcher });
    expect(off.getState()).toMatchObject({ status: "off", endpoint: "", snapshot: null });
    expect(fetcher).not.toHaveBeenCalled();
    await expect(off.createRoom([["private"]], "Owner")).rejects.toMatchObject({
      code: "endpoint-required",
    });
    expect(fetcher).not.toHaveBeenCalled();
    for (const url of [
      "http://relay.example",
      "https://a:b@relay.example",
      "https://relay.example/?token=secret",
      "file:///tmp/a",
      "http://127.0.0.2:1234",
    ]) {
      expect(() => validateCollaborationEndpoint(url)).toThrow();
    }
    expect(validateCollaborationEndpoint("https://relay.example/prefix/")).toBe(
      "https://relay.example/prefix",
    );
  });

  it("converges two HTTP participants under concurrent cells and row/column inserts with stable identities", async () => {
    const { owner, editor } = await pair();
    const oldRows = activeIds(owner.getDocument()!, "row");
    const oldColumns = activeIds(owner.getDocument()!, "column");
    const rowInsert = insertAxisActions(owner.getDocument()!, "row", 0);
    const colInsert = insertAxisActions(editor.getDocument()!, "column", 0);
    await Promise.all([
      owner.submit([
        ...rowInsert,
        { type: "set-cell", rowId: oldRows[0], columnId: oldColumns[0], value: "original row" },
      ]),
      editor.submit([
        ...colInsert,
        { type: "set-cell", rowId: oldRows[1], columnId: oldColumns[1], value: "original column" },
      ]),
    ]);
    await Promise.all([owner.sync(), editor.sync()]);
    expect(owner.getDocument()).toEqual(editor.getDocument());
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([
      ["", "", ""],
      ["", "original row", "other"],
      ["", "second", "original column"],
    ]);
    expect(activeIds(owner.getDocument()!, "row").slice(1)).toEqual(oldRows);
    expect(activeIds(owner.getDocument()!, "column").slice(1)).toEqual(oldColumns);
  });

  it("records a stale concurrent overwrite and restores a chosen historical value as a new operation", async () => {
    const { owner, editor } = await pair();
    const first = await owner.submit([cell(owner, 0, 0, "first")]);
    await editor.submit([cell(editor, 0, 0, "second")]);
    await owner.sync();
    const history = owner.getState().snapshot!.history;
    expect(history.at(-1)!.conflicts).toMatchObject([
      { kind: "overwritten-cell", previousValue: "first", value: "second" },
    ]);
    await expect(owner.undo(first)).rejects.toMatchObject({ code: "undo-conflict" });
    owner.discardPending(owner.getPendingOperations()[0].id);
    await owner.restore(first);
    await editor.sync();
    expect(sharedDocumentRows(editor.getDocument()!)[0][0]).toBe("first");
    expect(editor.getState().snapshot!.history.at(-1)).toMatchObject({
      restoreOf: first,
      revision: 3,
    });
  });

  it("performs Undo as a new compensating operation and protects later other-participant edits", async () => {
    const { owner, editor } = await pair();
    const id = await owner.submit([cell(owner, 1, 1, "changed")]);
    const undoId = await owner.undo(id);
    await editor.sync();
    expect(sharedDocumentRows(editor.getDocument()!)[1][1]).toBe("row");
    expect(editor.getState().snapshot!.history.at(-1)).toMatchObject({
      id: undoId,
      undoOf: id,
      revision: 2,
    });
    await expect(editor.undo(id)).rejects.toMatchObject({ code: "undo-owner" });
  });

  it("preserves edits racing a deleted row in tombstone history and explicitly restores the row", async () => {
    const { owner, editor } = await pair();
    const staleCell = cell(editor, 0, 0, "edit while deleted");
    const deletion = await owner.submit(deleteAxisActions(owner.getDocument()!, "row", [0]));
    await editor.submit([staleCell]);
    await owner.sync();
    expect(owner.getState().snapshot!.history.at(-1)!.conflicts[0].kind).toBe("deleted-target");
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([["second", "row"]]);
    await owner.restore(deletion, true);
    await editor.sync();
    expect(sharedDocumentRows(editor.getDocument()!)[0][0]).toBe("edit while deleted");
  });

  it("queues while offline, reconnects, and resends a lost ACK without applying it twice", async () => {
    let loseAck = false;
    const fetcher: typeof fetch = async (input, init) => {
      const response = await fetch(input, init);
      if (loseAck && String(input).endsWith("/operations")) {
        loseAck = false;
        throw new TypeError("synthetic lost response");
      }
      return response;
    };
    const owner = client(fetcher);
    await owner.createRoom([["seed"]], "Owner");
    owner.disconnect();
    await owner.submit([cell(owner, 0, 0, "offline")]);
    expect(owner.getState()).toMatchObject({ status: "offline", pendingCount: 1 });
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([["offline"]]);
    await owner.connect();
    expect(owner.getState()).toMatchObject({ status: "online", pendingCount: 0 });
    loseAck = true;
    await expect(owner.submit(insertAxisActions(owner.getDocument()!, "row", 1))).rejects.toThrow(
      "synthetic lost response",
    );
    expect(owner.getState().pendingCount).toBe(1);
    await owner.connect();
    expect(owner.getState().pendingCount).toBe(0);
    expect(owner.getDocument()!.revision).toBe(2);
    expect(activeIds(owner.getDocument()!, "row")).toHaveLength(2);
    expect(owner.getState().snapshot!.history).toHaveLength(2);
  });

  it("accepts duplicate and reverse-order independent requests, rejects future/dependent requests until ready", async () => {
    const owner = await rawOwner();
    const rowId = activeIds(owner.snapshot.document, "row")[0];
    const columns = activeIds(owner.snapshot.document, "column");
    const second: CollaborationOperation = {
      id: "second",
      baseRevision: 0,
      actions: [{ type: "set-cell", rowId, columnId: columns[1], value: "B" }],
    };
    const first: CollaborationOperation = {
      id: "first",
      baseRevision: 0,
      actions: [{ type: "set-cell", rowId, columnId: columns[0], value: "A" }],
    };
    expect(
      (await raw(`/rooms/${owner.roomId}/operations`, "POST", second, owner.token)).status,
    ).toBe(200);
    expect(
      (await raw(`/rooms/${owner.roomId}/operations`, "POST", first, owner.token)).status,
    ).toBe(200);
    const duplicate = await (
      await raw(`/rooms/${owner.roomId}/operations`, "POST", second, owner.token)
    ).json();
    expect(duplicate).toMatchObject({ replayed: true, revision: 1 });
    expect(duplicate.snapshot.document.revision).toBe(2);
    expect(sharedDocumentRows(duplicate.snapshot.document)).toEqual([["A", "B"]]);
    expect(
      (
        await raw(
          `/rooms/${owner.roomId}/operations`,
          "POST",
          { ...first, baseRevision: 2 },
          owner.token,
        )
      ).status,
    ).toBe(409);
    const dependent: CollaborationOperation = {
      id: "dependent",
      baseRevision: 2,
      actions: [{ type: "set-cell", rowId: "new-row", columnId: columns[0], value: "arrived" }],
    };
    expect(
      (await raw(`/rooms/${owner.roomId}/operations`, "POST", dependent, owner.token)).status,
    ).toBe(409);
    await raw(
      `/rooms/${owner.roomId}/operations`,
      "POST",
      {
        id: "insert",
        baseRevision: 2,
        actions: [{ type: "insert", axis: "row", id: "new-row", afterId: rowId }],
      },
      owner.token,
    );
    expect(
      (await raw(`/rooms/${owner.roomId}/operations`, "POST", dependent, owner.token)).status,
    ).toBe(200);
    expect(
      (
        await raw(
          `/rooms/${owner.roomId}/operations`,
          "POST",
          { ...first, id: "future", baseRevision: 999 },
          owner.token,
        )
      ).status,
    ).toBe(409);
  });

  it("atomically rejects malformed bulk operations without partial cell writes", async () => {
    const owner = await rawOwner();
    const rowId = activeIds(owner.snapshot.document, "row")[0];
    const columnId = activeIds(owner.snapshot.document, "column")[0];
    const operation = {
      id: "atomic",
      baseRevision: 0,
      actions: [
        { type: "set-cell", rowId, columnId, value: "should not apply" },
        { type: "delete", axis: "row", id: "missing" },
      ],
    };
    expect(
      (await raw(`/rooms/${owner.roomId}/operations`, "POST", operation, owner.token)).status,
    ).toBe(409);
    const state = await (await raw(`/rooms/${owner.roomId}`, "GET", undefined, owner.token)).json();
    expect(state.document.revision).toBe(0);
    expect(sharedDocumentRows(state.document)[0][0]).toBe("seed");
  });

  it("enforces viewer read-only and owner-only management on the relay, regardless of forged client actions", async () => {
    const owner = await rawOwner();
    const invite = await (
      await raw(`/rooms/${owner.roomId}/invites`, "POST", { role: "viewer" }, owner.token)
    ).json();
    const viewer: CollaborationSession = await (
      await raw(`/rooms/${owner.roomId}/join`, "POST", {
        inviteToken: invite.token,
        displayName: "Viewer",
        role: "owner",
      })
    ).json();
    expect(viewer.snapshot.members.find((member) => member.id === viewer.memberId)!.role).toBe(
      "viewer",
    );
    const operation = {
      id: "forged",
      baseRevision: 0,
      actions: [
        {
          type: "set-cell",
          rowId: activeIds(owner.snapshot.document, "row")[0],
          columnId: activeIds(owner.snapshot.document, "column")[0],
          value: "forbidden",
        },
      ],
      role: "owner",
      memberId: owner.memberId,
    };
    expect(
      (await raw(`/rooms/${owner.roomId}/operations`, "POST", operation, viewer.token)).status,
    ).toBe(403);
    expect(
      (await raw(`/rooms/${owner.roomId}/invites`, "POST", { role: "editor" }, viewer.token))
        .status,
    ).toBe(403);
    expect((await raw(`/rooms/${owner.roomId}/stop`, "POST", {}, viewer.token)).status).toBe(403);
    expect((await raw(`/rooms/${owner.roomId}`, "DELETE", undefined, viewer.token)).status).toBe(
      403,
    );
    expect((await raw(`/rooms/${owner.roomId}`, "GET", undefined, viewer.token)).status).toBe(200);
    expect((await raw(`/rooms/${owner.roomId}`, "GET")).status).toBe(401);
  });

  it("revokes membership before allowing reads or queued offline writes", async () => {
    const { owner, editor } = await pair();
    editor.disconnect();
    await editor.submit([cell(editor, 0, 0, "queued before revoke")]);
    await owner.revoke(editor.getState().memberId!);
    await expect(editor.connect()).rejects.toMatchObject({ code: "revoked" });
    expect(editor.getState()).toMatchObject({ status: "blocked", pendingCount: 1 });
    expect(sharedDocumentRows(owner.getDocument()!)[0][0]).toBe("seed");
  });

  it("rechecks revocation after receiving an in-flight request body", async () => {
    const owner = await rawOwner();
    const invite = await (
      await raw(`/rooms/${owner.roomId}/invites`, "POST", { role: "editor" }, owner.token)
    ).json();
    const editor: CollaborationSession = await (
      await raw(`/rooms/${owner.roomId}/join`, "POST", {
        inviteToken: invite.token,
        displayName: "Editor",
      })
    ).json();
    let finish!: () => void;
    const result = new Promise<number>((resolve, reject) => {
      const request = httpRequest(
        `${endpoint}/rooms/${owner.roomId}/operations`,
        {
          method: "POST",
          headers: {
            Origin: origin,
            Authorization: `Bearer ${editor.token}`,
            "Content-Type": "application/json",
          },
        },
        (response) => {
          response.resume();
          response.on("end", () => resolve(response.statusCode!));
        },
      );
      request.on("error", reject);
      request.write('{"id":"slow-request","baseRevision":0,');
      finish = () =>
        request.end(
          JSON.stringify({
            actions: [
              {
                type: "set-cell",
                rowId: activeIds(owner.snapshot.document, "row")[0],
                columnId: activeIds(owner.snapshot.document, "column")[0],
                value: "forbidden",
              },
            ],
          }).slice(1),
        );
    });
    await raw(
      `/rooms/${owner.roomId}/members/${editor.memberId}`,
      "DELETE",
      undefined,
      owner.token,
    );
    finish();
    expect(await result).toBe(403);
    const snapshot = await (
      await raw(`/rooms/${owner.roomId}`, "GET", undefined, owner.token)
    ).json();
    expect(snapshot.document.revision).toBe(0);
  });

  it("does not automatically retry a rejected operation on flush or later snapshots", async () => {
    let sends = 0;
    const countRequests: typeof fetch = async (input, init) => {
      if (String(input).endsWith("/operations")) ++sends;
      return fetch(input, init);
    };
    const owner = client(countRequests);
    const editor = client();
    const room = await owner.createRoom([["seed"]], "Owner");
    const invite = await owner.invite("editor");
    await editor.joinRoom(room.roomId, invite.token, "Editor");
    const operation = await owner.submit([cell(owner, 0, 0, "first")]);
    await editor.submit([cell(editor, 0, 0, "later")]);
    await expect(owner.undo(operation)).rejects.toMatchObject({ code: "undo-conflict" });
    expect(sends).toBe(2);
    await owner.sync();
    await owner.flush();
    await owner.flush();
    expect(sends).toBe(2);
    expect(owner.getState()).toMatchObject({ status: "blocked", pendingCount: 1 });
  });

  it("bounds history while retaining idempotency receipts for older accepted operations", async () => {
    const owner = await rawOwner();
    const rowId = activeIds(owner.snapshot.document, "row")[0];
    const columnId = activeIds(owner.snapshot.document, "column")[0];
    const operation = (i: number) => ({
      id: `history-${i}`,
      baseRevision: i,
      actions: [{ type: "set-cell", rowId, columnId, value: String(i) }],
    });
    for (let i = 0; i < 101; ++i)
      expect(
        (await raw(`/rooms/${owner.roomId}/operations`, "POST", operation(i), owner.token)).status,
      ).toBe(200);
    const replay = await (
      await raw(`/rooms/${owner.roomId}/operations`, "POST", operation(0), owner.token)
    ).json();
    expect(replay.replayed).toBe(true);
    expect(replay.snapshot.document.revision).toBe(101);
    expect(replay.snapshot.history).toHaveLength(100);
    expect(replay.snapshot.history[0].id).toBe("history-1");
    const expired = await raw(
      `/rooms/${owner.roomId}/operations`,
      "POST",
      { id: "restore-expired", baseRevision: 101, actions: [], restoreOf: "history-0" },
      owner.token,
    );
    expect(expired.status).toBe(409);
  });

  it("does not let a late response reopen a disconnected client or lose an unacknowledged operation", async () => {
    let hold = false;
    let release!: () => void;
    let received!: () => void;
    const responseReceived = new Promise<void>((resolve) => {
      received = resolve;
    });
    const delayed: typeof fetch = async (input, init) => {
      const response = await fetch(input, init);
      if (hold && String(input).endsWith("/operations")) {
        received();
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      return response;
    };
    const owner = client(delayed);
    await owner.createRoom([["seed"]], "Owner");
    hold = true;
    const send = owner.submit([cell(owner, 0, 0, "sent")]);
    const rejected = expect(send).rejects.toMatchObject({ code: "session-changed" });
    await responseReceived;
    owner.disconnect();
    release();
    await rejected;
    expect(owner.getState()).toMatchObject({ status: "offline", pendingCount: 1 });
    hold = false;
    await owner.connect();
    expect(owner.getDocument()!.revision).toBe(1);
    expect(owner.getState().pendingCount).toBe(0);
  });

  it("supports single-use/revoked invitations, leave, stop and deletion with retained local-copy boundaries", async () => {
    const { owner, editor, room } = await pair();
    const revoked = await owner.invite("viewer");
    await owner.revokeInvite(revoked.id);
    const viewer = client();
    await expect(viewer.joinRoom(room.roomId, revoked.token, "Viewer")).rejects.toMatchObject({
      code: "invalid-invite",
    });
    const once = await owner.invite("viewer");
    await viewer.joinRoom(room.roomId, once.token, "Viewer");
    const extra = client();
    await expect(extra.joinRoom(room.roomId, once.token, "Extra")).rejects.toMatchObject({
      code: "invalid-invite",
    });
    await editor.leave();
    expect(editor.getState().status).toBe("off");
    await owner.sync();
    expect(
      owner.getState().snapshot!.members.find((member) => member.displayName === "Editor")!.active,
    ).toBe(false);
    const copy = sharedDocumentRows(viewer.getDocument()!);
    await owner.stop();
    await expect(viewer.sync()).rejects.toMatchObject({ code: "revoked" });
    expect(owner.getState().status).toBe("stopped");
    expect(sharedDocumentRows(viewer.getDocument()!)).toEqual(copy); // Previously downloaded copies cannot be remotely erased.
    await owner.deleteRoom();
    expect(relay.roomCount()).toBe(0);
    expect((await raw(`/rooms/${room.roomId}`)).status).toBe(410);
  });

  it("denies foreign/opaque origins, credential URLs, and unbounded bodies", async () => {
    expect(() => createCollaborationRelay({ allowedOrigins: ["*"] })).toThrow();
    expect(() => createCollaborationRelay({ allowedOrigins: ["null"] })).toThrow();
    expect(
      (
        await raw(
          "/rooms",
          "POST",
          { rows: [], displayName: "Owner" },
          undefined,
          "https://untrusted.example",
        )
      ).status,
    ).toBe(403);
    expect(
      (await raw("/rooms?token=never-accepted", "POST", { rows: [], displayName: "Owner" })).status,
    ).toBe(400);
    const huge = await raw("/rooms", "POST", {
      rows: [["a".repeat(1024 * 1024)]],
      displayName: "Owner",
    });
    expect(huge.status).toBe(413);
    const preflight = await raw("/rooms", "OPTIONS");
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe(origin);
    expect(preflight.headers.get("access-control-allow-credentials")).toBeNull();
    expect(relay.roomCount()).toBe(0);
  });

  it("expires server content and invites, and enforces request rate limits", async () => {
    relay.server.closeAllConnections();
    await new Promise<void>((resolve) => relay.server.close(() => resolve()));
    let now = 100;
    await start({ now: () => now, retentionMs: 1000, inviteLifetimeMs: 100, requestsPerMinute: 5 });
    const owner = await rawOwner();
    const invite = await (
      await raw(`/rooms/${owner.roomId}/invites`, "POST", { role: "editor" }, owner.token)
    ).json();
    now += 101;
    expect(
      (
        await raw(`/rooms/${owner.roomId}/join`, "POST", {
          inviteToken: invite.token,
          displayName: "Late",
        })
      ).status,
    ).toBe(403);
    expect((await raw(`/rooms/${owner.roomId}`, "GET", undefined, owner.token)).status).toBe(200);
    expect((await raw(`/rooms/${owner.roomId}`, "GET", undefined, owner.token)).status).toBe(200);
    expect((await raw(`/rooms/${owner.roomId}`, "GET", undefined, owner.token)).status).toBe(429);
    now += 60_000;
    relay.purge();
    expect(relay.roomCount()).toBe(0);
    expect((await raw(`/rooms/${owner.roomId}`, "GET", undefined, owner.token)).status).toBe(410);
  });
});
