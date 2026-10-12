/** The wire model contains raw strings only. Nothing here is persisted into CSV. */
export type CollaborationRole = "owner" | "editor" | "viewer";
export type Axis = "row" | "column";
export type AxisEntry = { id: string; deleted: boolean; touched: number };
export type SharedCell = { value: string; revision: number };
export type SharedDocument = {
  rows: AxisEntry[];
  columns: AxisEntry[];
  cells: Record<string, SharedCell>;
  revision: number;
};

export type CollaborationAction =
  | { type: "set-cell"; rowId: string; columnId: string; value: string; ifRevision?: number }
  | { type: "insert"; axis: Axis; id: string; afterId: string | null }
  | { type: "delete" | "restore"; axis: Axis; id: string; ifRevision?: number }
  | { type: "reorder"; axis: Axis; ids: string[]; ifRevision?: number };

export type CollaborationOperation = {
  id: string;
  baseRevision: number;
  actions: CollaborationAction[];
  undoOf?: string;
  restoreOf?: string;
  restoreBefore?: boolean;
};
export type CollaborationConflict = {
  kind: "overwritten-cell" | "deleted-target";
  rowId: string;
  columnId: string;
  previousValue: string;
  value: string;
};
export type CollaborationHistoryEntry = {
  id: string;
  revision: number;
  memberId: string;
  displayName: string;
  timestamp: number;
  actions: CollaborationAction[];
  inverse: CollaborationAction[];
  conflicts: CollaborationConflict[];
  undoOf?: string;
  restoreOf?: string;
  restoreBefore?: boolean;
};
export type CollaborationMember = {
  id: string;
  displayName: string;
  role: CollaborationRole;
  active: boolean;
};
export type CollaborationSnapshot = {
  roomId: string;
  document: SharedDocument;
  members: CollaborationMember[];
  invites: { id: string; role: "editor" | "viewer"; expiresAt: number }[];
  history: CollaborationHistoryEntry[];
  stopped: boolean;
  expiresAt: number;
  retention: { maxHistory: number; maxOperations: number; maxCells: number };
};
export type CollaborationSession = {
  roomId: string;
  memberId: string;
  token: string;
  snapshot: CollaborationSnapshot;
};

export const COLLABORATION_LIMITS = Object.freeze({
  maxRows: 5_000,
  maxColumns: 500,
  maxCells: 50_000,
  maxCellLength: 32_768,
  maxActions: 5_000,
  maxHistory: 100,
  maxOperations: 10_000,
  maxDocumentBytes: 4 * 1024 * 1024,
  maxRoomBytes: 16 * 1024 * 1024,
  maxQueuedOperations: 100,
  maxQueuedBytes: 4 * 1024 * 1024,
  maxOperationBytes: 1024 * 1024,
});

export class CollaborationError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "CollaborationError";
    this.code = code;
    this.status = status;
  }
}

export function collaborationId(): string {
  return crypto.randomUUID();
}

export function validId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
}

export function cellKey(rowId: string, columnId: string): string {
  return `${rowId}:${columnId}`;
}

export function activeIds(document: SharedDocument, axis: Axis): string[] {
  return (axis === "row" ? document.rows : document.columns)
    .filter((entry) => !entry.deleted)
    .map((entry) => entry.id);
}

export function sharedDocumentRows(document: SharedDocument): string[][] {
  const columns = activeIds(document, "column");
  return activeIds(document, "row").map((rowId) =>
    columns.map((columnId) => document.cells[cellKey(rowId, columnId)]?.value ?? ""),
  );
}

export function createSharedDocument(rows: unknown): SharedDocument {
  if (!Array.isArray(rows) || rows.some((row) => !Array.isArray(row))) {
    throw new CollaborationError("invalid-rows", "A string matrix is required.");
  }
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (
    rows.length > COLLABORATION_LIMITS.maxRows ||
    width > COLLABORATION_LIMITS.maxColumns ||
    rows.length * width > COLLABORATION_LIMITS.maxCells
  ) {
    throw new CollaborationError(
      "document-limit",
      "This table exceeds the sharing size limit.",
      413,
    );
  }
  const document: SharedDocument = {
    rows: rows.map(() => ({ id: collaborationId(), deleted: false, touched: 0 })),
    columns: Array.from({ length: width }, () => ({
      id: collaborationId(),
      deleted: false,
      touched: 0,
    })),
    cells: {},
    revision: 0,
  };
  rows.forEach((row, r) =>
    row.forEach((value: unknown, c: number) => {
      if (typeof value !== "string" || value.length > COLLABORATION_LIMITS.maxCellLength) {
        throw new CollaborationError("invalid-value", "Shared cells must be bounded raw strings.");
      }
      if (value !== "")
        document.cells[cellKey(document.rows[r].id, document.columns[c].id)] = {
          value,
          revision: 0,
        };
    }),
  );
  validateDocumentLimit(document);
  return document;
}

function validateDocumentLimit(document: SharedDocument): void {
  // Include tombstones in the cap: deleting must not permit unlimited retained data.
  if (
    document.rows.length > COLLABORATION_LIMITS.maxRows ||
    document.columns.length > COLLABORATION_LIMITS.maxColumns ||
    document.rows.length * document.columns.length > COLLABORATION_LIMITS.maxCells ||
    new TextEncoder().encode(JSON.stringify(document)).length >
      COLLABORATION_LIMITS.maxDocumentBytes
  ) {
    throw new CollaborationError(
      "document-limit",
      "Sharing capacity reached; save a local copy.",
      413,
    );
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate all untrusted input before applying any part of an atomic operation. */
export function validateOperation(value: unknown): asserts value is CollaborationOperation {
  if (
    !object(value) ||
    !validId(value.id) ||
    !Number.isSafeInteger(value.baseRevision) ||
    (value.baseRevision as number) < 0 ||
    !Array.isArray(value.actions) ||
    value.actions.length > COLLABORATION_LIMITS.maxActions ||
    (value.undoOf !== undefined && !validId(value.undoOf)) ||
    (value.restoreOf !== undefined && !validId(value.restoreOf)) ||
    (value.restoreBefore !== undefined &&
      (typeof value.restoreBefore !== "boolean" || value.restoreOf === undefined)) ||
    (value.undoOf !== undefined && value.restoreOf !== undefined)
  ) {
    throw new CollaborationError("invalid-operation", "Invalid collaboration operation.");
  }
  if (value.actions.length === 0 && value.undoOf === undefined && value.restoreOf === undefined) {
    throw new CollaborationError("empty-operation", "An operation needs at least one change.");
  }
  for (const action of value.actions) {
    if (!object(action)) throw new CollaborationError("invalid-action", "Invalid action.");
    if (
      action.ifRevision !== undefined &&
      (!Number.isSafeInteger(action.ifRevision) || (action.ifRevision as number) < 0)
    ) {
      throw new CollaborationError("invalid-revision", "Invalid conditional revision.");
    }
    if (action.type === "set-cell") {
      if (
        !validId(action.rowId) ||
        !validId(action.columnId) ||
        typeof action.value !== "string" ||
        action.value.length > COLLABORATION_LIMITS.maxCellLength
      ) {
        throw new CollaborationError("invalid-cell", "Invalid cell change.");
      }
    } else if (["insert", "delete", "restore", "reorder"].includes(String(action.type))) {
      if (action.axis !== "row" && action.axis !== "column")
        throw new CollaborationError("invalid-axis", "Invalid axis.");
      if (action.type === "reorder") {
        if (
          !Array.isArray(action.ids) ||
          !action.ids.every(validId) ||
          new Set(action.ids).size !== action.ids.length
        ) {
          throw new CollaborationError("invalid-order", "Invalid order.");
        }
      } else if (
        !validId(action.id) ||
        (action.type === "insert" && action.afterId !== null && !validId(action.afterId))
      ) {
        throw new CollaborationError("invalid-target", "Invalid structural target.");
      }
    } else throw new CollaborationError("invalid-action", "Unknown collaboration action.");
  }
}

export function applyCollaborationOperation(
  source: SharedDocument,
  operation: CollaborationOperation,
): {
  document: SharedDocument;
  inverse: CollaborationAction[];
  conflicts: CollaborationConflict[];
} {
  validateOperation(operation);
  if (operation.baseRevision > source.revision)
    throw new CollaborationError("future-revision", "Sync before sending this operation.", 409);
  const document = structuredClone(source);
  const revision = source.revision + 1;
  const inverse: CollaborationAction[] = [];
  const conflicts: CollaborationConflict[] = [];
  for (const action of operation.actions) {
    if (action.type === "set-cell") {
      const row = document.rows.find((entry) => entry.id === action.rowId);
      const column = document.columns.find((entry) => entry.id === action.columnId);
      if (!row || !column)
        throw new CollaborationError(
          "missing-target",
          "A referenced row or column has not arrived. Sync and retry.",
          409,
        );
      const key = cellKey(row.id, column.id);
      const previous = document.cells[key] ?? { value: "", revision: 0 };
      if (
        action.ifRevision !== undefined &&
        previous.revision !== action.ifRevision &&
        previous.revision !== revision
      ) {
        throw new CollaborationError(
          "undo-conflict",
          "A later edit changed this cell. Restore a chosen history entry instead.",
          409,
        );
      }
      if (
        previous.revision > operation.baseRevision &&
        previous.revision !== revision &&
        previous.value !== action.value
      ) {
        conflicts.push({
          kind: "overwritten-cell",
          rowId: row.id,
          columnId: column.id,
          previousValue: previous.value,
          value: action.value,
        });
      }
      if (row.deleted || column.deleted) {
        conflicts.push({
          kind: "deleted-target",
          rowId: row.id,
          columnId: column.id,
          previousValue: previous.value,
          value: action.value,
        });
      }
      inverse.unshift({
        type: "set-cell",
        rowId: row.id,
        columnId: column.id,
        value: previous.value,
        ifRevision: revision,
      });
      document.cells[key] = { value: action.value, revision };
      row.touched = revision;
      column.touched = revision;
      continue;
    }
    const entries = action.axis === "row" ? document.rows : document.columns;
    if (action.type === "insert") {
      if (entries.some((entry) => entry.id === action.id))
        throw new CollaborationError(
          "duplicate-id",
          "Row or column identity is already in use.",
          409,
        );
      const index =
        action.afterId === null ? -1 : entries.findIndex((entry) => entry.id === action.afterId);
      if (action.afterId !== null && index < 0)
        throw new CollaborationError(
          "missing-target",
          "The insertion anchor has not arrived. Sync and retry.",
          409,
        );
      entries.splice(index + 1, 0, { id: action.id, deleted: false, touched: revision });
      inverse.unshift({ type: "delete", axis: action.axis, id: action.id, ifRevision: revision });
    } else if (action.type === "reorder") {
      const current = entries.filter((entry) => !entry.deleted);
      if (action.ifRevision !== undefined && source.revision !== action.ifRevision) {
        throw new CollaborationError("undo-conflict", "The table changed after this reorder.", 409);
      }
      if (
        action.ids.length !== current.length ||
        action.ids.some((id) => !current.some((entry) => entry.id === id))
      ) {
        throw new CollaborationError(
          "structure-changed",
          "Rows or columns changed. Sync before reordering.",
          409,
        );
      }
      inverse.unshift({
        type: "reorder",
        axis: action.axis,
        ids: current.map((entry) => entry.id),
        ifRevision: revision,
      });
      const byId = new Map(entries.map((entry) => [entry.id, entry]));
      // Tombstones retain their identity; active order is explicit, never an index-based overwrite.
      const ordered = [
        ...action.ids.map((id) => byId.get(id)!),
        ...entries.filter((entry) => entry.deleted),
      ];
      if (action.axis === "row") document.rows = ordered;
      else document.columns = ordered;
    } else {
      const entry = entries.find((item) => item.id === action.id);
      if (!entry) throw new CollaborationError("missing-target", "Unknown row or column.", 409);
      if (
        action.ifRevision !== undefined &&
        entry.touched !== action.ifRevision &&
        entry.touched !== revision
      ) {
        throw new CollaborationError(
          "undo-conflict",
          "A later edit touched this row or column. Review history first.",
          409,
        );
      }
      const deleted = action.type === "delete";
      if (entry.deleted !== deleted) {
        inverse.unshift({
          type: deleted ? "restore" : "delete",
          axis: action.axis,
          id: entry.id,
          ifRevision: revision,
        });
        entry.deleted = deleted;
        entry.touched = revision;
      }
    }
  }
  document.revision = revision;
  validateDocumentLimit(document);
  return { document, inverse, conflicts };
}

/** A deliberate restore is a new write; Undo remains conditional and cannot erase a later edit. */
export function actionsForHistoryRestore(
  entry: CollaborationHistoryEntry,
  document: SharedDocument,
): CollaborationAction[] {
  return entry.actions.map((action): CollaborationAction => {
    if (action.type === "set-cell")
      return {
        type: "set-cell",
        rowId: action.rowId,
        columnId: action.columnId,
        value: action.value,
      };
    if (action.type === "insert") {
      const entries = action.axis === "row" ? document.rows : document.columns;
      return entries.some((item) => item.id === action.id)
        ? { type: "restore", axis: action.axis, id: action.id }
        : action;
    }
    if (action.type === "reorder")
      return { type: "reorder", axis: action.axis, ids: [...action.ids] };
    return { type: action.type, axis: action.axis, id: action.id };
  });
}

/** Same-shape edits only. Call structural helpers for insert/delete/reorder, never guess from cell values. */
export function actionsForCellMatrix(
  document: SharedDocument,
  rows: string[][],
): CollaborationAction[] {
  const rowIds = activeIds(document, "row");
  const columnIds = activeIds(document, "column");
  if (rows.length !== rowIds.length || rows.some((row) => row.length > columnIds.length)) {
    throw new CollaborationError(
      "explicit-structure-required",
      "Use a structural operation to change shared table dimensions.",
    );
  }
  const actions: CollaborationAction[] = [];
  rowIds.forEach((rowId, r) =>
    columnIds.forEach((columnId, c) => {
      const value = rows[r][c] ?? "";
      if (value !== (document.cells[cellKey(rowId, columnId)]?.value ?? ""))
        actions.push({ type: "set-cell", rowId, columnId, value });
    }),
  );
  return actions;
}

export function insertAxisActions(
  document: SharedDocument,
  axis: Axis,
  index: number,
  count = 1,
): CollaborationAction[] {
  const ids = activeIds(document, axis);
  if (
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index > ids.length ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > 500
  ) {
    throw new CollaborationError("invalid-insert", "Invalid insertion range.");
  }
  let afterId: string | null = ids[index - 1] ?? null;
  return Array.from({ length: count }, () => {
    const id = collaborationId();
    const action: CollaborationAction = { type: "insert", axis, id, afterId };
    afterId = id;
    return action;
  });
}

export function deleteAxisActions(
  document: SharedDocument,
  axis: Axis,
  indexes: number[],
): CollaborationAction[] {
  const ids = activeIds(document, axis);
  return [...new Set(indexes)].map((index) => {
    if (!Number.isSafeInteger(index) || !ids[index])
      throw new CollaborationError("invalid-delete", "Invalid deletion range.");
    return { type: "delete", axis, id: ids[index] };
  });
}
