# Tasks: Non-blocking Large Conversation Import & Rendering

**Input**: Design documents from `/specs/001-import-performance/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Foundational

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T001 Verify and update Dexie configuration for high-performance bulk operations in `src/lib/db.js`
- [x] T002 Scaffold Web Worker infrastructure (entry point, build step if needed) in `src/lib/parsers/worker.js`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 2: User Story 1 - Responsive Import Process (Priority: P1) 🎯 MVP

**Goal**: Offload heavy parsing to Web Workers and use IndexedDB bulk imports so the UI doesn't freeze.

**Independent Test**: Importing a 50MB archive keeps the UI responsive (menus clickable, progress bar moving).

### Implementation for User Story 1

- [x] T003 [P] [US1] Implement JSON parsing logic inside Web Worker in `src/lib/parsers/worker.js`
- [x] T004 [P] [US1] Create the main-thread Worker API wrapper in `src/lib/parsers/index.js`
- [x] T005 [US1] Implement `bulkAdd` transactions for the parsed worker output in `src/lib/db.js`
- [x] T006 [US1] Update `src/lib/components/importer/ImportModal.svelte` to track worker progress (percentage/spinner) and prevent main-thread locking

**Checkpoint**: At this point, importing huge files should no longer crash or freeze the app.

---

## Phase 3: User Story 2 - Instant Large Chat Loading (Priority: P1)

**Goal**: Render conversations with thousands of messages instantly using a Virtualized List.

**Independent Test**: Opening a chat with 5000+ messages renders the first visible nodes in <300ms and scrolls smoothly.

### Implementation for User Story 2

- [ ] T007 [P] [US2] Implement the highly optimized Virtualized DOM container in `src/lib/components/virtual/VirtualList.svelte`
- [ ] T008 [US2] Refactor `src/lib/components/chat/ChatView.svelte` to replace `{#each}` loops with `<VirtualList>` passing down the message array
- [ ] T009 [US2] Fine-tune height calculations and scroll anchoring in `VirtualList.svelte` to ensure buttery smooth scrolling up and down.

**Checkpoint**: User Stories 1 AND 2 should both work independently. Chat loads instantly.

---

## Phase 4: User Story 3 - Library & Sidebar Scalability (Priority: P1)

**Goal**: Render 10,000+ conversations in the Library without freezing, and fix missing resources/message counts caused by the database split.

### Implementation for User Story 3

- [x] T010 [P] [US3] Update `src/lib/parsers/worker.js` to extract and save `messageCount` and `resources` directly into the conversation object.
- [x] T011 [US3] Update `src/lib/components/library/LibraryView.svelte` to read the pre-computed `messageCount` and `resources` instead of iterating `c.messages`.
- [x] T012 [US3] Refactor `LibraryView.svelte` to use a true `<VirtualList>` or a highly optimized lazy-rendering strategy for the grouped lists to prevent DOM explosion.

**Checkpoint**: Library no longer freezes when expanding all groups with 10k items.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T013 [P] Test both import and chat rendering against Memory Leaks (ensure Web Worker terminates properly).
- [ ] T014 Run `quickstart.md` manual validation scenarios to confirm UI frame rates.

---

## Dependencies & Execution Order

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. Handles the data ingress.
- **User Story 2 (P1)**: Can start after Foundational. Handles the data egress (rendering). Can be implemented independently of US1 if we mock the data, but practically follows US1 so we can test with the imported data.

### Parallel Opportunities

- The Worker logic (`T003`, `T004`) and the Virtual List component (`T007`) touch entirely different layers (data vs UI) and can be developed in parallel.
