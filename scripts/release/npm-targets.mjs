// The npm platform packages and the GitHub Release asset each one is built
// from. This is the single list the staging and publishing scripts read; the
// launcher (npm/plainsheet/bin/plainsheet.mjs) ships without this file, so it
// keeps its own copy and src/tests/npmPackaging.test.ts proves they agree.
export const ROOT_PACKAGE = "plainsheet";

export const TARGETS = [
  {
    target: "win32 x64",
    pkg: "plainsheet-windows-x64",
    // Standalone asset: copied as-is.
    asset: "PlainSheet.exe",
    kind: "file",
    payload: "bin/PlainSheet.exe",
  },
  {
    target: "linux x64",
    pkg: "plainsheet-linux-x64",
    asset: "PlainSheet-linux-x86_64",
    kind: "file",
    payload: "bin/PlainSheet",
  },
  {
    target: "darwin arm64",
    pkg: "plainsheet-macos-apple-silicon",
    // macOS ships only the .app archive; the bundle is extracted from it.
    asset: "PlainSheet-macos-aarch64.tar.gz",
    kind: "app-archive",
    archiveMember: "PlainSheet-macos-aarch64/PlainSheet.app",
    payload: "bin/PlainSheet.app",
  },
];

// vX.Y.Z or vX.Y.Z-pre.N -> X.Y.Z[-pre.N]. Build metadata is rejected: the tag
// is the only source of the version (one fact, one place).
export function releaseVersion(tag) {
  const version = typeof tag === "string" ? tag.replace(/^v/, "") : "";
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/.test(version)
  ) {
    throw new Error(`invalid release tag: ${JSON.stringify(tag)} (expected vX.Y.Z)`);
  }
  return version;
}
