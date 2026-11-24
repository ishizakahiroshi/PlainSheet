# Changelog

All notable changes to PlainSheet are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-11-24

### Fixed

- Desktop: closing a tab or the window (title bar, Alt+F4, taskbar) with
  unsaved edits now asks first; before, the prompt never blocked.
- Reopening a file that has unsaved edits in another tab shows that tab instead
  of reloading it from disk. A save marks only the tab it started from as saved.
- Markdown: saving keeps the text around the table and the column alignments.
- Web: files that are not UTF-8 are refused instead of being saved back as
  replacement characters. A browser download keeps the sheet marked unsaved.
- Fill handle: the source cells are no longer overwritten; dates, `item-1`,
  `001` and decimals continue as expected.
- JSON / YAML: untouched values keep their type and exact text (large integers,
  `1.50`, `null`, nested objects, YAML comments); edited cells keep their
  column's type.
- CSV: text after a closing quote (`"Hello" she said`) and unterminated quotes
  no longer lose characters or swallow the rest of the file; the final line
  break and the dominant line ending are kept; editing a cell no longer pads
  other short rows.
- The formula bar keeps line breaks in a cell (Shift+Enter adds one).
- Status bar totals count only visible rows and columns.
- A slow regular-expression search is stopped instead of freezing the window.
- Desktop: a UTF-8 file with a few broken bytes opens as UTF-8; a guessed
  Latin-1 file or Shift_JIS characters that change on save are reported, and
  Settings can reopen a file in another encoding.
- Desktop: saving writes a temporary file and replaces the original, and asks
  before overwriting a file another app changed.
- Load errors say why (too large, UTF-16, binary, not a table).
- Sorting treats `0x10` and similar codes as text.

### Added

- Open several files at once (dialog, drag and drop, command line). A second
  launch hands its files to the running app.
- The filter list has a search box and draws at most 500 values.
- Typing a little below or right of the data extends the sheet.
- Toolbar tooltips with shortcuts.

### Changed

- CI actions run on Node 24 and are pinned by commit; Bun and Rust versions are
  fixed. The Docker image checks the hashes of its downloads.
- vite 6 and vitest 4 for development; Rust crates with security fixes.
- npm: publishing an older version again no longer moves the `latest` tag back.

## [0.1.1] - 2026-11-11

### Fixed

- Windows: a console window no longer opens next to the app when it is started
  from the Start menu, Explorer or a file association.

### Added

- Microsoft Store package (MSIX) built from the released Windows exe, and a
  privacy policy ([PRIVACY.md](PRIVACY.md)).
- winget manifests are submitted from the release (`ishizakahiroshi.PlainSheet`).

### Changed

- Release pages now show this changelog's section for the version.

## [0.1.0] - 2026-11-11

First public release.

### Added

- Open CSV, TSV, Markdown table, JSON array and YAML list files as an editable
  sheet, and save them back as plain text.
- Desktop app (Windows x64, Linux x64, macOS Apple silicon) with overwrite
  save, drag and drop, a recent-files list and document tabs.
- Web build that opens files through the browser file picker and saves by
  download.
- Encodings in the desktop app: UTF-8, UTF-8 with BOM, Shift_JIS, EUC-JP and
  Latin-1, detected on open and selectable on save.
- Editing: keyboard navigation, add and delete rows and columns, autofill,
  search and replace, undo and redo, copy and paste of ranges as TSV.
- Sorting, filtering, and selection of multiple rows, columns and ranges with
  Shift, Ctrl and dragging, including on row and column headers.
- Status bar summaries for the current selection.
- Settings for theme, a CSV/TSV formula-injection guard, and omitting empty
  cells in JSON/YAML.
- Open a file at start: `plainsheet data.csv`, a file chosen through
  "Open with", or a document opened from Finder on macOS.
- Distribution through GitHub Releases with SHA-256 checksums, and through npm
  (`npx plainsheet`), which installs the same files as the release.

### Security

- The desktop app reads and writes files only through narrow commands that
  accept absolute paths to regular files of at most 50 MB; the general
  file-system plugin is not enabled.
- Files containing NUL bytes or UTF-16 text are rejected instead of being
  shown with silently damaged content.
- The development and preview servers listen on the loopback address only.

[0.1.1]: https://github.com/ishizakahiroshi/PlainSheet/releases/tag/v0.1.1
[0.1.0]: https://github.com/ishizakahiroshi/PlainSheet/releases/tag/v0.1.0
