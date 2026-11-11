// @vitest-environment node
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "..", "..");
const read = (...parts: string[]) => readFileSync(join(repoRoot, ...parts), "utf8");

describe("Microsoft Store package manifest", () => {
  const manifest = read("scripts", "release", "msix", "AppxManifest.xml");

  it("offers the same file types as the desktop bundle", () => {
    const tauri = JSON.parse(read("src-tauri", "tauri.conf.json"));
    const bundled = (tauri.bundle.fileAssociations as { ext: string[] }[])
      .flatMap((association) => association.ext)
      .map((ext) => `.${ext}`)
      .sort();
    const declared = [...manifest.matchAll(/<uap:FileType>([^<]+)<\/uap:FileType>/g)]
      .map((match) => match[1])
      .sort();
    expect(declared).toEqual(bundled);
  });

  it("leaves the version to the build script and starts the released exe", () => {
    expect(manifest).toContain('Version="{{VERSION}}"');
    expect(manifest).toContain('Executable="PlainSheet.exe"');
    const script = read("scripts", "release", "build-msix.ps1");
    expect(script).toContain('$ExeName = "PlainSheet.exe"');
    expect(script).toContain('Replace("{{VERSION}}", $packageVersion)');
  });

  it("declares one Store language per interface language", () => {
    const languages = [...manifest.matchAll(/<Resource Language="([a-z]{2})-[a-z]{2}" \/>/g)]
      .map((match) => match[1])
      .sort();
    const locales = /export type Locale = ([^;]+);/.exec(read("src", "lib", "i18n.ts"))?.[1] ?? "";
    expect(languages).toEqual([...locales.matchAll(/"([a-z]{2})"/g)].map((m) => m[1]).sort());
  });
});
