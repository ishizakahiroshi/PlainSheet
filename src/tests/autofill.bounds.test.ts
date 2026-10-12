import { describe, expect, it } from "vitest";
import { buildFillUpdates } from "../lib/autofill";

describe("bounded bulk fill allocation", () => {
  it("rejects an oversized destination before materializing seeds or changes", () => {
    expect(
      buildFillUpdates(
        [["seed"]],
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 16384, height: 1048576 },
      ),
    ).toEqual([]);
  });
  it("rejects an oversized seed even with a small destination", () => {
    expect(
      buildFillUpdates(
        [["seed"]],
        { x: 0, y: 0, width: 1, height: 500001 },
        { x: 0, y: 0, width: 1, height: 1 },
      ),
    ).toEqual([]);
  });
});
