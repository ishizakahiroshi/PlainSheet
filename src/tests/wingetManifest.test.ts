// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  PACKAGE_ID,
  buildManifests,
  publish,
  verifiedSha256,
  // @ts-expect-error plain .mjs release scripts have no type declarations
} from "../../scripts/release/publish-winget.mjs";

const repoRoot = resolve(__dirname, "..", "..");
const sha = "ab".repeat(32);

describe("winget manifests", () => {
  let scratch = "";
  afterEach(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
    scratch = "";
  });

  function assets(body: string, listed = body) {
    scratch = mkdtempSync(join(tmpdir(), "plainsheet-winget-test-"));
    writeFileSync(join(scratch, "PlainSheet.exe"), body);
    const digest = createHash("sha256").update(listed).digest("hex");
    writeFileSync(
      join(scratch, "SHA256SUMS.txt"),
      `${"0".repeat(64)}  PlainSheet-windows-x86_64.zip\n${digest}  PlainSheet.exe\n`,
    );
    return { dir: scratch, digest };
  }

  it("points the installer at the exe of the tagged release", () => {
    const manifests = buildManifests({
      version: "0.1.0",
      sha256: sha,
      repository: "ishizakahiroshi/PlainSheet",
    }) as Record<string, string>;
    expect(Object.keys(manifests).sort()).toEqual(
      [
        `${PACKAGE_ID}.installer.yaml`,
        `${PACKAGE_ID}.locale.en-US.yaml`,
        `${PACKAGE_ID}.yaml`,
      ].sort(),
    );
    const installer = manifests[`${PACKAGE_ID}.installer.yaml`];
    expect(installer).toContain("InstallerType: portable");
    expect(installer).toContain(
      "InstallerUrl: https://github.com/ishizakahiroshi/PlainSheet/releases/download/v0.1.0/PlainSheet.exe",
    );
    expect(installer).toContain(`InstallerSha256: ${sha.toUpperCase()}`);
    for (const content of Object.values(manifests)) {
      expect(content).toContain(`PackageIdentifier: ${PACKAGE_ID}`);
      expect(content).toContain('PackageVersion: "0.1.0"');
    }
  });

  it("takes the checksum of the exe, not of another asset", () => {
    const { dir, digest } = assets("exe bytes");
    expect(verifiedSha256(dir)).toBe(digest);
  });

  it("refuses an exe that does not match the checksum list", () => {
    const { dir } = assets("exe bytes", "other bytes");
    expect(() => verifiedSha256(dir)).toThrow(/checksum mismatch/);
  });

  it("writes manifests without a token in dry-run mode and rejects prereleases", async () => {
    const { dir } = assets("exe bytes");
    const out = join(dir, "out");
    await publish(dir, "v0.1.0", { dryRunDir: out, env: {} });
    expect(readdirSync(out)).toHaveLength(3);
    await expect(publish(dir, "v0.2.0-rc.1", { dryRunDir: out, env: {} })).rejects.toThrow(
      /stable/,
    );
  });

  it("workflow gives the cross-repository token to the winget step only", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "tauri-release.yml"),
      "utf8",
    );
    const uses = workflow.match(/GH_TOKEN: \$\{\{ secrets\.PUBLISH_GITHUB_TOKEN \}\}/g) ?? [];
    expect(uses).toHaveLength(1);
    expect(workflow.indexOf("GH_TOKEN: ${{ secrets.PUBLISH_GITHUB_TOKEN }}")).toBeGreaterThan(
      workflow.indexOf("name: Open winget pull request"),
    );
  });
});
