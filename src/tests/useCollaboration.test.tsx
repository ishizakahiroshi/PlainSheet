import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { createCollaborationRelay } from "../../server/relay";
import { useCollaboration } from "../hooks/useCollaboration";
import {
  activeIds,
  CollaborationClient,
  deleteAxisActions,
  insertAxisActions,
  sharedDocumentRows,
} from "../lib/collaboration";
import { rewriteFormulasForStructure } from "../lib/formula";

// A real client/provider and loopback-only relay connect the React hook to HTTP.
// Every synthetic server and polling client is closed by afterEach, including failures.
const origin = "http://localhost:1420";
let relay: ReturnType<typeof createCollaborationRelay>;
let endpoint: string;
const clients: CollaborationClient[] = [];
function client() {
  // jsdom AbortSignal is a different realm from Node fetch. The production timeout
  // transport is tested in the node-environment provider suite.
  const value = new CollaborationClient({
    endpoint,
    origin,
    fetch: (input, init) => fetch(input, { ...init, signal: undefined }),
  });
  clients.push(value);
  return value;
}
beforeEach(async () => {
  relay = createCollaborationRelay({ allowedOrigins: [origin] });
  await new Promise<void>((resolve) => relay.server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(relay.server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  cleanup();
  clients.splice(0).forEach((value) => value.dispose());
  relay.server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    relay.server.close((error) => (error ? reject(error) : resolve())),
  );
});
function harness(
  initial: Record<string, string[][]> = { first: [["local"]], second: [["second"]] },
) {
  const documents = new Map(Object.entries(initial));
  const applyRows = vi.fn((id: string, rows: string[][]) => {
    documents.set(id, rows);
  });
  const onError = vi.fn();
  const hook = renderHook(
    ({ activeId }) =>
      useCollaboration({ activeId, getRows: (id) => documents.get(id), applyRows, onError }),
    { initialProps: { activeId: "first" } },
  );
  return { ...hook, documents, applyRows, onError };
}

describe("useCollaboration with the real loopback provider", () => {
  it("starts OFF and attaches remote content only to the chosen document", async () => {
    const h = harness();
    expect(h.result.current).toMatchObject({ client: null, state: null, readOnly: false });
    expect(h.applyRows).not.toHaveBeenCalled();
    const owner = client();
    await owner.createRoom([["shared", "00123"]], "Synthetic owner");
    act(() => h.result.current.attach("first", owner));
    expect(h.documents.get("first")).toEqual([["shared", "00123"]]);
    expect(h.result.current.state?.status).toBe("online");
    h.rerender({ activeId: "second" });
    expect(h.result.current.client).toBeNull();
    expect(h.documents.get("second")).toEqual([["second"]]);
    expect(h.result.current.hasSession("first")).toBe(true);
    act(() => h.result.current.detach("first"));
    expect(h.result.current.hasSession("first")).toBe(false);
    expect(owner.getState().status).toBe("off");
  });

  it("routes a central matrix mutation through one atomic operation and receives another participant's edit", async () => {
    const h = harness();
    const owner = client();
    const peer = client();
    const room = await owner.createRoom([["seed", "other"]], "Owner");
    const invite = await owner.invite("editor");
    await peer.joinRoom(room.roomId, invite.token, "Peer");
    act(() => h.result.current.attach("first", owner));
    act(() => {
      expect(h.result.current.replaceMatrix([["00123", "9007199254740993"]])).toBe(true);
    });
    await act(async () => {
      await owner.flush();
      await peer.sync();
    });
    expect(sharedDocumentRows(peer.getDocument()!)).toEqual([["00123", "9007199254740993"]]);
    expect(peer.getState().snapshot!.history).toHaveLength(1);
    await act(async () => {
      const document = peer.getDocument()!;
      await peer.submit([
        {
          type: "set-cell",
          rowId: activeIds(document, "row")[0],
          columnId: activeIds(document, "column")[1],
          value: "remote",
        },
      ]);
      await owner.sync();
    });
    expect(h.documents.get("first")).toEqual([["00123", "remote"]]);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it("composes stable-ID structural edits and formula rewrites into one history entry", async () => {
    const h = harness();
    const owner = client();
    await owner.createRoom(
      [
        ["2", "=A1"],
        ["4", "=$A$2+A1"],
      ],
      "Owner",
    );
    act(() => h.result.current.attach("first", owner));
    act(() => {
      expect(
        h.result.current.structure(insertAxisActions(owner.getDocument()!, "row", 0), (rows) =>
          rewriteFormulasForStructure(rows, { type: "insert", axis: "row", index: 0, count: 1 }),
        ),
      ).toBe(true);
    });
    await act(async () => {
      await owner.flush();
    });
    expect(h.documents.get("first")).toEqual([
      ["", ""],
      ["2", "=A2"],
      ["4", "=$A$3+A2"],
    ]);
    expect(owner.getState().snapshot!.history).toHaveLength(1);
    await act(async () => {
      await owner.undo(owner.getState().snapshot!.history[0].id);
    });
    expect(h.documents.get("first")).toEqual([
      ["2", "=A1"],
      ["4", "=$A$2+A1"],
    ]);
    act(() => {
      expect(
        h.result.current.structure(deleteAxisActions(owner.getDocument()!, "row", [0]), (rows) =>
          rewriteFormulasForStructure(rows, { type: "delete", axis: "row", index: 0, count: 1 }),
        ),
      ).toBe(true);
    });
    await act(async () => {
      await owner.flush();
    });
    expect(h.documents.get("first")).toEqual([["4", "=$A$1+#REF!"]]);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it("keeps offline mutations in the originating document and resends on explicit reconnect", async () => {
    const h = harness();
    const owner = client();
    await owner.createRoom([["seed"]], "Owner");
    act(() => {
      h.result.current.attach("first", owner);
      owner.disconnect();
    });
    act(() => {
      expect(h.result.current.replaceMatrix([["offline"], ["new row"]])).toBe(true);
    });
    expect(h.result.current.state).toMatchObject({ status: "offline", pendingCount: 1 });
    expect(h.documents.get("first")).toEqual([["offline"], ["new row"]]);
    h.rerender({ activeId: "second" });
    await act(async () => {
      await owner.connect();
    });
    expect(h.documents.get("second")).toEqual([["second"]]);
    expect(owner.getState()).toMatchObject({ status: "online", pendingCount: 0 });
    h.rerender({ activeId: "first" });
    expect(h.result.current.state?.snapshot?.document.revision).toBe(1);
  });

  it("refuses viewer writes and marks revoked membership read-only without changing local data", async () => {
    const h = harness();
    const owner = client();
    const viewer = client();
    const room = await owner.createRoom([["protected"]], "Owner");
    const invite = await owner.invite("viewer");
    await viewer.joinRoom(room.roomId, invite.token, "Viewer");
    act(() => h.result.current.attach("first", viewer));
    expect(h.result.current.readOnly).toBe(true);
    act(() => {
      expect(h.result.current.replaceMatrix([["forbidden"]])).toBe(false);
    });
    expect(h.documents.get("first")).toEqual([["protected"]]);
    expect(h.onError).toHaveBeenCalledOnce();
    await act(async () => {
      await owner.revoke(viewer.getState().memberId!);
      await expect(viewer.sync()).rejects.toMatchObject({ status: 403 });
    });
    await waitFor(() => expect(h.result.current.state?.status).toBe("blocked"));
    expect(h.result.current.readOnly).toBe(true);
    expect(viewer.getPendingOperations()).toHaveLength(0);
  });

  it("does not infer row deletion from a shorter matrix and rejects oversized shape reduction atomically", async () => {
    const h = harness();
    const owner = client();
    await owner.createRoom(
      [
        ["keep", "safe"],
        ["other", "row"],
      ],
      "Owner",
    );
    act(() => h.result.current.attach("first", owner));
    act(() => {
      expect(h.result.current.replaceMatrix([["changed"]])).toBe(false);
    });
    expect(h.documents.get("first")).toEqual([
      ["keep", "safe"],
      ["other", "row"],
    ]);
    expect(owner.getPendingOperations()).toHaveLength(0);
    expect(owner.getState().snapshot!.history).toHaveLength(0);
    expect(h.onError).toHaveBeenCalledWith(expect.stringContaining("explicit structural actions"));
  });
});
