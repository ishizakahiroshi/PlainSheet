// Copy the freshly built desktop binary into dist/ so the latest PlainSheet.exe
// always sits next to the web build. Installers are intentionally not produced.
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = join(root, "src-tauri", "target", "release");
const distDir = join(root, "dist");

// Tauri may name the binary after productName (PlainSheet) or the Cargo crate
// (plainsheet); pick whichever exists.
const candidates = ["PlainSheet.exe", "plainsheet.exe", "PlainSheet", "plainsheet"];
const found = candidates.map((n) => join(releaseDir, n)).find((p) => existsSync(p));

if (!found) {
  console.error(`[copy-app] no built binary found in ${releaseDir}`);
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });
const dest = join(distDir, found.endsWith(".exe") ? "PlainSheet.exe" : "PlainSheet");
copyFileSync(found, dest);
console.log(`[copy-app] copied ${found} -> ${dest}`);
