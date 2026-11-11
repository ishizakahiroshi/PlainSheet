# PlainSheet

A local-first plain text spreadsheet editor. PlainSheet opens CSV, TSV,
Markdown tables, JSON arrays and YAML lists as an editable sheet and saves them
back as plain text. Files stay on your machine: no upload, no AI API calls.

This package installs the PlainSheet desktop app for your platform and adds a
`plainsheet` command that starts it.

## Try it once

```sh
npx plainsheet
```

## Install

```sh
npm install -g plainsheet
plainsheet
```

`pnpm add -g plainsheet` and `bun install -g plainsheet` work the same way.

## Platforms

| Platform              | Package installed                |
| --------------------- | -------------------------------- |
| Windows x64           | `plainsheet-windows-x64`         |
| Linux x64             | `plainsheet-linux-x64`           |
| macOS (Apple silicon) | `plainsheet-macos-apple-silicon` |

The platform package is an optional dependency, so keep optional dependencies
enabled when installing (do not pass `--omit=optional`).

- **Windows** needs the Microsoft Edge WebView2 Runtime, which Windows 11 and
  current Windows 10 already include.
- **Linux** needs WebKitGTK 4.1 (for example `libwebkit2gtk-4.1-0` on Debian
  and Ubuntu).

The app in these packages is the same file that is attached to the matching
[GitHub Release](https://github.com/ishizakahiroshi/PlainSheet/releases); it is
copied from the release and checked against the release's SHA-256 list before
publishing. The builds are not code-signed.

## More

- Source, issues and other downloads: <https://github.com/ishizakahiroshi/PlainSheet>
- License: MIT
