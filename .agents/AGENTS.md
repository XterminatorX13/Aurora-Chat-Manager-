# Umbra — Agent Rules

> Repository-level context for AI coding agents.
> Personal preferences (communication style, learning profile) belong in your user-level config — not here.

## Project Overview

Umbra is a personal knowledge management (PKM) app for importing, searching, and browsing AI conversation archives (ChatGPT, Claude, Gemini, etc.). It runs as a desktop app via Electron.

- **Stack**: Svelte 5 (Runes) · Vite 8 · Electron 43 · Bun
- **Data**: IndexedDB via Dexie 4, localStorage for small config
- **Main modules**:
  - `src/App.svelte` — root layout and state orchestration
  - `src/lib/parsers/` — per-platform conversation importers
  - `src/lib/db.js` — Dexie database layer
  - `src/lib/components/` — UI (chat, library, sidebar, importer)
  - `electron/` — Electron main process

## Setup & Commands

```bash
bun install              # install deps
bun run dev              # dev server (Vite + Electron)
bun run build            # production bundle (Vite)
bun run electron:build   # full Electron distributable
```

## Engineering Principles

Enforced via Spec Kit's constitution — see `.specify/memory/constitution.md` for the full, versioned set. Summary:

- **No placeholder/mock data** — fail loud instead of silent fallbacks.
- **Read SDKs/source before integrating** — never guess at type shapes or API surfaces.
- **Never port patterns cross-platform** — each parser is built from its native data structures.
- **SOLID** — no God Objects, clear boundaries between UI, state, and data persistence.

## Development Process

This project uses [Spec Kit](https://github.com/github/spec-kit) for spec-driven development:

```
/speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement → /speckit-converge
```

Do not skip straight to implementation for anything beyond a trivial fix.

## Version Control

**Conventional Commits**: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `test`.
- Always imperative description.

## Permissions

- **Allowed without asking**: reading files, running `bun run dev`/`build`, creating branches.
- **Requires approval**: `git push`, deleting files, installing new dependencies, architectural changes.
