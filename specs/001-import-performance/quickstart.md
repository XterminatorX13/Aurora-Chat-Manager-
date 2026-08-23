# Phase 1: Quickstart & Validation

This guide outlines how to manually validate that the import performance feature works end-to-end.

## Prerequisites
- Generate a massive mock JSON file representing a ChatGPT export (at least 50MB, containing thousands of conversations).
- Ensure the app is running in dev mode (`bun run dev`).

## Scenario 1: Import Progress & UI Responsiveness
1. Open the **Import** modal in the application.
2. Select the massive JSON mock file.
3. **Expected Outcome**: The UI must immediately show a progress bar or spinner.
4. **Validation**: While it imports, click on other tabs in the sidebar. The hover states and clicks must respond instantly (<100ms lag). The app must not show the "Window is not responding" OS dialog.

## Scenario 2: Instant Chat Rendering
1. After import, select a conversation known to have 2000+ messages (verify in DevTools if necessary).
2. Click the conversation in the sidebar to load it.
3. **Expected Outcome**: The chat view populates the screen with messages almost instantly (<300ms).
4. **Validation**: Grab the scrollbar and aggressively drag it to the bottom of the chat. The scrolling must remain buttery smooth (~60 FPS), and new messages should render on the fly without locking the browser.
