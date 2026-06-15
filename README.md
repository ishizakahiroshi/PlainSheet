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
- Local-first: no server upload and no AI API calls

## Status

PlainSheet is at `v0.1.0`. It is optimized for small to medium plain text tables. Large file support, virtual scrolling, richer export options, and Git diff helpers are planned after the first release.

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
