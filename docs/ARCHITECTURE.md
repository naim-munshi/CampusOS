# Architecture and security notes

## Purpose

CampusOS is a standalone client-side productivity application. It is intentionally small and has no server-side identity, data processing or persistence. The browser executes all UI actions.

## Data flow

```text
User actions
    |
    v
index.html + src/app.js (DOM controller and renderer)
    |                       |
    v                       v
src/model.js           src/calculator.js
(validation and       (arithmetic-only parser)
 state operations)
    |
    v
src/storage.js
    |
    v
Browser localStorage
```

State schema (`version: 1`):

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "generated-id",
      "title": "Complete assignment",
      "dueDate": "2026-10-30",
      "priority": "high",
      "completed": false,
      "createdAt": "2026-10-23T01:00:00.000Z"
    }
  ],
  "notes": [
    {
      "id": "generated-id",
      "title": "Study notes",
      "content": "Summary",
      "updatedAt": "2026-10-23T01:00:00.000Z"
    }
  ],
  "preferences": { "theme": "light" }
}
```

Date-only deadlines are compared as `YYYY-MM-DD` local dates to avoid UTC off-by-one rendering. Schema version is checked during backup import. Older/newer backup formats may require explicit migration support.

## Defensive design

- UI inserts user-provided strings via `textContent` and never treats stored note content as HTML.
- JSON imports are bounded, shape-checked, normalized, and have unknown properties discarded.
- Each task/note has a bounded title and a vetted identifier; note content and collection sizes have limits.
- The calculator handles only numeric arithmetic and parentheses. It never uses `eval` or code compilation.
- A restrictive document Content Security Policy (CSP) permits only same-origin assets; no external scripts, fonts or fetch destinations.
- Storage exceptions are caught and disclosed in the UI. Sensitive content must not be stored here.
- The development server serves known extension types inside its project root and listens only on `127.0.0.1`.
- Browser storage updates from another tab are reloaded using the `storage` event.

## Limitations and future work

LocalStorage is not a security boundary. Anyone who can access the same unlocked browser profile may read stored content or unencrypted exported JSON. Data can disappear when storage is cleared and is not synchronized across devices. No access-control model or user accounts exist. Import replaces local data after confirmation, but there is no merge or recovery workflow beyond external backup copies.

This is not a production multi-tenant service. A future backend would require authentication, authorization at every resource boundary, secure transport, server-side validation, migrations, audit controls, privacy disclosures and abuse protections.

## Change safety

Keep model, storage and calculator logic browser-independent so Node unit tests can exercise it. Maintain the public JSON schema or document/migrate changes. Avoid `innerHTML` for untrusted input. Run `npm run check` and `npm test` on each PR.
