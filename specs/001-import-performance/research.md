# Phase 0: Research

## Clarifications & Technical Decisions

### 1. How to handle background parsing without blocking the main thread?
- **Options Evaluated**: 
  1. `requestIdleCallback` / `setTimeout` yielding on the main thread.
  2. Native Node.js `worker_threads` (Electron Main Process).
  3. Web Workers (Browser/Renderer Process).
- **Decision**: Web Workers (Renderer Process).
- **Rationale**: While `setTimeout` chunking works, parsing massive 50MB JSON strings (`JSON.parse`) is synchronous and blocks entirely during the parse step, even if we yield later. Moving the file reading and `JSON.parse` to a Web Worker keeps the main UI thread at 60fps. Electron supports standard Web Workers in the renderer with full performance.
- **Alternatives Rejected**: Node.js `worker_threads` add unnecessary IPC overhead between Main and Renderer processes just to parse JSON.

### 2. How to render 2000+ messages instantly in Svelte 5?
- **Options Evaluated**:
  1. Pagination (Load 50 messages at a time).
  2. Native Svelte `{#each}` with DOM recycling / Virtualization.
- **Decision**: Virtualized List Component (`VirtualList.svelte`).
- **Rationale**: Pagination creates a disjointed UX in chat applications (users expect infinite scroll). Virtualization keeps the DOM size small (e.g., only 30 message nodes exist at any time) regardless of if the chat has 10 or 10,000 messages. This solves the "App freezes when opening a chat" issue highlighted by the user.

### 3. How to avoid IndexedDB (Dexie) transaction timeouts?
- **Decision**: Batch Inserts (`db.table.bulkAdd`).
- **Rationale**: Dexie 4 provides highly optimized `bulkAdd` and `bulkPut`. By chunking the parsed output in the Web Worker (e.g., sending 1000 messages at a time to the main thread), we can insert them using `bulkAdd` in short transactions, preventing IndexedDB from locking up the UI thread.
