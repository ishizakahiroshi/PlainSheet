// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createCollaborationRelay } from "../../server/relay";
import {
  actionsForCellMatrix,
  activeIds,
  applyCollaborationOperation,
  CollaborationClient,
  createSharedDocument,
  deleteAxisActions,
  insertAxisActions,
  sharedDocumentRows,
  validateOperation,
  type CollaborationAction,
  type CollaborationOperation,
  type CollaborationSession,
  type SharedDocument,
} from "../lib/collaboration";
import {
  evaluateFormulaSheet,
  rewriteFormulasForStructure,
  type FormulaStructuralChange,
} from "../lib/formula";

const origin = "http://localhost:1420";
let relay: ReturnType<typeof createCollaborationRelay>;
let endpoint: string;
const clients: CollaborationClient[] = [];

function client(fetcher?: typeof fetch) {
  const result = new CollaborationClient({ endpoint, origin, fetch: fetcher });
  clients.push(result);
  return result;
}
async function pair(rows: string[][], fetcher?: typeof fetch) {
  const owner = client(fetcher);
  const editor = client();
  const room = await owner.createRoom(rows, "Owner");
  const invitation = await owner.invite("editor");
  await editor.joinRoom(room.roomId, invitation.token, "Editor");
  await owner.sync();
  return { owner, editor };
}
function setCell(
  document: SharedDocument,
  row: number,
  column: number,
  value: string,
): CollaborationAction {
  return {
    type: "set-cell",
    rowId: activeIds(document, "row")[row],
    columnId: activeIds(document, "column")[column],
    value,
  };
}
function structuralBatch(document: SharedDocument, change: FormulaStructuralChange) {
  const axis = change.axis === "row" ? "row" : "column";
  const actions =
    change.type === "insert"
      ? insertAxisActions(document, axis, change.index, change.count)
      : deleteAxisActions(
          document,
          axis,
          Array.from({ length: change.count }, (_, i) => change.index + i),
        );
  const projected = applyCollaborationOperation(document, {
    id: "local-projection",
    baseRevision: document.revision,
    actions,
  }).document;
  return [
    ...actions,
    ...actionsForCellMatrix(
      projected,
      rewriteFormulasForStructure(sharedDocumentRows(projected), change),
    ),
  ];
}
function enqueueStructure(target: CollaborationClient, change: FormulaStructuralChange) {
  const document = target.getDocument()!;
  return target.enqueue(structuralBatch(document, change), { expectedRevision: document.revision });
}
const insertRow: FormulaStructuralChange = { type: "insert", axis: "row", index: 0, count: 1 };
const insertColumn: FormulaStructuralChange = { type: "insert", axis: "col", index: 0, count: 1 };
const deleteRow: FormulaStructuralChange = { type: "delete", axis: "row", index: 0, count: 1 };
const deleteColumn: FormulaStructuralChange = { type: "delete", axis: "col", index: 0, count: 1 };

async function raw(path: string, method: string, body?: unknown, token?: string) {
  return fetch(`${endpoint}${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

beforeEach(async () => {
  relay = createCollaborationRelay({ allowedOrigins: [origin] });
  await new Promise<void>((resolve) => relay.server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(relay.server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  clients.splice(0).forEach((item) => item.dispose());
  relay.server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    relay.server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("atomic coordinate-derived revision guards", () => {
  it("validates optional guards and leaves the source untouched on a stale atomic batch", () => {
    const source = createSharedDocument([["2", "=A1*2"]]);
    const operation: CollaborationOperation = {
      id: "guarded",
      baseRevision: 0,
      expectedRevision: 0,
      actions: structuralBatch(source, insertRow),
    };
    for (const expectedRevision of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, "0", null]) {
      expect(() => validateOperation({ ...operation, expectedRevision })).toThrow(
        "Invalid collaboration operation",
      );
    }
    expect(() => validateOperation(operation)).not.toThrow();
    expect(() => validateOperation({ ...operation, expectedRevision: undefined })).not.toThrow();
    const applied = applyCollaborationOperation(source, operation).document;
    const saved = structuredClone(applied);
    expect(() => applyCollaborationOperation(applied, { ...operation, id: "stale" })).toThrow(
      "table changed",
    );
    expect(applied).toEqual(saved);
    expect(source.revision).toBe(0);
  });

  it("rejects concurrent row-zero formula batches, retains blocked work, and only accepts explicit recomputation", async () => {
    let ownerSends = 0;
    const { owner, editor } = await pair([["2", "=A1*2"]], async (input, init) => {
      if (String(input).endsWith("/operations")) ++ownerSends;
      return fetch(input, init);
    });
    const staleId = enqueueStructure(owner, insertRow);
    const original = owner.getPendingOperations()[0];
    enqueueStructure(editor, insertRow);
    await editor.flush();
    await expect(owner.flush()).rejects.toMatchObject({ status: 409, code: "revision-conflict" });
    expect(owner.getState()).toMatchObject({ status: "blocked", pendingCount: 1 });
    expect(owner.getPendingOperations()).toEqual([original]);
    await owner.sync();
    await owner.flush();
    await owner.flush();
    expect(ownerSends).toBe(1);
    expect(owner.getPendingOperations()).toEqual([original]);
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([
      ["", ""],
      ["2", "=A2*2"],
    ]);
    expect(owner.getState().snapshot!.history).toHaveLength(1);
    expect(
      evaluateFormulaSheet(sharedDocumentRows(owner.getDocument()!), { enabled: true })
        .displayRows[1][1],
    ).toBe("4");
    // An explicit retry still sends the original guard and identity; it never silently rebases.
    await expect(owner.connect()).rejects.toMatchObject({ code: "revision-conflict" });
    expect(owner.getPendingOperations()).toEqual([original]);
    owner.discardPending(staleId);
    const freshId = enqueueStructure(owner, insertRow);
    expect(freshId).not.toBe(staleId);
    expect(owner.getPendingOperations()[0].expectedRevision).toBe(1);
    await owner.flush();
    await editor.sync();
    expect(owner.getDocument()).toEqual(editor.getDocument());
    expect(sharedDocumentRows(editor.getDocument()!)).toEqual([
      ["", ""],
      ["", ""],
      ["2", "=A3*2"],
    ]);
    expect(
      evaluateFormulaSheet(sharedDocumentRows(editor.getDocument()!), { enabled: true })
        .displayRows[2][1],
    ).toBe("4");
    expect(owner.getState()).toMatchObject({ status: "online", pendingCount: 0 });
  });

  it.each([
    ["same-axis inserts", insertRow, insertRow],
    ["crossed-axis inserts", insertRow, insertColumn],
    ["delete versus insert", deleteRow, insertColumn],
    ["crossed-axis deletes", deleteRow, deleteColumn],
    ["same-axis deletes", deleteColumn, deleteColumn],
  ] as const)(
    "atomically accepts only one concurrent %s batch with relative, absolute and range formulas",
    async (_label, first, second) => {
      const { owner, editor } = await pair([
        ["", "", "", "", ""],
        ["", "2", "3", "=B2*2", "=SUM($B$2:C2)"],
        ["", "", "", "", ""],
      ]);
      const source = owner.getDocument()!;
      enqueueStructure(owner, first);
      enqueueStructure(editor, second);
      const operations = [owner.getPendingOperations()[0], editor.getPendingOperations()[0]];
      const results = await Promise.allSettled([owner.flush(), editor.flush()]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
      await Promise.all([owner.sync(), editor.sync()]);
      const snapshot = owner.getState().snapshot!;
      expect(snapshot.history).toHaveLength(1);
      const accepted = operations.find((operation) => operation.id === snapshot.history[0].id)!;
      expect(snapshot.document).toEqual(applyCollaborationOperation(source, accepted).document);
      expect(owner.getDocument()).toEqual(editor.getDocument());
      const rows = sharedDocumentRows(snapshot.document);
      const evaluation = evaluateFormulaSheet(rows, { enabled: true });
      expect(evaluation.errors).toEqual([]);
      expect(
        rows.flatMap((row, r) =>
          row.flatMap((value, c) => (value.startsWith("=") ? [evaluation.displayRows[r][c]] : [])),
        ),
      ).toEqual(["4", "5"]);
      const blocked = [owner, editor].find(
        (participant) => participant.getState().status === "blocked",
      )!;
      expect(blocked.getState().pendingCount).toBe(1);
      expect(blocked.getPendingOperations()[0]).toEqual(
        operations.find((operation) => operation.id !== accepted.id),
      );
    },
  );

  it("retains offline dependent batches without projecting later edits past a rejected guard", async () => {
    const { owner, editor } = await pair([["2", "=A1*2"]]);
    owner.disconnect();
    enqueueStructure(owner, insertRow);
    enqueueStructure(owner, insertRow);
    const pending = owner.getPendingOperations();
    expect(pending.map((operation) => operation.expectedRevision)).toEqual([0, 1]);
    expect(sharedDocumentRows(owner.getDocument()!)[2][1]).toBe("=A3*2");
    enqueueStructure(editor, insertColumn);
    await editor.flush();
    await expect(owner.connect()).rejects.toMatchObject({ code: "revision-conflict" });
    expect(owner.getState()).toMatchObject({ status: "blocked", pendingCount: 2 });
    expect(owner.getPendingOperations()).toEqual(pending);
    expect(owner.getDocument()).toEqual(owner.getState().snapshot!.document);
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([["", "2", "=B1*2"]]);
  });

  it("accepts dependent offline batches when their exact projected revisions remain valid", async () => {
    const owner = client();
    await owner.createRoom([["2", "=A1*2"]], "Owner");
    owner.disconnect();
    enqueueStructure(owner, insertRow);
    enqueueStructure(owner, insertRow);
    await owner.connect();
    expect(owner.getState().pendingCount).toBe(0);
    expect(sharedDocumentRows(owner.getDocument()!)[2][1]).toBe("=A3*2");
    expect(owner.getDocument()!.revision).toBe(2);
    expect(owner.getState().snapshot!.history.map((entry) => entry.conflicts)).toEqual([[], []]);
  });

  it("guards a structural batch even when its original formula diff is empty", async () => {
    const { owner, editor } = await pair([["2", ""]]);
    enqueueStructure(owner, insertRow);
    const queued = owner.getPendingOperations()[0];
    expect(queued.actions.every((action) => action.type === "insert")).toBe(true);
    await editor.submit([setCell(editor.getDocument()!, 0, 1, "=A1*2")]);
    await expect(owner.flush()).rejects.toMatchObject({ code: "revision-conflict" });
    await owner.sync();
    expect(owner.getPendingOperations()).toEqual([queued]);
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([["2", "=A1*2"]]);
    expect(owner.getState().snapshot!.history).toHaveLength(1);
    expect(owner.getState()).toMatchObject({ status: "blocked", pendingCount: 1 });
  });

  it("replays a guarded lost ACK before checking its now-stale revision and keeps retry bytes immutable", async () => {
    let loseAck = false;
    const sent: string[] = [];
    const { owner, editor } = await pair([["2", "=A1*2"]], async (input, init) => {
      if (String(input).endsWith("/operations")) sent.push(String(init?.body));
      const response = await fetch(input, init);
      if (loseAck && String(input).endsWith("/operations")) {
        loseAck = false;
        await response.json();
        throw new TypeError("synthetic lost ACK");
      }
      return response;
    });
    const source = owner.getDocument()!;
    const actions = structuralBatch(source, insertRow);
    owner.enqueue(actions, { expectedRevision: source.revision });
    const queued = owner.getPendingOperations()[0];
    actions.splice(0); // The caller cannot mutate the queued payload.
    loseAck = true;
    await expect(owner.flush()).rejects.toThrow("synthetic lost ACK");
    await editor.sync();
    await editor.submit([setCell(editor.getDocument()!, 0, 0, "peer")]);
    await owner.sync();
    expect(owner.getPendingOperations()).toEqual([queued]);
    expect(owner.getDocument()).toEqual(owner.getState().snapshot!.document);
    await owner.connect();
    expect(sent).toHaveLength(2);
    expect(sent[1]).toBe(sent[0]);
    expect(owner.getState().pendingCount).toBe(0);
    expect(owner.getDocument()!.revision).toBe(2);
    expect(owner.getState().snapshot!.history).toHaveLength(2);
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([
      ["peer", ""],
      ["2", "=A2*2"],
    ]);
  });

  it("keeps unguarded stable-ID concurrent edits mergeable", async () => {
    const { owner, editor } = await pair([["first", "second"]]);
    const document = owner.getDocument()!;
    owner.enqueue([...insertAxisActions(document, "row", 0), setCell(document, 0, 0, "A")]);
    editor.enqueue([...insertAxisActions(document, "column", 0), setCell(document, 0, 1, "B")]);
    expect(owner.getPendingOperations()[0].expectedRevision).toBeUndefined();
    await Promise.all([owner.flush(), editor.flush()]);
    await Promise.all([owner.sync(), editor.sync()]);
    expect(owner.getDocument()).toEqual(editor.getDocument());
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([
      ["", "", ""],
      ["", "A", "B"],
    ]);
    expect(owner.getState().pendingCount + editor.getState().pendingCount).toBe(0);
  });

  it("validates the guard on the real wire and rejects a stale entire batch without retaining history", async () => {
    const session: CollaborationSession = await (
      await raw("/rooms", "POST", { rows: [["2", "=A1*2"]], displayName: "Owner" })
    ).json();
    const path = `/rooms/${session.roomId}/operations`;
    const operation = {
      id: "wire-guard",
      baseRevision: 0,
      expectedRevision: 0,
      actions: structuralBatch(session.snapshot.document, insertRow),
    };
    const invalid = await raw(path, "POST", { ...operation, expectedRevision: "0" }, session.token);
    expect(invalid.status).toBe(400);
    expect((await raw(path, "POST", operation, session.token)).status).toBe(200);
    const stale = await raw(path, "POST", { ...operation, id: "wire-stale" }, session.token);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ error: "revision-conflict" });
    const snapshot = await (
      await raw(`/rooms/${session.roomId}`, "GET", undefined, session.token)
    ).json();
    expect(snapshot.document.revision).toBe(1);
    expect(snapshot.history).toHaveLength(1);
    expect(sharedDocumentRows(snapshot.document)).toEqual([
      ["", ""],
      ["2", "=A2*2"],
    ]);
  });
});

describe("history operations retain their original positional context", () => {
  it("rejects structural Undo after a peer adds a new formula, even after syncing the latest revision", async () => {
    const { owner, editor } = await pair([["2", ""]]);
    const operation = await owner.submit(insertAxisActions(owner.getDocument()!, "row", 0));
    await editor.sync();
    await editor.submit([setCell(editor.getDocument()!, 1, 1, "=A2*2")]);
    await owner.sync();
    const before = owner.getState().snapshot!.document;
    await expect(owner.undo(operation)).rejects.toMatchObject({
      code: "undo-conflict",
      status: 409,
    });
    expect(owner.getPendingOperations()[0]).toMatchObject({ undoOf: operation, baseRevision: 2 });
    expect(owner.getState()).toMatchObject({ status: "blocked", pendingCount: 1 });
    await owner.sync();
    expect(owner.getState().snapshot!.document).toEqual(before);
    expect(owner.getDocument()).toEqual(before);
    expect(
      evaluateFormulaSheet(sharedDocumentRows(before), { enabled: true }).displayRows[1][1],
    ).toBe("4");
  });

  it("does not let a forged current-revision guard bypass the original structural Undo revision", async () => {
    const session: CollaborationSession = await (
      await raw("/rooms", "POST", { rows: [["2", ""]], displayName: "Owner" })
    ).json();
    const path = `/rooms/${session.roomId}/operations`;
    const first = await raw(
      path,
      "POST",
      {
        id: "insert-original",
        baseRevision: 0,
        actions: insertAxisActions(session.snapshot.document, "row", 0),
      },
      session.token,
    );
    const inserted = (await first.json()).snapshot.document as SharedDocument;
    await raw(
      path,
      "POST",
      { id: "new-formula", baseRevision: 1, actions: [setCell(inserted, 1, 1, "=A2*2")] },
      session.token,
    );
    const response = await raw(
      path,
      "POST",
      {
        id: "unsafe-undo",
        baseRevision: 2,
        expectedRevision: 2,
        actions: [],
        undoOf: "insert-original",
      },
      session.token,
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "undo-conflict" });
  });

  it.each([false, true])(
    "rejects unsafe structural history restore (before=%s) after a new formula",
    async (before) => {
      const { owner, editor } = await pair([["2", ""]]);
      const operation = await owner.submit(insertAxisActions(owner.getDocument()!, "row", 0));
      await editor.sync();
      await editor.submit([setCell(editor.getDocument()!, 1, 1, "=A2*2")]);
      await owner.sync();
      const original = owner.getDocument();
      await expect(owner.restore(operation, before)).rejects.toMatchObject({
        code: "history-conflict",
      });
      await owner.sync();
      expect(owner.getDocument()).toEqual(original);
      expect(owner.getState()).toMatchObject({ status: "blocked", pendingCount: 1 });
    },
  );

  it("rejects replay of a stored formula after its positional context changed", async () => {
    const { owner, editor } = await pair([["2", ""]]);
    const formula = await owner.submit([setCell(owner.getDocument()!, 0, 1, "=A1*2")]);
    await editor.sync();
    enqueueStructure(editor, insertRow);
    await editor.flush();
    await owner.sync();
    await expect(owner.restore(formula)).rejects.toMatchObject({ code: "history-conflict" });
    expect(sharedDocumentRows(owner.getDocument()!)[1][1]).toBe("=A2*2");
    expect(
      evaluateFormulaSheet(sharedDocumentRows(owner.getDocument()!), { enabled: true })
        .displayRows[1][1],
    ).toBe("4");
  });

  it("still permits immediate guarded structural Undo when its original revision is current", async () => {
    const owner = client();
    await owner.createRoom([["2", "=A1*2"]], "Owner");
    const operation = enqueueStructure(owner, insertRow);
    await owner.flush();
    await owner.undo(operation);
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual([["2", "=A1*2"]]);
    expect(owner.getState().pendingCount).toBe(0);
    expect(owner.getDocument()!.revision).toBe(2);
  });
});
