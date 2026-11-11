# PlainSheet

A local-first plain text spreadsheet editor for humans and AI.

PlainSheet opens CSV and other plain text table files as a clean editable sheet, keeps the data local, and saves back to plain text instead of converting it to a binary spreadsheet format.

## Features

- Open CSV, TSV, Markdown Table, JSON array, and YAML list files
- Auto-fit columns when a file is opened
- Edit cells directly with keyboard-friendly navigation
- Add and delete rows and columns
- Search, replace, undo, and redo
- Copy and paste cell ranges as TSV
- Save with UTF-8, UTF-8 BOM, Shift_JIS, EUC-JP, or Latin-1 in the Tauri app
- Drag and drop files in the desktop app and web demo
- Open a file straight from the command line or the "Open with" menu in the desktop app
- Local-first: no server upload and no AI API calls

## Install

**npm** (Windows x64, Linux x64, macOS Apple silicon) — installs the desktop app for your platform:

```sh
npx plainsheet            # try it once
npm install -g plainsheet # install, then run `plainsheet` or `plainsheet data.csv`
```

**Download** — get the file for your platform from the [latest release](https://github.com/ishizakahiroshi/PlainSheet/releases/latest):

| Platform              | File                                                          |
| --------------------- | ------------------------------------------------------------- |
| Windows x64           | `PlainSheet.exe` (or the `.zip` with README and LICENSE)      |
| Linux x64             | `PlainSheet-linux-x86_64` (or the `.tar.gz`)                  |
| macOS (Apple silicon) | `PlainSheet-macos-aarch64.tar.gz` (contains `PlainSheet.app`) |

Each release lists SHA-256 checksums in `SHA256SUMS.txt`; the npm packages carry the same files.

The builds are not code-signed. A file downloaded in a browser can trigger a Windows SmartScreen or macOS Gatekeeper warning on first start; installing through npm avoids the browser download. Linux needs WebKitGTK 4.1 (for example `libwebkit2gtk-4.1-0`), and Windows needs the WebView2 Runtime that Windows 11 and current Windows 10 already include.

## Status

PlainSheet is at `v0.1.1`. It is optimized for small to medium plain text tables; files larger than 50 MB are not opened by the desktop app. Richer export options and Git diff helpers are planned after the first release. See [CHANGELOG.md](CHANGELOG.md).

## Development

This project uses Bun.

```sh
bun install
bun run dev
bun run test
bun run build
```

For the desktop app:

```sh
bun run tauri dev
bun run tauri build
```

Desktop build checks are produced by GitHub Actions. In a private repository, branch pushes automatically publish downloadable development artifacts for local testing. In a public repository, pull requests and branch pushes run Tauri builds without publishing artifacts; run **Tauri Build** manually for development artifacts, or push a `v*` tag to attach Windows, macOS, and Linux bundles to a GitHub Release.

## Format Notes

PlainSheet treats every cell as plain text, so some conversions are inherently lossy:

- **JSON / YAML**: cells are written back as strings, so numbers and booleans become quoted strings, and a key that was missing on one record is written as an empty string on every record. Enable **Omit empty cells (JSON/YAML)** in Settings to drop empty values instead of emitting empty keys.
- **Markdown**: the table format cannot preserve leading or trailing spaces inside a cell. Use CSV, TSV, or JSON when surrounding whitespace matters.
- **CSV / TSV**: cells beginning with `=`, `+`, `-`, or `@` are written verbatim. If you plan to open the file in another spreadsheet app, enable **Formula-injection guard (CSV/TSV)** in Settings to prefix those cells with `'` so they are not evaluated as formulas.

## Web Demo Notes

The web build can open files through the browser file picker and saves by downloading a new file. Direct overwrite save is handled by the Tauri desktop app.

## License

MIT
