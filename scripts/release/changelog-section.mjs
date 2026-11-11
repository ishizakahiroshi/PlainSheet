// Print the section of CHANGELOG.md that belongs to a release tag, without its
// heading. Prints nothing (and still exits 0) when the version has no section,
// so the caller can fall back to generated notes.
//
// usage: node scripts/release/changelog-section.mjs <CHANGELOG.md> <tag>
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { releaseVersion } from "./npm-targets.mjs";

export function changelogSection(changelog, tag) {
  const version = releaseVersion(tag);
  const lines = changelog.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  // The section ends at the next version heading or at the link definitions.
  const end = rest.findIndex((line) => line.startsWith("## ") || /^\[[^\]]+\]:\s/.test(line));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [file, tag] = process.argv.slice(2);
  if (!file || !tag) {
    console.error("usage: changelog-section.mjs <CHANGELOG.md> <tag>");
    process.exit(2);
  }
  const section = changelogSection(readFileSync(file, "utf8"), tag);
  if (section) console.log(section);
}
