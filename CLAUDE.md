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

**Status**: `v0.1.0`. Optimized for small to medium tables. Large-file support,
virtual scrolling, richer export, and Git diff helpers are planned post-release.

## Tech Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 18 + TypeScript (ESM) |
| Build    | Vite 5 + `tsc` |
| Runtime  | Bun (package manager + scripts) |
| Desktop  | Tauri v2 (Rust) — `@tauri-apps/api`, plugins `dialog` / `fs` |
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
│  └─ docs/local/   # private notes (gitignored)
└─ public/
```

## Cross-Platform Notes

- Web build: opens files via the browser file picker, saves by downloading a
  new file. Direct overwrite save is handled by the Tauri desktop app only.
- Desktop file system access goes through Tauri plugins; keep platform-specific
  behavior behind the plugin layer so the React side stays OS-agnostic.

## Build / Run Rules (shared across AI agents)

- **Do not build, run, or commit unless the user explicitly asks.** No
  proactive suggestions or confirmation prompts to build/run/commit. Report only
  the summary of code changes. Type-checking and tests for verifying
  correctness are exempt and may be run as needed.
- Package manager is **Bun**. Common scripts:

  ```sh
  bun install
  bun run dev        # Vite dev server
  bun run test       # vitest run
  bun run lint
  bun run build      # tsc && vite build
  bun run tauri dev  # desktop app
  bun run tauri build
  ```

- Desktop build artifacts are produced by GitHub Actions. In a private repo,
  branch pushes publish downloadable dev artifacts. In a public repo, run
  **Tauri Build** manually, or push a `v*` tag to attach Windows/macOS/Linux
  bundles to a GitHub Release.

## docs/ `.md` Conventions

When creating `.md` files under `docs/`, follow the same naming/status
conventions the user defines in their global guide (`plan_*.md` / `bugfix_*.md`
/ `pending_*.md` with H1 status labels). Private/local notes go under
`docs/local/` (gitignored).

## Related Files

| Item | Path |
|------|------|
| Agent entry point | [AGENTS.md](AGENTS.md) |
| README (EN) | [README.md](README.md) |
| Memory index | [MEMORY.md](MEMORY.md) |
