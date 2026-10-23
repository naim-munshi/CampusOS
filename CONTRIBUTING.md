# Contributing

CampusOS is a small dependency-free client-side application. Keep contributions focused, accessible and backward-compatible.

1. Create a topic branch from `main`.
2. Run `npm run dev` and validate the user workflow locally.
3. Keep domain logic in `src/model.js`, persistence in `src/storage.js` and UI wiring in `src/app.js`.
4. Extend unit tests when changing schema validation, calculator behavior or persistence.
5. Run `npm run check` and `npm test` and follow `docs/QA.md`.
6. Open a PR with a concise summary, test evidence and screenshots if the layout changed.

Avoid dependency additions unless clearly justified. Never commit API keys or personal notes. Treat all imported and stored data as untrusted. Do not use `innerHTML` to render it.

A new persisted data shape must include a versioning and migration strategy. Do not silently break existing local backups.
