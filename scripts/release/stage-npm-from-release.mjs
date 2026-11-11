// Fill the npm packages under npm/ from the assets of a published GitHub
// Release. Nothing is built here: every binary is taken from the release and
// checked against its SHA256SUMS.txt first, so npm ships the same bytes as the
// GitHub Release.
//
// usage: node scripts/release/stage-npm-from-release.mjs <assets-dir> <tag>
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT_PACKAGE, TARGETS, releaseVersion } from "./npm-targets.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readChecksums(path) {
  const sums = new Map();
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(line.trim());
    if (match) sums.set(match[2], match[1]);
  }
  return sums;
}

function assertNoLinks(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = lstatSync(path);
    // npm drops symlinks when packing, which would silently break the bundle.
    if (stat.isSymbolicLink()) throw new Error(`symlink inside app bundle: ${path}`);
    if (stat.isDirectory()) assertNoLinks(path);
  }
}

function markExecutables(appDir) {
  const macosDir = join(appDir, "Contents", "MacOS");
  const names = readdirSync(macosDir);
  if (names.length === 0) throw new Error(`no executable in ${macosDir}`);
  for (const name of names) chmodSync(join(macosDir, name), 0o755);
}

export function stage(assetsDir, tag, { root = repoRoot } = {}) {
  const version = releaseVersion(tag);
  const sums = readChecksums(join(assetsDir, "SHA256SUMS.txt"));
  const npmDir = join(root, "npm");

  for (const target of TARGETS) {
    const asset = join(assetsDir, target.asset);
    const expected = sums.get(target.asset);
    if (!expected) throw new Error(`SHA256SUMS.txt has no entry for ${target.asset}`);
    const actual = sha256(asset);
    if (actual !== expected) {
      throw new Error(`checksum mismatch for ${target.asset}: ${actual} != ${expected}`);
    }

    const pkgDir = join(npmDir, target.pkg);
    const payload = join(pkgDir, target.payload);
    rmSync(payload, { recursive: true, force: true });
    mkdirSync(dirname(payload), { recursive: true });

    if (target.kind === "file") {
      copyFileSync(asset, payload);
      if (!target.payload.endsWith(".exe")) chmodSync(payload, 0o755);
    } else {
      // Extract next to the destination so the final move stays on one volume.
      const scratch = mkdtempSync(join(pkgDir, ".stage-"));
      try {
        const result = spawnSync("tar", ["-xzf", resolve(asset), "-C", scratch], {
          stdio: "inherit",
        });
        if (result.error || result.status !== 0) {
          throw new Error(`failed to extract ${target.asset}`);
        }
        const app = join(scratch, ...target.archiveMember.split("/"));
        if (!existsSync(join(app, "Contents", "Info.plist"))) {
          throw new Error(`${target.asset} does not contain ${target.archiveMember}`);
        }
        assertNoLinks(app);
        markExecutables(app);
        renameSync(app, payload);
      } finally {
        rmSync(scratch, { recursive: true, force: true });
      }
    }
    console.log(`staged ${target.pkg}/${target.payload} (${target.asset} sha256 ${expected})`);
  }

  // Version comes from the tag only; the files in git stay at 0.0.0.
  for (const pkg of [...TARGETS.map((t) => t.pkg), ROOT_PACKAGE]) {
    const pkgDir = join(npmDir, pkg);
    const manifestPath = join(pkgDir, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.version = version;
    if (pkg === ROOT_PACKAGE) {
      manifest.optionalDependencies = Object.fromEntries(TARGETS.map((t) => [t.pkg, version]));
    }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    copyFileSync(join(root, "LICENSE"), join(pkgDir, "LICENSE"));
  }
  console.log(`npm packages staged at ${version}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [assetsDir, tag] = process.argv.slice(2);
  if (!assetsDir || !tag) {
    console.error("usage: stage-npm-from-release.mjs <assets-dir> <tag>");
    process.exit(2);
  }
  try {
    stage(resolve(assetsDir), tag);
  } catch (error) {
    console.error(`stage-npm-from-release: ${error.message}`);
    process.exit(1);
  }
}
