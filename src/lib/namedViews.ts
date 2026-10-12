import type { FilterMap } from "../hooks/useFilter";
import type { ColumnWidthMap } from "../types/sheet";

export const NAMED_VIEWS_STORAGE_KEY = "plainsheet.namedViews.v1";
export const NAMED_VIEWS_MAX_BYTES = 256 * 1024;
const MAX_VIEWS = 100;
const MAX_GROUPS = 100;
const MAX_COLUMNS = 16384;
export type FilterEntries = [number, string[]][];
export type ColumnSignature = { version: 1; count: number; headerRow: boolean; headers: string[] };
export type NamedView = {
  id: string;
  name: string;
  filters: FilterEntries;
  colWidths: ColumnWidthMap;
  signature: ColumnSignature;
};
export type NamedViewApplication = Pick<NamedView, "filters" | "colWidths"> & {
  id: string | null;
  name: string | null;
};
export type NamedViewGroup = { id: string; fileName: string; views: NamedView[] };
export type NamedViewDocument = NamedViewGroup & { persistent: boolean };
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type StorageEnvelope = { version: 1; groups: NamedViewGroup[] };
export type SchemaCheck = {
  safe: boolean;
  positional: boolean;
  reason: "match" | "count" | "headers" | "duplicates" | "header-mode";
};
export class NamedViewsError extends Error {
  constructor(
    public readonly code: "invalid" | "storage" | "limit" | "name" | "schema" | "missing",
  ) {
    super(code);
    this.name = "NamedViewsError";
  }
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const newId = () => crypto.randomUUID();
const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const index = (value: unknown, count = MAX_COLUMNS): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value < count;
const boundedString = (value: unknown, max = 256): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;

export function snapshotFilters(filters: FilterMap | FilterEntries): FilterEntries {
  const entries: FilterEntries = [];
  for (const [column, values] of filters) entries.push([column, [...new Set(values)].sort()]);
  return entries.sort((a, b) => a[0] - b[0]);
}

/** Header interpretation is a validation guard only. Applying a view never changes it. */
export function createColumnSignature(
  rows: readonly (readonly string[])[],
  headerRow = true,
): ColumnSignature {
  const count = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return {
    version: 1,
    count,
    headerRow,
    headers: headerRow ? Array.from({ length: count }, (_, col) => rows[0]?.[col] ?? "") : [],
  };
}

export function compareColumnSignatures(
  saved: ColumnSignature,
  current: ColumnSignature,
): SchemaCheck {
  const result = (safe: boolean, reason: SchemaCheck["reason"]): SchemaCheck => ({
    safe,
    reason,
    positional: !current.headerRow,
  });
  if (saved.count !== current.count) return result(false, "count");
  if (saved.headerRow !== current.headerRow) return result(false, "header-mode");
  if (
    current.headerRow &&
    (new Set(current.headers).size !== current.headers.length ||
      current.headers.some((header) => !header.trim()))
  )
    return result(false, "duplicates");
  if (JSON.stringify(saved.headers) !== JSON.stringify(current.headers))
    return result(false, "headers");
  return result(true, "match");
}

export function viewMatchesCurrent(
  view: Pick<NamedView, "filters" | "colWidths">,
  filters: FilterMap | FilterEntries,
  colWidths: ColumnWidthMap,
): boolean {
  const widths = (value: ColumnWidthMap) =>
    Object.entries(value).sort(([a], [b]) => Number(a) - Number(b));
  return (
    JSON.stringify(snapshotFilters(view.filters)) === JSON.stringify(snapshotFilters(filters)) &&
    JSON.stringify(widths(view.colWidths)) === JSON.stringify(widths(colWidths))
  );
}

export function missingFilterValues(
  view: Pick<NamedView, "filters">,
  rows: readonly (readonly string[])[],
  headerRow = true,
): FilterEntries {
  const data = headerRow ? rows.slice(1) : rows;
  return view.filters
    .map(([col, values]): [number, string[]] => {
      const present = new Set(data.map((row) => row[col] ?? ""));
      return [col, values.filter((value) => !present.has(value))];
    })
    .filter(([, values]) => values.length > 0);
}

function validateSignature(value: unknown): value is ColumnSignature {
  return (
    record(value) &&
    value.version === 1 &&
    typeof value.count === "number" &&
    Number.isInteger(value.count) &&
    value.count >= 0 &&
    value.count <= MAX_COLUMNS &&
    typeof value.headerRow === "boolean" &&
    Array.isArray(value.headers) &&
    value.headers.length === (value.headerRow ? value.count : 0) &&
    value.headers.every((header) => typeof header === "string")
  );
}
function validateView(value: unknown): value is NamedView {
  if (
    !record(value) ||
    !boundedString(value.id) ||
    !boundedString(value.name, 80) ||
    !validateSignature(value.signature) ||
    !Array.isArray(value.filters) ||
    !record(value.colWidths)
  )
    return false;
  const count = value.signature.count;
  const seen = new Set<number>();
  for (const entry of value.filters) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      !index(entry[0], count) ||
      seen.has(entry[0]) ||
      !Array.isArray(entry[1]) ||
      !entry[1].every((item: unknown) => typeof item === "string")
    )
      return false;
    seen.add(entry[0]);
  }
  return Object.entries(value.colWidths).every(
    ([col, width]) =>
      /^\d+$/.test(col) &&
      index(Number(col)) &&
      typeof width === "number" &&
      Number.isFinite(width) &&
      width >= 24 &&
      width <= 2000,
  );
}
function cleanView(view: NamedView): NamedView {
  return {
    id: view.id,
    name: view.name,
    filters: snapshotFilters(view.filters),
    colWidths: { ...view.colWidths },
    signature: {
      version: 1,
      count: view.signature.count,
      headerRow: view.signature.headerRow,
      headers: [...view.signature.headers],
    },
  };
}
function cleanGroup(group: NamedViewGroup): NamedViewGroup {
  return { id: group.id, fileName: group.fileName, views: group.views.map(cleanView) };
}
function parseEnvelope(raw: string | null): StorageEnvelope {
  if (!raw) return { version: 1, groups: [] };
  if (bytes(raw) > NAMED_VIEWS_MAX_BYTES) throw new NamedViewsError("limit");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new NamedViewsError("invalid");
  }
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.groups) ||
    value.groups.length > MAX_GROUPS
  )
    throw new NamedViewsError("invalid");
  const seen = new Set<string>();
  const groups: NamedViewGroup[] = [];
  for (const group of value.groups) {
    if (
      !record(group) ||
      !boundedString(group.id) ||
      seen.has(group.id) ||
      typeof group.fileName !== "string" ||
      group.fileName.length > 512 ||
      !Array.isArray(group.views) ||
      group.views.length > MAX_VIEWS ||
      !group.views.every(validateView) ||
      new Set(group.views.map((view) => view.id)).size !== group.views.length
    )
      throw new NamedViewsError("invalid");
    seen.add(group.id);
    groups.push(cleanGroup(group as NamedViewGroup));
  }
  return { version: 1, groups };
}
function validName(name: string, views: NamedView[], except?: string): string {
  const clean = name.trim();
  if (!boundedString(clean, 80) || views.some((view) => view.id !== except && view.name === clean))
    throw new NamedViewsError("name");
  return clean;
}

/** Session document IDs bind groups in memory only; disk groups are never matched by name/path. */
export class NamedViewStore {
  private documents = new Map<string, NamedViewDocument>();
  constructor(private readonly getStorage: () => StorageLike = () => localStorage) {}

  document(documentId: string, fileName?: string): NamedViewDocument {
    if (!this.documents.has(documentId))
      this.documents.set(documentId, {
        id: newId(),
        fileName: (fileName ?? "Untitled").slice(0, 512),
        views: [],
        persistent: false,
      });
    if (fileName !== undefined) this.documents.get(documentId)!.fileName = fileName.slice(0, 512);
    return copy(this.documents.get(documentId)!);
  }
  /** Discard a closed tab's session-only presets without deleting opted-in device copies. */
  forgetDocument(documentId: string): void {
    this.documents.delete(documentId);
  }
  private storage<T>(operation: (storage: StorageLike) => T): T {
    try {
      return operation(this.getStorage());
    } catch (error) {
      if (error instanceof NamedViewsError) throw error;
      throw new NamedViewsError("storage");
    }
  }
  savedGroups(): NamedViewGroup[] {
    return this.storage(
      (storage) => parseEnvelope(storage.getItem(NAMED_VIEWS_STORAGE_KEY)).groups,
    );
  }
  private writeGroups(groups: NamedViewGroup[]): void {
    const raw = JSON.stringify({ version: 1, groups: groups.map(cleanGroup) });
    if (groups.length > MAX_GROUPS || bytes(raw) > NAMED_VIEWS_MAX_BYTES)
      throw new NamedViewsError("limit");
    this.storage((storage) => {
      if (groups.length) storage.setItem(NAMED_VIEWS_STORAGE_KEY, raw);
      else storage.removeItem(NAMED_VIEWS_STORAGE_KEY);
    });
  }
  private commit(documentId: string, document: NamedViewDocument): NamedViewDocument {
    if (
      document.views.length > MAX_VIEWS ||
      bytes(JSON.stringify(cleanGroup(document))) > NAMED_VIEWS_MAX_BYTES
    )
      throw new NamedViewsError("limit");
    if (document.persistent)
      this.writeGroups([
        ...this.savedGroups().filter((group) => group.id !== document.id),
        cleanGroup(document),
      ]);
    this.documents.set(documentId, copy(document));
    return copy(document);
  }
  save(
    documentId: string,
    name: string,
    filters: FilterMap | FilterEntries,
    colWidths: ColumnWidthMap,
    signature: ColumnSignature,
  ): NamedView {
    const document = this.document(documentId);
    const view: NamedView = {
      id: newId(),
      name: validName(name, document.views),
      filters: snapshotFilters(filters),
      colWidths: { ...colWidths },
      signature: copy(signature),
    };
    if (!validateView(view)) throw new NamedViewsError("invalid");
    document.views.push(view);
    this.commit(documentId, document);
    return copy(view);
  }
  rename(documentId: string, viewId: string, name: string): NamedView {
    const document = this.document(documentId);
    const view = document.views.find((item) => item.id === viewId);
    if (!view) throw new NamedViewsError("missing");
    view.name = validName(name, document.views, viewId);
    this.commit(documentId, document);
    return copy(view);
  }
  duplicate(documentId: string, viewId: string): NamedView {
    const document = this.document(documentId);
    const view = document.views.find((item) => item.id === viewId);
    if (!view) throw new NamedViewsError("missing");
    let suffix = 1;
    let name = `${view.name.slice(0, 64)} (${suffix})`;
    while (document.views.some((item) => item.name === name))
      name = `${view.name.slice(0, 64)} (${++suffix})`;
    return this.save(documentId, name, view.filters, view.colWidths, view.signature);
  }
  remove(documentId: string, viewId: string): void {
    const document = this.document(documentId);
    document.views = document.views.filter((view) => view.id !== viewId);
    this.commit(documentId, document);
  }
  removeAll(documentId: string): void {
    const document = this.document(documentId);
    document.views = [];
    this.commit(documentId, document);
  }
  setPersistent(documentId: string, persistent: boolean): void {
    const document = this.document(documentId);
    if (!persistent)
      this.writeGroups(this.savedGroups().filter((group) => group.id !== document.id));
    document.persistent = persistent;
    this.commit(documentId, document);
  }
  deleteSavedGroup(groupId: string): void {
    this.writeGroups(this.savedGroups().filter((group) => group.id !== groupId));
    for (const document of this.documents.values())
      if (document.id === groupId) document.persistent = false;
  }
  deleteAllSaved(): void {
    // Also provides recovery from corrupt/unknown-version storage without parsing it.
    this.storage((storage) => storage.removeItem(NAMED_VIEWS_STORAGE_KEY));
    for (const document of this.documents.values()) document.persistent = false;
  }
  importSaved(
    documentId: string,
    groupId: string,
    current: ColumnSignature,
    confirmed: boolean,
  ): NamedView[] {
    const source = this.savedGroups().find((group) => group.id === groupId);
    if (!source) throw new NamedViewsError("missing");
    if (
      !confirmed ||
      source.views.some((view) => !compareColumnSignatures(view.signature, current).safe)
    )
      throw new NamedViewsError("schema");
    const document = this.document(documentId);
    const imported = source.views.map((view) => ({ ...copy(view), id: newId() }));
    for (const view of imported) {
      view.name = validName(view.name, document.views);
      document.views.push(view);
    }
    this.commit(documentId, document);
    return copy(imported);
  }
  application(
    documentId: string,
    viewId: string,
    current: ColumnSignature,
    confirmedPositions = false,
  ): NamedViewApplication {
    const view = this.document(documentId).views.find((item) => item.id === viewId);
    if (!view) throw new NamedViewsError("missing");
    const check = compareColumnSignatures(view.signature, current);
    if (!check.safe || (check.positional && !confirmedPositions))
      throw new NamedViewsError("schema");
    return {
      id: view.id,
      name: view.name,
      filters: snapshotFilters(view.filters),
      colWidths: { ...view.colWidths },
    };
  }
}
export const namedViewStore = new NamedViewStore();
