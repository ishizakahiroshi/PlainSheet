// @vitest-environment node
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs release scripts have no type declarations
import { changelogSection } from "../../scripts/release/changelog-section.mjs";

const repoRoot = resolve(__dirname, "..", "..");
const sample = [
  "# Changelog",
  "",
  "## [0.2.0] - 2027-01-01",
  "",
  "### Added",
  "",
  "- second",
  "",
  "## [0.1.0] - 2026-11-11",
  "",
  "First public release.",
  "",
  "[0.2.0]: https://example.com/v0.2.0",
  "[0.1.0]: https://example.com/v0.1.0",
].join("\r\n");

describe("release notes from CHANGELOG.md", () => {
  it("returns one version's section without its heading or the link list", () => {
    expect(changelogSection(sample, "v0.2.0")).toBe("### Added\n\n- second");
    expect(changelogSection(sample, "v0.1.0")).toBe("First public release.");
  });

  it("returns nothing for a version that has no section", () => {
    expect(changelogSection(sample, "v0.3.0")).toBe("");
  });

  it("finds the section of the version the packages are at", () => {
    const version = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;
    const changelog = readFileSync(join(repoRoot, "CHANGELOG.md"), "utf8");
    expect(changelogSection(changelog, `v${version}`)).not.toBe("");
  });

  it("release job checks out every file the notes script needs", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "tauri-release.yml"),
      "utf8",
    );
    for (const file of [
      "CHANGELOG.md",
      "scripts/release/changelog-section.mjs",
      "scripts/release/npm-targets.mjs",
    ]) {
      expect(workflow).toMatch(new RegExp(`sparse-checkout: \\|[\\s\\S]*?\\n\\s+${file}\\r?\\n`));
    }
  });
});
