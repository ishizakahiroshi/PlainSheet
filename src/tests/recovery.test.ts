import { describe, expect, it, vi } from "vitest";
import {
  createRecoveryStore,
  RECOVERY_KEY,
  RECOVERY_MAX_BYTES,
  RECOVERY_TTL_MS,
  type RecoveryStorage,
} from "../lib/recovery";

function fixture() {
  const data = new Map<string, string>();
  const storage: RecoveryStorage = {
    getItem: vi.fn((key) => data.get(key) ?? null),
    setItem: vi.fn((key, value) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key) => {
      data.delete(key);
    }),
  };
  let clock = 1700000000000;
  let id = 0;
  const options = { now: () => clock, createId: () => `recovery-test-id-${++id}` };
  const store = createRecoveryStore(storage, "browser", options);
  const input = {
    documentId: "doc-random-1",
    rows: [["00123", "900719925474099312345"]],
    meta: { fileName: "same.csv", filePath: "/original/same.csv", sourceText: "private-source" },
  };
  return {
    store,
    storage,
    data,
    options,
    input,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}
describe("consented local recovery", () => {
  it("starts OFF and never writes content without explicit consent", () => {
    const f = fixture();
    expect(f.store.inspect()).toMatchObject({ ok: true, value: { enabled: false, drafts: [] } });
    expect(f.store.writeSnapshot(f.input).ok).toBe(false);
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.store.enable({ acceptLocalContentStorage: false } as never).ok).toBe(false);
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it("writes atomically under one key, distinguishes same-name docs, restores isolated dirty copies", () => {
    const f = fixture();
    expect(f.store.enable({ acceptLocalContentStorage: true }).ok).toBe(true);
    const first = f.store.writeSnapshot(f.input);
    expect(first.ok).toBe(true);
    const second = f.store.writeSnapshot({
      ...f.input,
      documentId: "doc-random-2",
      rows: [["second"]],
    });
    expect(second.ok).toBe(true);
    const state = f.store.inspect();
    if (!first.ok || !second.ok || !state.ok) throw new Error("failed fixture");
    expect(first.value.id).not.toBe(second.value.id);
    expect(state.value.drafts).toHaveLength(2);
    expect([...f.data.keys()]).toEqual([RECOVERY_KEY]);
    expect(f.data.get(RECOVERY_KEY)).not.toContain("/original/");
    expect(f.data.get(RECOVERY_KEY)).not.toContain("private-source");
    const restarted = createRecoveryStore(f.storage, "browser", f.options);
    const copy = restarted.restoreCopy(first.value.id);
    expect(copy).toMatchObject({
      ok: true,
      value: { rows: f.input.rows, meta: { dirty: true, fileName: "Recovered-same.csv" } },
    });
    if (!copy.ok) throw new Error("failed restore");
    expect(copy.value.meta.filePath).toBeUndefined();
    copy.value.rows[0][0] = "edited";
    expect(restarted.restoreCopy(first.value.id)).toMatchObject({
      ok: true,
      value: { rows: [["00123", "900719925474099312345"]] },
    });
  });
  it("expires drafts on read and supports individual/all/OFF deletion", () => {
    const f = fixture();
    f.store.enable({ acceptLocalContentStorage: true });
    const first = f.store.writeSnapshot(f.input);
    if (!first.ok) throw new Error("failed fixture");
    expect(f.store.deleteOne(first.value.id)).toMatchObject({
      ok: true,
      value: { enabled: true, drafts: [] },
    });
    f.store.writeSnapshot(f.input);
    f.advance(RECOVERY_TTL_MS);
    expect(f.store.inspect()).toMatchObject({ ok: true, value: { enabled: true, drafts: [] } });
    expect(f.store.restoreCopy(first.value.id).ok).toBe(false);
    f.store.writeSnapshot(f.input);
    expect(f.store.deleteAll()).toMatchObject({ ok: true, value: { enabled: true, drafts: [] } });
    f.store.writeSnapshot(f.input);
    expect(f.store.disable()).toMatchObject({ ok: true, value: { enabled: false, drafts: [] } });
    expect(f.data.size).toBe(0);
    expect(f.store.writeSnapshot(f.input).ok).toBe(false);
  });
  it("keeps the last completed snapshot after quota errors, without success or editor mutation", () => {
    const f = fixture();
    f.store.enable({ acceptLocalContentStorage: true });
    f.store.writeSnapshot(f.input);
    const before = f.data.get(RECOVERY_KEY);
    vi.mocked(f.storage.setItem).mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const result = f.store.writeSnapshot({ ...f.input, rows: [["new"]] });
    expect(result.ok).toBe(false);
    expect(f.data.get(RECOVERY_KEY)).toBe(before);
    expect(f.input.rows[0][0]).toBe("00123");
  });
  it("rejects oversized content and corrupt/version/path schemas while allowing explicit deletion", () => {
    const f = fixture();
    f.store.enable({ acceptLocalContentStorage: true });
    expect(f.store.writeSnapshot({ ...f.input, rows: [["x".repeat(RECOVERY_MAX_BYTES)]] }).ok).toBe(
      false,
    );
    f.store.writeSnapshot(f.input);
    const valid = f.data.get(RECOVERY_KEY)!;
    for (const corrupt of [
      "{",
      valid.replace('"version":1', '"version":2'),
      valid.replace('"dirty":true', '"dirty":true,"filePath":"/unsafe"'),
      valid.replace('"rows":[[', '"rows":[[123,'),
      valid.replace('"encoding":"utf-8"', '"encoding":["utf-8"]'),
    ]) {
      f.data.set(RECOVERY_KEY, corrupt);
      expect(f.store.inspect().ok).toBe(false);
      expect(f.store.writeSnapshot(f.input).ok).toBe(false);
    }
    expect(f.store.deleteAll()).toMatchObject({ ok: true, value: { enabled: false, drafts: [] } });
  });
  it("reports deletion failure and blocks further writes even if persisted ON remains", () => {
    const f = fixture();
    f.store.enable({ acceptLocalContentStorage: true });
    f.store.writeSnapshot(f.input);
    vi.mocked(f.storage.removeItem).mockImplementation(() => {
      throw new Error("denied");
    });
    expect(f.store.disable().ok).toBe(false);
    const before = vi.mocked(f.storage.setItem).mock.calls.length;
    expect(f.store.writeSnapshot(f.input).ok).toBe(false);
    expect(vi.mocked(f.storage.setItem).mock.calls).toHaveLength(before);
  });
  it("retains identity across updates, bounds draft count and never evicts silently", () => {
    const f = fixture();
    f.store.enable({ acceptLocalContentStorage: true });
    const first = f.store.writeSnapshot(f.input);
    const updated = f.store.writeSnapshot({ ...f.input, rows: [["latest"]] });
    if (!first.ok || !updated.ok) throw new Error("failed fixture");
    expect(updated.value.id).toBe(first.value.id);
    for (let i = 2; i <= 50; i++)
      expect(f.store.writeSnapshot({ ...f.input, documentId: `doc-${i}` }).ok).toBe(true);
    expect(f.store.writeSnapshot({ ...f.input, documentId: "doc-51" }).ok).toBe(false);
    expect(f.store.inspect()).toMatchObject({
      ok: true,
      value: {
        drafts: expect.arrayContaining([
          expect.objectContaining({ id: first.value.id, rows: [["latest"]] }),
        ]),
      },
    });
  });
  it("reports denied storage reads and edition mismatches without changing drafts", () => {
    const f = fixture();
    f.store.enable({ acceptLocalContentStorage: true });
    f.store.writeSnapshot(f.input);
    expect(createRecoveryStore(f.storage, "desktop", f.options).inspect().ok).toBe(false);
    vi.mocked(f.storage.getItem).mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(f.store.inspect().ok).toBe(false);
    expect(f.store.writeSnapshot(f.input).ok).toBe(false);
    expect(f.data.size).toBe(1);
  });
  it("cleans up on writes too and reports failed expiry cleanup", () => {
    const f = fixture();
    f.store.enable({ acceptLocalContentStorage: true });
    f.store.writeSnapshot(f.input);
    f.advance(RECOVERY_TTL_MS + 1);
    vi.mocked(f.storage.setItem).mockImplementation(() => {
      throw new Error("denied");
    });
    expect(f.store.inspect().ok).toBe(false);
    expect(f.store.writeSnapshot(f.input).ok).toBe(false);
  });
});
