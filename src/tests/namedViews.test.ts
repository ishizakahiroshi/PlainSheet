import { describe, expect, it } from "vitest";
import {
  compareColumnSignatures, createColumnSignature, missingFilterValues, NAMED_VIEWS_MAX_BYTES,
  NAMED_VIEWS_STORAGE_KEY, NamedViewStore, snapshotFilters, viewMatchesCurrent,
} from "../lib/namedViews";

const rows = [["Region", "Status"], ["East", "Pending"], ["West", "Done"]];
const signature = createColumnSignature(rows);
const east = new Map([[0, new Set(["East"])] , [1, new Set(["Pending"])]]);
const west = new Map([[0, new Set(["West"])] , [1, new Set(["Done"])]]);
function storageFixture() {
  const data = new Map<string, string>();
  let fail = false;
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { if (fail) throw new Error("quota"); data.set(key, value); },
    removeItem: (key: string) => { if (fail) throw new Error("blocked"); data.delete(key); },
  };
  return { data, storage, fail: () => { fail = true; } };
}

describe("named filter view store", () => {
  it("keeps two presets and supports rename, duplicate, apply, individual and all deletion", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    store.document("A", "orders.csv");
    const one = store.save("A", "East pending", east, { 0: 160 }, signature);
    const two = store.save("A", "West done", west, { 1: 240 }, signature);
    expect(store.document("A").views).toHaveLength(2);
    expect(store.rename("A", one.id, "East work").name).toBe("East work");
    const duplicate = store.duplicate("A", one.id);
    expect(duplicate.name).toBe("East work (1)");
    expect(store.application("A", two.id, signature)).toEqual({ id: two.id, name: "West done", filters: [[0, ["West"]], [1, ["Done"]]], colWidths: { 1: 240 } });
    store.remove("A", one.id);
    expect(store.document("A").views).toHaveLength(2);
    store.removeAll("A"); expect(store.document("A").views).toEqual([]);
    expect(fixture.data.size).toBe(0);
  });

  it("isolates session documents, even with the same filename, and clones snapshots", () => {
    const store = new NamedViewStore();
    const a = store.document("A", "same.csv"); const b = store.document("B", "same.csv");
    expect(a.id).not.toBe(b.id);
    const view = store.save("A", "East", east, { 0: 160 }, signature);
    view.filters[0][1].push("unexpected");
    const applied = store.application("A", view.id, signature); applied.colWidths[0] = 800;
    expect(store.document("B").views).toHaveLength(0);
    expect(store.application("A", view.id, signature).colWidths[0]).toBe(160);
    expect(store.document("A").views[0].filters[0][1]).toEqual(["East"]);
  });

  it("has no storage access until persistence or stored groups are explicitly requested", () => {
    let reads = 0;
    const store = new NamedViewStore(() => { reads++; throw new Error("disabled"); });
    store.save("A", "Session", east, {}, signature);
    store.document("A"); store.rename("A", store.document("A").views[0].id, "Still session");
    expect(reads).toBe(0);
    expect(() => store.setPersistent("A", true)).toThrow("storage");
    expect(store.document("A").persistent).toBe(false);
  });

  it("persists only opted-in groups and requires explicit preview confirmation to import after reopen", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    store.document("old", "orders.csv");
    store.save("old", "East", east, { 0: 160 }, signature);
    store.save("old", "West", west, { 0: 220 }, signature);
    expect(fixture.data.size).toBe(0);
    store.setPersistent("old", true);
    const group = store.savedGroups()[0];
    const reopened = new NamedViewStore(() => fixture.storage);
    expect(reopened.document("new", "orders.csv").views).toEqual([]);
    expect(() => reopened.importSaved("new", group.id, signature, false)).toThrow("schema");
    const imported = reopened.importSaved("new", group.id, signature, true);
    expect(imported).toHaveLength(2);
    expect(imported[0].id).not.toBe(group.views[0].id);
    expect(reopened.document("new").persistent).toBe(false);
    expect(fixture.data.get(NAMED_VIEWS_STORAGE_KEY)).not.toContain("new");
  });

  it("does not silently replace same-name views and leaves a rejected import atomic", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    store.save("old", "One", east, {}, signature); store.save("old", "Two", west, {}, signature);
    store.setPersistent("old", true);
    store.save("new", "Two", east, {}, signature);
    expect(() => store.importSaved("new", store.savedGroups()[0].id, signature, true)).toThrow("name");
    expect(store.document("new").views.map((view) => view.name)).toEqual(["Two"]);
    expect(() => store.save("new", "Two", west, {}, signature)).toThrow("name");
    expect(() => store.rename("new", store.document("new").views[0].id, "  ")).toThrow("name");
  });

  it("rejects duplicate, blank, reordered, deleted and changed columns and header mode", () => {
    const store = new NamedViewStore(); const view = store.save("A", "East", east, {}, signature);
    for (const changed of [
      [["Region", "Region"]], [["Region", ""]], [["Status", "Region"]], [["Region"]], [["Area", "Status"]], [["Region", "Status", "Extra"]],
    ]) expect(() => store.application("A", view.id, createColumnSignature(changed))).toThrow("schema");
    expect(() => store.application("A", view.id, createColumnSignature(rows, false))).toThrow("schema");
    expect(compareColumnSignatures(createColumnSignature([["x", "x"]]), createColumnSignature([["x", "x"]])).reason).toBe("duplicates");
  });

  it("rejects importing a prior document with an unsafe column signature", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    store.save("A", "East", east, {}, signature); store.setPersistent("A", true);
    expect(() => store.importSaved("B", store.savedGroups()[0].id, createColumnSignature([["Status", "Region"]]), true)).toThrow("schema");
    expect(store.document("B").views).toHaveLength(0);
  });

  it("requires column-position confirmation without headers and stores no data-row signatures", () => {
    const store = new NamedViewStore(); const plain = createColumnSignature([["private", "value"], ["other", "row"]], false);
    const view = store.save("A", "No header", new Map([[0, new Set(["other"])]]), {}, plain);
    expect(plain.headers).toEqual([]);
    expect(JSON.stringify(view)).not.toContain("private");
    expect(() => store.application("A", view.id, plain)).toThrow("schema");
    expect(store.application("A", view.id, plain, true).filters).toEqual([[0, ["other"]]]);
  });

  it("reports missing values and preserves empty allowed sets (zero matching rows)", () => {
    const view = { filters: [[0, ["East", "North", ""]], [1, []]] as [number, string[]][] };
    expect(missingFilterValues(view, rows)).toEqual([[0, ["North", ""]]]);
    expect(snapshotFilters(new Map([[1, new Set<string>()]]))).toEqual([[1, []]]);
  });

  it("detects modified filters or widths without depending on entry order", () => {
    const view = { filters: [[1, ["Done", "Pending"]], [0, ["East"]]] as [number, string[]][], colWidths: { 1: 100, 0: 150 } };
    const filters = new Map([[0, new Set(["East"])], [1, new Set(["Pending", "Done"])]]);
    expect(viewMatchesCurrent(view, filters, { 0: 150, 1: 100 })).toBe(true);
    expect(viewMatchesCurrent(view, filters, { 0: 151, 1: 100 })).toBe(false);
    expect(viewMatchesCurrent(view, east, view.colWidths)).toBe(false);
  });

  it("removes individual or all persisted groups, and opt-out retains session presets", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    store.save("A", "East", east, {}, signature); store.setPersistent("A", true);
    store.save("B", "West", west, {}, signature); store.setPersistent("B", true);
    store.deleteSavedGroup(store.document("A").id);
    expect(store.savedGroups()).toHaveLength(1); expect(store.document("A").persistent).toBe(false);
    store.setPersistent("B", false);
    expect(store.savedGroups()).toHaveLength(0); expect(store.document("B").views).toHaveLength(1);
    store.setPersistent("A", true); store.setPersistent("B", true); store.deleteAllSaved();
    expect(fixture.data.size).toBe(0); expect(store.document("B").persistent).toBe(false);
    expect(store.document("A").views).toHaveLength(1);
  });

  it("bounds UTF-8 storage at 256 KiB and rejects over-limit saves without mutation", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    expect(() => store.save("A", "Huge", new Map([[0, new Set(["界".repeat(NAMED_VIEWS_MAX_BYTES / 3)])]]), {}, signature)).toThrow("limit");
    expect(store.document("A").views).toHaveLength(0);
    store.save("A", "Small", east, {}, signature); store.setPersistent("A", true);
    expect(new TextEncoder().encode(fixture.data.get(NAMED_VIEWS_STORAGE_KEY)!).length).toBeLessThanOrEqual(NAMED_VIEWS_MAX_BYTES);
  });

  it("preserves old session and persistent data when a quota/security write fails", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    const view = store.save("A", "Old", east, {}, signature); store.setPersistent("A", true);
    const old = fixture.data.get(NAMED_VIEWS_STORAGE_KEY); fixture.fail();
    expect(() => store.rename("A", view.id, "New")).toThrow("storage");
    expect(store.document("A").views[0].name).toBe("Old"); expect(fixture.data.get(NAMED_VIEWS_STORAGE_KEY)).toBe(old);
    expect(() => store.setPersistent("A", false)).toThrow("storage");
    expect(store.document("A").persistent).toBe(true);
  });

  it("rejects malformed/unknown storage without overwriting it and provides explicit delete-all recovery", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    for (const raw of ["{", '{"version":2,"groups":[]}', '{"version":1,"groups":[{}]}']) {
      fixture.data.set(NAMED_VIEWS_STORAGE_KEY, raw);
      expect(() => store.savedGroups()).toThrow("invalid");
      expect(() => store.setPersistent("A", true)).toThrow("invalid");
      expect(fixture.data.get(NAMED_VIEWS_STORAGE_KEY)).toBe(raw);
    }
    store.deleteAllSaved(); expect(store.savedGroups()).toEqual([]);
  });

  it("persists only allowlisted metadata, filters and widths; never raw rows, paths, sort or header settings to apply", () => {
    const fixture = storageFixture(); const store = new NamedViewStore(() => fixture.storage);
    store.save("A", "East", east, {}, signature); store.setPersistent("A", true);
    const parsed = JSON.parse(fixture.data.get(NAMED_VIEWS_STORAGE_KEY)!);
    expect(Object.keys(parsed.groups[0])).toEqual(["id", "fileName", "views"]);
    expect(Object.keys(parsed.groups[0].views[0])).toEqual(["id", "name", "filters", "colWidths", "signature"]);
    const applied = store.application("A", store.document("A").views[0].id, signature);
    expect(Object.keys(applied)).toEqual(["id", "name", "filters", "colWidths"]);
    expect(parsed).not.toHaveProperty("rows");
  });
});
