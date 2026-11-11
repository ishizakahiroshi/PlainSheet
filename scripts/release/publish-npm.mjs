#!/usr/bin/env node
// Publish the staged npm packages: platform packages first, the root package
// last, so the root never points at a platform version that does not exist.
//
// A version that is already on the registry counts as done only when its
// integrity equals the tarball packed here; different bytes under the same
// version stop the run. Rate limits are retried with backoff inside the script.
//
// usage: node scripts/release/publish-npm.mjs <tag> [--dry-run]
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { ROOT_PACKAGE, TARGETS, releaseVersion } from "./npm-targets.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function npm(args, cwd) {
  // On Windows call npm's JS entry directly so no shell parses the arguments.
  const cli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  const useCli = process.platform === "win32" && existsSync(cli);
  return spawnSync(useCli ? process.execPath : "npm", useCli ? [cli, ...args] : args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

const ok = (result) => !result.error && result.status === 0;
const text = (result) => `${result.stdout || ""}\n${result.stderr || ""}`;

function registryIntegrity(pkg, version, cwd) {
  const result = npm(["view", `${pkg}@${version}`, "dist.integrity", "--json"], cwd);
  if (!ok(result)) {
    if (/\bE404\b/.test(text(result))) return null;
    throw new Error(`cannot read the registry entry for ${pkg}@${version}`);
  }
  const body = result.stdout.trim();
  if (!body) return null;
  const integrity = JSON.parse(body);
  if (typeof integrity !== "string") throw new Error(`no integrity recorded for ${pkg}@${version}`);
  return integrity;
}

// What each tarball must contain, and nothing else.
export function requiredFiles(pkg) {
  if (pkg === ROOT_PACKAGE) return ["LICENSE", "README.md", "bin/plainsheet.mjs", "package.json"];
  const target = TARGETS.find((t) => t.pkg === pkg);
  if (!target) throw new Error(`unknown package: ${pkg}`);
  return ["LICENSE", "package.json", target.payload];
}

function checkPackedFiles(pkg, files) {
  const required = requiredFiles(pkg);
  const allowed = (path) =>
    required.some((entry) => path === entry || path.startsWith(`${entry}/`));
  const unexpected = files.filter((path) => !allowed(path));
  if (unexpected.length) {
    throw new Error(`${pkg}: unexpected files in tarball: ${unexpected.slice(0, 5).join(", ")}`);
  }
  for (const entry of required) {
    if (!files.some((path) => path === entry || path.startsWith(`${entry}/`))) {
      throw new Error(`${pkg}: tarball is missing ${entry}`);
    }
  }
}

export async function publish(tag, { dryRun = false, root = repoRoot } = {}) {
  const version = releaseVersion(tag);
  const order = [...TARGETS.map((t) => t.pkg), ROOT_PACKAGE];
  const scratch = mkdtempSync(join(tmpdir(), "plainsheet-npm-"));
  try {
    const packed = [];
    for (const pkg of order) {
      const dir = join(root, "npm", pkg);
      const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      if (manifest.name !== pkg || manifest.version !== version) {
        throw new Error(
          `${pkg}: package.json says ${manifest.name}@${manifest.version}, tag is ${version}`,
        );
      }
      if (pkg === ROOT_PACKAGE) {
        for (const target of TARGETS) {
          if (manifest.optionalDependencies?.[target.pkg] !== version) {
            throw new Error(`${pkg}: optionalDependencies must pin ${target.pkg} to ${version}`);
          }
        }
      }
      const result = npm(
        ["pack", dir, "--ignore-scripts", "--json", "--pack-destination", scratch],
        root,
      );
      if (!ok(result)) throw new Error(`npm pack failed for ${pkg}:\n${text(result)}`);
      const [info] = JSON.parse(result.stdout);
      checkPackedFiles(
        pkg,
        info.files.map((file) => file.path),
      );
      const tarball = join(scratch, info.filename);
      const integrity = `sha512-${createHash("sha512").update(readFileSync(tarball)).digest("base64")}`;
      packed.push({ pkg, tarball, integrity, files: info.files.length, size: info.size });
    }

    // Look at every package before publishing any of them.
    for (const item of packed) {
      item.existing = registryIntegrity(item.pkg, version, root);
      if (item.existing && item.existing !== item.integrity) {
        throw new Error(`${item.pkg}@${version} is already published with different content`);
      }
    }

    const distTag = version.includes("-") ? "next" : "latest";
    for (const item of packed) {
      if (item.existing) {
        console.log(`SKIP ${item.pkg}@${version}: already published with identical content`);
        continue;
      }
      if (dryRun) {
        console.log(
          `DRY-RUN ${item.pkg}@${version}: ${item.files} files, ${item.size} bytes, tag ${distTag}`,
        );
        continue;
      }
      for (let attempt = 0; ; attempt += 1) {
        const result = npm(
          ["publish", item.tarball, "--ignore-scripts", "--access", "public", "--tag", distTag],
          root,
        );
        if (ok(result)) {
          console.log(`PUBLISHED ${item.pkg}@${version}`);
          break;
        }
        const output = text(result);
        if (/cannot publish over|previously published|EPUBLISHCONFLICT/i.test(output)) {
          if (registryIntegrity(item.pkg, version, root) === item.integrity) {
            console.log(`SKIP ${item.pkg}@${version}: published by an earlier attempt`);
            break;
          }
          throw new Error(`${item.pkg}@${version} exists with different content`);
        }
        if (/rate.?limit|\b429\b|too many requests/i.test(output) && attempt < 5) {
          const wait = 30000 * 2 ** attempt;
          console.log(`rate limited on ${item.pkg}; retrying in ${wait / 1000}s`);
          await delay(wait);
          continue;
        }
        throw new Error(`npm publish failed for ${item.pkg}:\n${output}`);
      }
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const tag = args.find((arg) => !arg.startsWith("--"));
  publish(tag, { dryRun: args.includes("--dry-run") }).catch((error) => {
    console.error(`publish-npm: ${error.message}`);
    process.exit(1);
  });
}
