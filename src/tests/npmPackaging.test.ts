// @vitest-environment node
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs release scripts have no type declarations
import { ROOT_PACKAGE, TARGETS, releaseVersion } from "../../scripts/release/npm-targets.mjs";
// @ts-expect-error plain .mjs release scripts have no type declarations
import { stage } from "../../scripts/release/stage-npm-from-release.mjs";
// @ts-expect-error plain .mjs release scripts have no type declarations
import { requiredFiles } from "../../scripts/release/publish-npm.mjs";

type Target = {
  target: string;
  pkg: string;
  asset: string;
  kind: string;
  payload: string;
};

const repoRoot = resolve(__dirname, "..", "..");
const targets = TARGETS as Target[];
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("npm packaging", () => {
  it("launcher and release scripts name the same platform packages", () => {
    const launcher = readFileSync(
      join(repoRoot, "npm", ROOT_PACKAGE, "bin", "plainsheet.mjs"),
      "utf8",
    );
    for (const target of targets) {
      expect(launcher).toContain(
        `"${target.target}": { pkg: "${target.pkg}", payload: "${target.payload}" }`,
      );
    }
    expect(launcher.match(/pkg: "plainsheet-/g)).toHaveLength(targets.length);
  });

  it("root package lists every platform package and only ships the launcher", () => {
    const root = readJson(join(repoRoot, "npm", ROOT_PACKAGE, "package.json"));
    expect(root.name).toBe(ROOT_PACKAGE);
    expect(Object.keys(root.optionalDependencies).sort()).toEqual(
      targets.map((target) => target.pkg).sort(),
    );
    expect(root.files.sort()).toEqual(
      requiredFiles(ROOT_PACKAGE)
        .filter((f: string) => f !== "package.json")
        .sort(),
    );
    expect(root.scripts).toBeUndefined();
  });

  it("each platform package is limited to its OS and its one payload", () => {
    for (const target of targets) {
      const manifest = readJson(join(repoRoot, "npm", target.pkg, "package.json"));
      const [os, cpu] = target.target.split(" ");
      expect(manifest.name).toBe(target.pkg);
      expect(manifest.os).toEqual([os]);
      expect(manifest.cpu).toEqual([cpu]);
      expect(manifest.files.map((f: string) => f.replace(/\/$/, "")).sort()).toEqual(
        ["LICENSE", target.payload].sort(),
      );
      expect(manifest.scripts).toBeUndefined();
    }
  });

  it("accepts release tags and rejects anything else", () => {
    expect(releaseVersion("v0.1.0")).toBe("0.1.0");
    expect(releaseVersion("v1.2.3-rc.1")).toBe("1.2.3-rc.1");
    for (const bad of ["", "0.1", "v1.2", "v01.2.3", "v1.2.3+build", "latest", undefined]) {
      expect(() => releaseVersion(bad)).toThrow();
    }
  });

  it("release workflow publishes to npm through OIDC without a stored token", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github", "workflows", "tauri-release.yml"),
      "utf8",
    );
    expect(workflow).toContain("id-token: write");
    expect(workflow).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN|registry-url:/);
    for (const target of targets) {
      expect(workflow).toContain(`--pattern ${target.asset}`);
    }
  });
});

describe("staging npm packages from release assets", () => {
  let scratch = "";
  afterEach(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
    scratch = "";
  });

  function fixture() {
    scratch = mkdtempSync(join(tmpdir(), "plainsheet-stage-test-"));
    const root = join(scratch, "repo");
    const assets = join(scratch, "assets");
    mkdirSync(assets, { recursive: true });
    cpSync(join(repoRoot, "npm"), join(root, "npm"), {
      recursive: true,
      filter: (source) => !/[\\/]bin[\\/]PlainSheet/.test(source),
    });
    writeFileSync(join(root, "LICENSE"), "license text\n");
    const fileTargets = targets.filter((target) => target.kind === "file");
    const sums = fileTargets.map((target) => {
      const body = `fake build for ${target.pkg}`;
      writeFileSync(join(assets, target.asset), body);
      return `${createHash("sha256").update(body).digest("hex")}  ${target.asset}`;
    });
    return { root, assets, sums, fileTargets };
  }

  it("refuses an asset whose checksum does not match", () => {
    const { root, assets, sums, fileTargets } = fixture();
    writeFileSync(join(assets, "SHA256SUMS.txt"), `${sums.join("\n")}\n`);
    writeFileSync(join(assets, fileTargets[0].asset), "tampered");
    expect(() => stage(assets, "v0.1.0", { root })).toThrow(/checksum mismatch/);
    expect(existsSync(join(root, "npm", fileTargets[0].pkg, fileTargets[0].payload))).toBe(false);
  });

  it("refuses an asset that the checksum list does not cover", () => {
    const { root, assets, sums } = fixture();
    writeFileSync(join(assets, "SHA256SUMS.txt"), `${sums.slice(1).join("\n")}\n`);
    expect(() => stage(assets, "v0.1.0", { root })).toThrow(/no entry/);
  });
});
