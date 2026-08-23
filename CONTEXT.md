# Umbra Domain Context

This file serves as the definitive domain glossary for the Umbra project. 
It defines the exact vocabulary that should be used across the codebase and in architectural discussions.

## Core Concepts

- **Conversation**: A single chat entity parsed from an AI provider (ChatGPT, Gemini, etc). Contains metadata and a list of messages.
- **ConversationQuery**: A custom Svelte store that manages the state of the user's active filters, search terms, and active folders. It exposes reactive state to the UI and delegates heavy lifting to pure domain functions.
- **ConversationFilters**: A pure JS/TS module responsible for the actual algorithm of filtering, searching (Fuse.js), and structuring the Conversation objects. Highly testable and entirely decoupled from Svelte or the DOM.
