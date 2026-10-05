# PlainSheet

A local-first plain text spreadsheet editor for humans and AI.

PlainSheet opens CSV and other plain text table files as a clean editable sheet, keeps the data local, and saves back to plain text instead of converting it to a binary spreadsheet format.

## Browser and app editions

- **Browser edition:** no installation for opening and editing files. **Download** / **Download as** create a copy; they never overwrite the opened file. A download-start notice does not prove that the browser finished saving the copy. Check the downloaded file before closing; unsaved-change protection remains active after editing. Browser output is UTF-8 or UTF-8 BOM; use the app for other encodings.
- **Tauri app:** **Save** writes to the opened path; **Save as** chooses another destination. Cancelling or failing a save keeps changes unsaved. Saving captures the originating document, so switching to a same-name tab while writing does not redirect the write or mark that other document saved.
- Both editions process file contents on the device and share editing operations. There is no server upload or AI API call.

### Editing and data safety

- Enter / Shift+Enter commit and move down / up; Tab / Shift+Tab move right / left. Alt+Enter inserts an in-cell newline. F2 keeps the value and places the caret at the end; typing replaces it; Esc cancels. Save commits an active editor first; finish an IME composition before saving. Real IME acceptance is still pending.
- Ctrl+Arrow uses actual data runs, Ctrl+A selects actual data, and the name box accepts a cell/range. Right-clicking inside a selected range preserves that range. Ctrl+D / Ctrl+R fill from its first row / column.
- Filtered copy, paste, clear, search and replacement target visible rows. A multi-row paste with too few visible destinations is rejected entirely. Clear filters to operate on every row. The first row is retained only when **Treat first row as header** is enabled; counts explicitly include that header.
- Filtering does not remove rows from saved output. Sorting changes saved row order, matching the existing behavior. Moving a column changes saved column order and carries its width with it. Undo restores data, column widths and exact row/column selections for these edits. Selection statistics exclude unselected gaps and hidden rows.
- A browser reload/close warns conservatively while editing. The app's own title-bar close asks before discarding pending changes. **OS/menu/Alt+F4 close protection is not verified**; save before using those paths.

The Linux packaging selector has been repaired, and Windows/macOS/Linux build and staging succeeded for the intermediate candidate `e326df7`. Further selection-history fixes are undergoing checks on their own commit. Real-screen/Windows/IME/performance acceptance is still pending. Passing automated checks is not a release-readiness claim. See the [progress and validation records](docs/bot/excel-like-ux-overhaul/PROGRESS.md) and [representative local acceptance checklist](docs/manual-check-excel-like-ux.md).

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
