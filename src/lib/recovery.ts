import type { SheetMeta } from "../types/sheet";
import { DEFAULT_META } from "../types/sheet";

export const RECOVERY_KEY = "plainsheet.recovery.v1";
export const RECOVERY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RECOVERY_MAX_BYTES = 2 * 1024 * 1024;
export const RECOVERY_MAX_DRAFTS = 50;
export type RecoveryEdition = "browser" | "desktop";
export type RecoveryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type RecoveryDraft = {
  id: string;
  documentId: string;
  fileName: string;
  savedAt: number;
  expiresAt: number;
  rows: string[][];
  meta: Omit<SheetMeta, "filePath" | "fileName" | "sourceText">;
};
export type RecoveryState = {
  version: 1;
  enabled: boolean;
  edition: RecoveryEdition;
  consentedAt: number | null;
  drafts: RecoveryDraft[];
};
export type RecoveryResult<T> = { ok: true; value: T } | { ok: false; error: string };
export type RecoverySnapshotInput = {
  documentId: string;
  rows: readonly (readonly string[])[];
  meta: Partial<SheetMeta>;
};
export type RecoveryCopy = { rows: string[][]; meta: SheetMeta; recoveredFrom: string };

export function recoveryLocation(edition: RecoveryEdition): string {
  return edition === "desktop"
    ? "this app's local webview storage on this device"
    : "this browser profile's local storage for this site on this device";
}

function cleanMeta(meta: Partial<SheetMeta>): RecoveryDraft["meta"] {
  return {
    encoding: meta.encoding ?? DEFAULT_META.encoding,
    newline: meta.newline ?? DEFAULT_META.newline,
    delimiter: meta.delimiter ?? DEFAULT_META.delimiter,
    format: meta.format ?? "csv",
    dirty: true,
    csvFormulaGuard: meta.csvFormulaGuard ?? false,
    omitEmptyCells: meta.omitEmptyCells ?? false,
  };
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validMeta(meta: unknown): meta is RecoveryDraft["meta"] {
  if (!isObject(meta)) return false;
  return (
    typeof meta.encoding === "string" &&
    ["utf-8", "utf-8-bom", "cp932", "euc-jp", "latin-1"].includes(meta.encoding) &&
    typeof meta.newline === "string" &&
    ["LF", "CRLF"].includes(meta.newline) &&
    typeof meta.delimiter === "string" &&
    [",", "\t", ";", "|"].includes(meta.delimiter) &&
    typeof meta.format === "string" &&
    ["csv", "tsv", "markdown", "json", "yaml"].includes(meta.format) &&
    meta.dirty === true &&
    typeof meta.csvFormulaGuard === "boolean" &&
    typeof meta.omitEmptyCells === "boolean" &&
    !("filePath" in meta) &&
    !("sourceText" in meta)
  );
}
function validRows(rows: unknown): rows is string[][] {
  return (
    Array.isArray(rows) &&
    rows.length <= 100000 &&
    rows.every(
      (row) =>
        Array.isArray(row) && row.length <= 16384 && row.every((cell) => typeof cell === "string"),
    )
  );
}
function validDraft(draft: unknown, now: number): draft is RecoveryDraft {
  if (!isObject(draft)) return false;
  return (
    typeof draft.id === "string" &&
    /^recovery-[a-zA-Z0-9-]{8,100}$/.test(draft.id) &&
    typeof draft.documentId === "string" &&
    draft.documentId.length > 0 &&
    draft.documentId.length <= 200 &&
    typeof draft.fileName === "string" &&
    draft.fileName.length <= 500 &&
    typeof draft.savedAt === "number" &&
    Number.isSafeInteger(draft.savedAt) &&
    draft.savedAt >= 0 &&
    draft.savedAt <= now + 60000 &&
    typeof draft.expiresAt === "number" &&
    draft.expiresAt === draft.savedAt + RECOVERY_TTL_MS &&
    validRows(draft.rows) &&
    validMeta(draft.meta) &&
    !("filePath" in draft)
  );
}
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return `recovery-${crypto.randomUUID()}`;
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function")
    return `recovery-${Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16).padStart(8, "0")).join("")}`;
  throw new Error("Secure random identity is unavailable.");
}

/** Single-key synchronous replacement is atomic in localStorage. Errors never modify editor state. */
export function createRecoveryStore(
  storage: RecoveryStorage,
  edition: RecoveryEdition,
  options: { now?: () => number; createId?: () => string } = {},
) {
  const now = options.now ?? Date.now;
  const newId = options.createId ?? createId;
  let writesBlocked = false;
  const empty = (): RecoveryState => ({
    version: 1,
    enabled: false,
    edition,
    consentedAt: null,
    drafts: [],
  });
  const failure = <T>(error: string): RecoveryResult<T> => ({ ok: false, error });
  const save = (state: RecoveryState): RecoveryResult<RecoveryState> => {
    const encoded = JSON.stringify(state);
    if (encoded.length * 2 > RECOVERY_MAX_BYTES)
      return failure(
        "Recovery storage exceeds the 2 MiB limit. Delete a draft or use a smaller document. Editing is unaffected.",
      );
    try {
      storage.setItem(RECOVERY_KEY, encoded);
      return { ok: true, value: state };
    } catch {
      return failure(
        "The recovery draft was not saved: local storage is unavailable or full. Editing is unaffected.",
      );
    }
  };
  const inspect = (): RecoveryResult<RecoveryState> => {
    try {
      const encoded = storage.getItem(RECOVERY_KEY);
      if (encoded === null) return { ok: true, value: empty() };
      if (encoded.length * 2 > RECOVERY_MAX_BYTES)
        return failure("Recovery data exceeds the safety limit. Delete recovery data to reset it.");
      const state: unknown = JSON.parse(encoded);
      const timestamp = now();
      if (
        !isObject(state) ||
        state.version !== 1 ||
        state.edition !== edition ||
        state.enabled !== true ||
        typeof state.consentedAt !== "number" ||
        !Number.isSafeInteger(state.consentedAt) ||
        state.consentedAt < 0 ||
        state.consentedAt > timestamp + 60000 ||
        !Array.isArray(state.drafts) ||
        state.drafts.length > RECOVERY_MAX_DRAFTS ||
        !state.drafts.every((draft) => validDraft(draft, timestamp)) ||
        new Set(state.drafts.map((draft) => draft.id)).size !== state.drafts.length ||
        new Set(state.drafts.map((draft) => draft.documentId)).size !== state.drafts.length
      )
        return failure(
          "Recovery data is damaged or uses an unsupported version. Editing is unaffected; delete recovery data to reset it.",
        );
      const valid = state as unknown as RecoveryState;
      const drafts = valid.drafts.filter((draft) => draft.expiresAt > timestamp);
      const clean = { ...valid, drafts };
      if (drafts.length !== valid.drafts.length) {
        const result = save(clean);
        if (!result.ok)
          return failure(
            "Expired recovery drafts could not be deleted. No recovery success is claimed; editing is unaffected.",
          );
      }
      return { ok: true, value: { ...clean, enabled: !writesBlocked } };
    } catch {
      return failure(
        "Recovery storage cannot be read or is damaged. Editing is unaffected; delete recovery data to reset it.",
      );
    }
  };
  const enable = (consent: { acceptLocalContentStorage: true }): RecoveryResult<RecoveryState> => {
    if (consent?.acceptLocalContentStorage !== true)
      return failure("Explicit consent to local document-content storage is required.");
    const current = inspect();
    if (!current.ok) return current;
    const state = { ...current.value, enabled: true, consentedAt: now() };
    const saved = save(state);
    if (saved.ok) writesBlocked = false;
    return saved;
  };
  const writeSnapshot = (input: RecoverySnapshotInput): RecoveryResult<RecoveryDraft> => {
    if (writesBlocked) return failure("Recovery is off; no document content was written.");
    const current = inspect();
    if (!current.ok) return current;
    if (!current.value.enabled) return failure("Recovery is off; no document content was written.");
    if (
      typeof input.documentId !== "string" ||
      !input.documentId ||
      input.documentId.length > 200 ||
      !validRows(input.rows)
    )
      return failure(
        "This document exceeds recovery limits or has an invalid session identity. Editing is unaffected.",
      );
    let minimumBytes = 0;
    for (const row of input.rows) {
      minimumBytes += 4;
      for (const value of row) {
        minimumBytes += 2 * value.length + 6;
        if (minimumBytes > RECOVERY_MAX_BYTES)
          return failure("This document exceeds the 2 MiB recovery limit. Editing is unaffected.");
      }
    }
    const previous = current.value.drafts.find((draft) => draft.documentId === input.documentId);
    if (!previous && current.value.drafts.length >= RECOVERY_MAX_DRAFTS)
      return failure(
        "Recovery has reached its 50-document limit. Delete a draft before saving another.",
      );
    let id: string;
    try {
      id = previous?.id ?? newId();
    } catch {
      return failure(
        "Recovery could not create a random document identity. Editing is unaffected.",
      );
    }
    const timestamp = now();
    const draft: RecoveryDraft = {
      id,
      documentId: input.documentId,
      fileName: (input.meta.fileName ?? "Untitled").slice(0, 500),
      savedAt: timestamp,
      expiresAt: timestamp + RECOVERY_TTL_MS,
      rows: input.rows.map((row) => [...row]),
      meta: cleanMeta(input.meta),
    };
    if (
      current.value.drafts.some((entry) => entry.id === id && entry.documentId !== input.documentId)
    )
      return failure("Recovery identity collision. No draft was overwritten.");
    if (!validDraft(draft, timestamp))
      return failure("Invalid recovery snapshot. Editing is unaffected.");
    const drafts = [
      ...current.value.drafts.filter((entry) => entry.documentId !== input.documentId),
      draft,
    ];
    const result = save({ ...current.value, drafts });
    return result.ok ? { ok: true, value: draft } : result;
  };
  const deleteOne = (id: string): RecoveryResult<RecoveryState> => {
    const current = inspect();
    if (!current.ok) return current;
    if (!current.value.enabled && !current.value.drafts.length) return current;
    return save({
      ...current.value,
      enabled: true,
      drafts: current.value.drafts.filter((draft) => draft.id !== id),
    });
  };
  const deleteAll = (): RecoveryResult<RecoveryState> => {
    const current = inspect();
    if (current.ok && current.value.enabled) return save({ ...current.value, drafts: [] });
    try {
      storage.removeItem(RECOVERY_KEY);
      return { ok: true, value: empty() };
    } catch {
      return failure("Recovery data could not be deleted. It may still be stored on this device.");
    }
  };
  const disable = (): RecoveryResult<RecoveryState> => {
    writesBlocked = true;
    try {
      storage.removeItem(RECOVERY_KEY);
      return { ok: true, value: empty() };
    } catch {
      return failure(
        "New recovery writes are stopped for this session, but stored drafts could not be deleted. They may remain after restart.",
      );
    }
  };
  const restoreCopy = (id: string): RecoveryResult<RecoveryCopy> => {
    const current = inspect();
    if (!current.ok) return current;
    const draft = current.value.drafts.find((entry) => entry.id === id);
    if (!draft) return failure("That recovery draft no longer exists or has expired.");
    // Whitelist fields again; no original path/source text can escape even from stored metadata.
    return {
      ok: true,
      value: {
        rows: draft.rows.map((row) => [...row]),
        meta: { ...cleanMeta(draft.meta), fileName: `Recovered-${draft.fileName}`, dirty: true },
        recoveredFrom: draft.id,
      },
    };
  };
  return {
    inspect,
    enable,
    writeSnapshot,
    deleteOne,
    deleteAll,
    disable,
    restoreCopy,
    location: recoveryLocation(edition),
  };
}
export type RecoveryStore = ReturnType<typeof createRecoveryStore>;
