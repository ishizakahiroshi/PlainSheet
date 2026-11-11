# Changelog

All notable changes to PlainSheet are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
