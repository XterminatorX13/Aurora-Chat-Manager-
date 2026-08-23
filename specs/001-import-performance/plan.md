# Implementation Plan: Non-blocking Large Conversation Import & Rendering

**Branch**: `001-import-performance` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-import-performance/spec.md`

## Summary

Resolve UI freezing during massive data imports and chat rendering by offloading parsing to background threads (Web Workers) and implementing a Virtualized List for DOM rendering.

## Technical Context

**Language/Version**: JavaScript (ES2022+), Svelte 5 (Runes)

**Primary Dependencies**: Svelte 5, Dexie 4 (IndexedDB)

**Storage**: IndexedDB via Dexie 4

**Target Platform**: Electron 43 Desktop App (Chromium + Node)

**Project Type**: Desktop App (PKM)

**Performance Goals**: <100ms UI freeze on 50MB+ imports, <300ms initial render for 2000+ messages, 60fps scrolling.

**Constraints**: SOLID architecture (No God Objects). Separation between parsing logic, state management, and UI rendering.

**Scale/Scope**: Handling files up to 100MB, databases with 10k+ conversations and millions of messages.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **No placeholder/mock data**: The solution must handle real JSON/Zip archives natively.
- [x] **Read SDKs/source before integrating**: We will verify Dexie 4 bulk insertion and Svelte 5 reactivity limits before writing code.
- [x] **Never port patterns cross-platform**: Each parser will remain specific to its platform, just wrapped in a non-blocking execution context.
- [x] **SOLID with no God Objects**: The parsing logic will be strictly separated from the Svelte components.

## Project Structure

### Documentation (this feature)

```text
specs/001-import-performance/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
└── tasks.md             
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── db.js                 # Dexie configuration and bulk operations
│   ├── parsers/              # Platform-specific parsers
│   │   ├── worker.js         # Web worker for offloading heavy JSON parsing
│   │   └── index.js          # Main thread API for interacting with the worker
│   └── components/
│       ├── virtual/
│       │   └── VirtualList.svelte # Reusable virtualized list component
│       ├── chat/
│       │   └── ChatView.svelte    # Chat view utilizing VirtualList
│       └── importer/
│           └── ImportModal.svelte # UI for progress tracking
```

**Structure Decision**: The parsing logic will be moved behind a Web Worker interface in `src/lib/parsers/worker.js`. The UI will gain a reusable `VirtualList.svelte` to handle DOM recycling for huge message arrays.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
