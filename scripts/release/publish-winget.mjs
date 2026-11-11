// Offer a released version to winget: write the three manifests that point at
// the Windows exe of the published GitHub Release and open a pull request
// against microsoft/winget-pkgs from the token owner's fork.
//
// winget is a pointer channel: it downloads the release asset itself and
// checks it against the SHA-256 written here, which is read from the release's
// SHA256SUMS.txt after the downloaded exe was checked against it.
//
// usage: node scripts/release/publish-winget.mjs <assets-dir> <tag> [--dry-run <out-dir>]
// env:   GH_TOKEN (not needed for --dry-run), GITHUB_REPOSITORY (owner/name)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { releaseVersion } from "./npm-targets.mjs";

export const PACKAGE_ID = "ishizakahiroshi.PlainSheet";
const UPSTREAM = "microsoft/winget-pkgs";
const SCHEMA = "1.12.0";
const ASSET = "PlainSheet.exe";

export function buildManifests({ version, sha256, repository }) {
  const header = (kind) =>
    `# yaml-language-server: $schema=https://aka.ms/winget-manifest.${kind}.${SCHEMA}.schema.json\n` +
    `PackageIdentifier: ${PACKAGE_ID}\nPackageVersion: "${version}"\n`;
  const footer = (kind) => `ManifestType: ${kind}\nManifestVersion: ${SCHEMA}\n`;
  const url = `https://github.com/${repository}`;
  return {
    [`${PACKAGE_ID}.yaml`]: header("version") + "DefaultLocale: en-US\n" + footer("version"),
    [`${PACKAGE_ID}.locale.en-US.yaml`]:
      header("defaultLocale") +
      "PackageLocale: en-US\n" +
      "Publisher: ishizakahiroshi\n" +
      "PublisherUrl: https://github.com/ishizakahiroshi\n" +
      `PublisherSupportUrl: ${url}/issues\n` +
      "PackageName: PlainSheet\n" +
      `PackageUrl: ${url}\n` +
      "License: MIT\n" +
      `LicenseUrl: ${url}/blob/v${version}/LICENSE\n` +
      "ShortDescription: Local-first plain text spreadsheet editor for CSV, TSV, Markdown tables, JSON and YAML\n" +
      "Tags:\n- csv\n- tsv\n- spreadsheet\n- editor\n- markdown\n" +
      `ReleaseNotesUrl: ${url}/releases/tag/v${version}\n` +
      footer("defaultLocale"),
    [`${PACKAGE_ID}.installer.yaml`]:
      header("installer") +
      "InstallerType: portable\n" +
      "Commands:\n- plainsheet\n" +
      "Installers:\n" +
      "- Architecture: x64\n" +
      `  InstallerUrl: ${url}/releases/download/v${version}/${ASSET}\n` +
      `  InstallerSha256: ${sha256.toUpperCase()}\n` +
      footer("installer"),
  };
}

// SHA-256 of the exe, taken from SHA256SUMS.txt once the file on disk matches it.
export function verifiedSha256(assetsDir) {
  const sums = readFileSync(join(assetsDir, "SHA256SUMS.txt"), "utf8");
  const line = sums.split(/\r?\n/).find((entry) => entry.trim().endsWith(` ${ASSET}`));
  const expected = /^([0-9a-f]{64})\s/.exec(line?.trim() ?? "")?.[1];
  if (!expected) throw new Error(`SHA256SUMS.txt has no entry for ${ASSET}`);
  const actual = createHash("sha256")
    .update(readFileSync(join(assetsDir, ASSET)))
    .digest("hex");
  if (actual !== expected) throw new Error(`checksum mismatch for ${ASSET}`);
  return expected;
}

async function api(token, path, method = "GET", body) {
  const response = await fetch(`https://api.github.com/${path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`GitHub ${method} ${path} -> ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

async function openPullRequest(manifests, version, token) {
  const owner = (await api(token, "user")).login;
  const fork = `${owner}/winget-pkgs`;
  try {
    await api(token, `repos/${fork}/merge-upstream`, "POST", { branch: "master" });
  } catch (error) {
    // The branch below starts from upstream's commit, so a stale fork is fine.
    console.log(`::warning::could not sync ${fork} (${error.message}); continuing`);
  }
  const upstream = (await api(token, `repos/${UPSTREAM}/git/ref/heads/master`)).object.sha;
  const branch = `plainsheet-${version}`;
  const refs = await api(token, `repos/${fork}/git/matching-refs/heads/${branch}`);
  const existing = refs.find((ref) => ref.ref === `refs/heads/${branch}`);
  const parent = existing ? existing.object.sha : upstream;
  const baseTree = (await api(token, `repos/${fork}/git/commits/${parent}`)).tree.sha;
  const [, publisher, name] = /^([^.]+)\.(.+)$/.exec(PACKAGE_ID);
  const prefix = `manifests/${publisher[0].toLowerCase()}/${publisher}/${name}/${version}/`;
  const tree = Object.entries(manifests).map(([file, content]) => ({
    path: prefix + file,
    mode: "100644",
    type: "blob",
    content,
  }));
  const newTree = (
    await api(token, `repos/${fork}/git/trees`, "POST", { base_tree: baseTree, tree })
  ).sha;
  const title = `New version: ${PACKAGE_ID} version ${version}`;
  if (newTree !== baseTree) {
    const commit = (
      await api(token, `repos/${fork}/git/commits`, "POST", {
        message: title,
        tree: newTree,
        parents: [parent],
      })
    ).sha;
    if (existing) {
      await api(token, `repos/${fork}/git/refs/heads/${branch}`, "PATCH", {
        sha: commit,
        force: false,
      });
    } else {
      await api(token, `repos/${fork}/git/refs`, "POST", {
        ref: `refs/heads/${branch}`,
        sha: commit,
      });
    }
  }
  const head = `${owner}:${branch}`;
  const pulls = await api(
    token,
    `repos/${UPSTREAM}/pulls?state=all&base=master&head=${encodeURIComponent(head)}`,
  );
  const current = pulls.find((pull) => pull.state === "open" || pull.merged_at);
  if (current) {
    console.log(`winget pull request already exists: ${current.html_url}`);
    return;
  }
  const created = await api(token, `repos/${UPSTREAM}/pulls`, "POST", {
    title,
    head,
    base: "master",
    body: `Points at the release asset of v${version}; the SHA-256 comes from the release's SHA256SUMS.txt.`,
  });
  console.log(`opened ${created.html_url}`);
}

export async function publish(assetsDir, tag, { dryRunDir, env = process.env } = {}) {
  const version = releaseVersion(tag);
  if (version.includes("-")) throw new Error("winget takes stable versions only");
  const repository = env.GITHUB_REPOSITORY || "ishizakahiroshi/PlainSheet";
  const manifests = buildManifests({ version, sha256: verifiedSha256(assetsDir), repository });
  if (dryRunDir) {
    mkdirSync(dryRunDir, { recursive: true });
    for (const [file, content] of Object.entries(manifests)) {
      writeFileSync(join(dryRunDir, file), content);
    }
    console.log(`DRY-RUN wrote ${Object.keys(manifests).length} manifests to ${dryRunDir}`);
    return;
  }
  if (!env.GH_TOKEN) throw new Error("GH_TOKEN is required to open the pull request");
  await openPullRequest(manifests, version, env.GH_TOKEN);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dry = args.indexOf("--dry-run");
  const dryRunDir = dry >= 0 ? args[dry + 1] : undefined;
  const [assetsDir, tag] = args.filter(
    (arg, index) => dry < 0 || (index !== dry && index !== dry + 1),
  );
  if (!assetsDir || !tag || (dry >= 0 && !dryRunDir)) {
    console.error("usage: publish-winget.mjs <assets-dir> <tag> [--dry-run <out-dir>]");
    process.exit(2);
  }
  publish(resolve(assetsDir), tag, { dryRunDir: dryRunDir && resolve(dryRunDir) }).catch(
    (error) => {
      console.error(`publish-winget: ${error.message}`);
      process.exit(1);
    },
  );
}
