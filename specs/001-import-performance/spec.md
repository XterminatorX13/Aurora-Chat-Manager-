# Feature Specification: Non-blocking Large Conversation Import & Rendering

**Feature Branch**: `001-import-performance`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Quero que ao importar conversas de qualquer um dos provedores, a biblioteca e a interface não trave"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Responsive Import Process (Priority: P1)

As a user importing a massive archive (e.g., years of ChatGPT history), I want the application to remain responsive and show me the progress, so that I don't think the app crashed while parsing my data.

**Why this priority**: Importing is the critical first step for any PKM. If the app freezes during import, users will force-quit and abandon the software.

**Independent Test**: Can be fully tested by importing a 50MB+ mock archive. The UI (sidebar, buttons) must remain clickable during the import process.

**Acceptance Scenarios**:

1. **Given** the user selects a large file for import, **When** the parsing begins, **Then** the UI remains responsive and displays a loading/progress state.
2. **Given** an ongoing import, **When** the user clicks around the application, **Then** the application responds without significant input lag.

---

### User Story 2 - Instant Large Chat Loading (Priority: P1)

As a user opening a conversation with thousands of messages, I want the chat view to load instantly without freezing my computer, so I can start reading or searching immediately.

**Why this priority**: The core value of the PKM is reading and referencing past conversations. Freezing on long threads (like the 1500+ message example) destroys the UX.

**Independent Test**: Can be fully tested by generating a mock conversation with 5000 messages and opening it. It should render instantly.

**Acceptance Scenarios**:

1. **Given** a saved conversation with 2000+ messages, **When** the user clicks to open it, **Then** the UI renders the visible messages immediately.
2. **Given** the user is viewing a massive conversation, **When** they scroll up or down, **Then** the scrolling remains smooth without stuttering.

### User Story 3 - Library & Sidebar Scalability (Priority: P1)

As a user with 10,000+ imported conversations, I want the Library and Sidebar to remain fast, so that I can browse my history and resources without the app crashing or dropdowns freezing.

**Why this priority**: If the library crashes, the user cannot access any of the data they just imported.

**Independent Test**: Expand all groups in the Library with 10,000 conversations. The UI must remain responsive.

**Acceptance Scenarios**:

1. **Given** 10,000+ conversations in the library, **When** I click "Expandir Todos", **Then** the UI renders without freezing the window.
2. **Given** the new schema separates messages from conversations, **When** I view the library, **Then** message counts and resources (images/files) still display correctly.

---

### Edge Cases

- What happens when the user tries to start another import while one is already running?
- How does system handle an import file that is corrupted halfway through the chunking process?
- What happens if the user navigates away from the app or closes the window during a background import?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST process file parsing and normalizations asynchronously (e.g., chunking, yielding to the event loop, or using Web Workers) so the main UI thread is not blocked.
- **FR-002**: System MUST write to the database (IndexedDB) in smaller transactional chunks rather than one massive array insertion to prevent memory spikes and blocking.
- **FR-003**: System MUST provide visual feedback (progress bar, spinner, or percentage) while an import is running.
- **FR-004**: System MUST render long message lists using a technique that prevents DOM bloat (e.g., virtualization, pagination, or lazy-rendering hidden nodes).

### Key Entities 

- **Import Job**: Represents the progress and state of an ongoing file ingestion.
- **Virtualized Message List**: The UI representation of the chat that only renders what is currently visible on screen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Importing a file with 10,000+ conversations does not freeze the UI for more than 100ms at any given time.
- **SC-002**: Opening a conversation containing 2,000+ messages renders the first visible portion in under 300ms.
- **SC-003**: Scrolling through a massively long conversation maintains a consistent 60 FPS (Frames Per Second).
- **SC-004**: Memory usage remains stable (does not balloon out of control leading to a browser crash) during the import of a 100MB+ archive.

## Assumptions

- We assume modern browser capabilities (IndexedDB, Promises, `requestIdleCallback`/`setTimeout` or Web Workers) are fully available in the Electron environment.
- We assume that the user's primary goal during import is to see progress and know the app hasn't died; they do not strictly need the data instantly.
- The existing UI structure allows for a loading state overlay or notification toaster.
