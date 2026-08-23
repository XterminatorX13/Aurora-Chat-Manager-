# Phase 1: Data Model

## IndexedDB Schema (Dexie)

```javascript
// db.js schema expectations
const db = new Dexie("umbra_db");
db.version(1).stores({
  conversations: "++id, source, date, title",
  messages: "++id, conversationId, role, date"
});
```

## Entities

### `Conversation`
- `id`: string (UUID)
- `title`: string
- `source`: string (e.g., "chatgpt", "claude")
- `date`: number (timestamp)
- `metadata`: object (extra provider-specific data)

### `Message`
- `id`: string (UUID)
- `conversationId`: string (Indexed for fast lookups: `db.messages.where({ conversationId: id })`)
- `role`: string ("user", "assistant", "system")
- `content`: string (Markdown body)
- `date`: number (timestamp)

## Validation Rules
- `conversationId` must be correctly mapped to the parent before bulk insertion.
- `content` must always be a string; if the provider has structured blocks (e.g., Claude), the parser must flatten it to Markdown in the Web Worker before sending it to the main thread.
