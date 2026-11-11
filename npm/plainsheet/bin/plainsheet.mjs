#!/usr/bin/env node
// Launcher for the `plainsheet` npm package.
//
// PlainSheet is a desktop app. Its native build lives in a platform-specific
// optional dependency (for example `plainsheet-windows-x64`). This file finds
// the one for the current OS inside its own installation, starts it, and
// returns so the terminal is free again.

import { spawn } from "node:child_process";
import { chmodSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// process.platform/arch -> platform package and the path of the app inside it.
const TARGETS = {
  "win32 x64": { pkg: "plainsheet-windows-x64", payload: "bin/PlainSheet.exe" },
  "linux x64": { pkg: "plainsheet-linux-x64", payload: "bin/PlainSheet" },
  "darwin arm64": { pkg: "plainsheet-macos-apple-silicon", payload: "bin/PlainSheet.app" },
};

const RELEASES = "https://github.com/ishizakahiroshi/PlainSheet/releases";

// This package's directory (this file is bin/plainsheet.mjs).
const PACKAGE_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

// The platform package is looked for only inside the installation that holds
// this launcher: this package's own node_modules, then the node_modules of each
// directory above it, up to the directory that contains the outermost
// node_modules on the launcher's path. A normal module lookup would continue to
// every node_modules up to the drive root; on Windows any signed-in user can
// create C:\node_modules, so a missing platform package would start their
// executable with this user's rights.
function searchDirs(pkg) {
  const chain = [];
  for (let dir = PACKAGE_DIR; ; ) {
    chain.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  let rootIndex = 0;
  chain.forEach((dir, index) => {
    if (basename(dir) === "node_modules" && index + 1 < chain.length) rootIndex = index + 1;
  });
  return {
    installRoot: chain[rootIndex],
    dirs: chain
      .slice(0, rootIndex + 1)
      .filter((dir) => basename(dir) !== "node_modules")
      .map((dir) => join(dir, "node_modules", pkg)),
  };
}

function readManifest(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  } catch {
    return undefined;
  }
}

function resolveApp() {
  const key = `${process.platform} ${process.arch}`;
  const target = TARGETS[key];
  if (!target) {
    throw new Error(
      `PlainSheet has no npm build for ${key}.\n` +
        `Supported: ${Object.keys(TARGETS).join(", ")}.\n` +
        `Other downloads: ${RELEASES}`,
    );
  }
  // The root package pins the platform package to its exact version.
  const wanted = readManifest(PACKAGE_DIR)?.optionalDependencies?.[target.pkg];
  const { installRoot, dirs } = searchDirs(target.pkg);
  const problems = [];
  if (typeof wanted !== "string" || !wanted) {
    problems.push(`plainsheet's package.json does not name the version of ${target.pkg}.`);
  } else {
    for (const dir of dirs) {
      const manifest = readManifest(dir);
      if (manifest === undefined) {
        if (existsSync(dir)) problems.push(`${dir} has no readable package.json.`);
        continue;
      }
      if (manifest.name !== target.pkg || manifest.version !== wanted) {
        problems.push(
          `${dir} holds ${manifest.name}@${manifest.version}; this plainsheet needs ${target.pkg}@${wanted}.`,
        );
        continue;
      }
      const app = join(dir, ...target.payload.split("/"));
      if (existsSync(app)) return app;
      problems.push(`${dir} has no ${target.payload}.`);
    }
  }
  throw new Error(
    `The platform package "${target.pkg}" is not installed.\n` +
      `It is an optional dependency of plainsheet and is normally installed with it.\n` +
      `Reinstall with optional dependencies enabled (avoid --no-optional / --omit=optional).\n` +
      `plainsheet looks for it only inside its own installation: ${installRoot}` +
      problems.map((problem) => `\n${problem}`).join(""),
  );
}

// A file named relative to the terminal's folder must still be found by the
// app, which may start in another folder (macOS starts apps in "/").
function absolutize(args) {
  return args.map((arg) => {
    if (arg.startsWith("-")) return arg;
    const full = resolve(arg);
    return existsSync(full) ? full : arg;
  });
}

// The unix exec bit is lost when a tarball is packed on Windows. Restore it at
// start so the package works wherever it was packed. Best effort: a read-only
// global install already carries the right mode from a posix pack.
function ensureExecutable(path) {
  try {
    chmodSync(path, 0o755);
  } catch {
    // fall through; spawn reports the real problem if there is one
  }
}

function main() {
  let app;
  try {
    app = resolveApp();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  const args = absolutize(process.argv.slice(2));
  let command = app;
  let commandArgs = args;

  if (process.platform === "darwin") {
    const macosDir = join(app, "Contents", "MacOS");
    try {
      for (const name of readdirSync(macosDir)) {
        const file = join(macosDir, name);
        if (statSync(file).isFile()) ensureExecutable(file);
      }
    } catch {
      // `open` below reports a broken bundle
    }
    // Start the bundle through `open` so macOS treats it as an app (Dock icon,
    // window comes to the front). -n: a new instance per invocation.
    command = "/usr/bin/open";
    commandArgs = ["-n", app, ...(args.length ? ["--args", ...args] : [])];
  } else if (process.platform !== "win32") {
    ensureExecutable(app);
  }

  // Detached and without stdio: the app keeps running after this process ends.
  const child = spawn(command, commandArgs, { detached: true, stdio: "ignore" });
  child.on("error", (error) => {
    process.stderr.write(`plainsheet: could not start the app: ${error.message}\n`);
    if (process.platform === "linux") {
      process.stderr.write(
        "On Linux the app needs WebKitGTK 4.1 (for example the libwebkit2gtk-4.1-0 package).\n",
      );
    }
    process.exit(1);
  });
  child.on("spawn", () => {
    child.unref();
    process.exit(0);
  });
}

main();
