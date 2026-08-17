# PlainSheet Development Guide

> This file holds **project-specific** rules only. Personal/global AI rules
> (language, confirmation style, question format, screenshot conventions, etc.)
> live outside this repository — in each AI tool's own global instruction
> location. This file must stay valid for a fresh public clone with no private
> files.

## Project Overview

**PlainSheet** — a local-first plain text spreadsheet editor for humans and AI.
It opens CSV and other plain text table files as a clean editable sheet, keeps
the data local, and saves back to plain text instead of converting to a binary
spreadsheet format.

- Open CSV, TSV, Markdown Table, JSON array, and YAML list files
- Edit cells with keyboard-friendly navigation; add/delete rows and columns
- Search, replace, undo, redo; copy/paste ranges as TSV
- Save as UTF-8, UTF-8 BOM, Shift_JIS, EUC-JP, or Latin-1 in the desktop app
- Local-first: no server upload, no AI API calls

**Status**: `v0.1.0`. Optimized for small to medium tables. The grid is a
canvas-virtualized component (`glide-data-grid`). Large-file support, richer
export, and Git diff helpers are planned post-release.

## Tech Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 18 + TypeScript (ESM) |
| Build    | Vite 5 + `tsc` |
| Runtime  | Bun (package manager + scripts) |
| Grid     | `@glideapps/glide-data-grid` (canvas-based, virtualized) |
| Desktop  | Tauri v2 (Rust) — `@tauri-apps/api`, plugin `dialog`; file IO via custom Rust commands (`encoding_rs`) |
| Parsing  | `yaml` for YAML; custom parsers for CSV/TSV/MD/JSON |
| Icons    | `lucide-react` |
| Test     | Vitest + Testing Library + jsdom |
| Lint     | ESLint (flat config) + Prettier |

## Directory Layout

```
PlainSheet/
├─ src/
│  ├─ components/   # React UI components
│  ├─ hooks/        # custom hooks (e.g. useFile)
│  ├─ lib/          # parsers, i18n, encoding helpers
│  ├─ styles/
│  ├─ types/
│  └─ tests/        # Vitest specs
├─ src-tauri/
│  ├─ src/          # Rust entry / commands
│  └─ capabilities/ # Tauri permission capabilities
├─ docs/            # specs, notes, plans
│  └─ local/        # private notes (gitignored)
├─ scripts/         # build helpers (copy-app.mjs)
├─ assets/          # icons / images
├─ archive/         # archived plans
└─ public/
```

## Cross-Platform Notes

- Web build: opens files via the browser file picker, saves by downloading a
  new file. Direct overwrite save is handled by the Tauri desktop app only.
- Desktop file system access goes through Tauri plugins; keep platform-specific
  behavior behind the plugin layer so the React side stays OS-agnostic.

## Shared AI Working Rules

Common AI working rules — no build/run/commit without an explicit user request,
secrets-scan duties, and the `plan_*` / `bugfix_*` / `pending_*` md conventions
under `docs/` — follow each user's global AI configuration, which lives outside
this repository (author's environment: `~/.claude/CLAUDE.md` and
`~/.claude/guides/`). Private/local notes go under `docs/local/` (gitignored).

## Build / Run

- Package manager is **Bun**. Common scripts:

  ```sh
  bun install
  bun run dev          # Vite dev server
  bun run test         # vitest run
  bun run lint
  bun run build        # tsc && vite build
  bun run tauri dev    # desktop app (dev)
  bun run tauri:build  # tauri build --no-bundle + scripts/copy-app.mjs
  ```

- Desktop build artifacts are produced by GitHub Actions (**Tauri Build**
  workflow): branch pushes, PRs, and manual dispatch publish downloadable dev
  artifacts; pushing a `v*` tag attaches Windows/macOS/Linux bundles to a
  GitHub Release.

## Related Files

| Item | Path |
|------|------|
| Agent entry point | [AGENTS.md](AGENTS.md) |
| README (EN) | [README.md](README.md) |
| Memory index | [MEMORY.md](MEMORY.md) |
