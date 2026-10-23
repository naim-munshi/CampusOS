# CampusOS

A local-first student workspace for managing assignments, notes, deadlines and quick calculations.

CampusOS uses a desktop-inspired layout, but it is a **web application, not an operating system**. It works without a backend, user account or external service. Task and note content is kept in the current browser's localStorage.

## Highlights

- Responsive dashboard with live local time, task statistics and upcoming deadlines
- Task creation with due dates, priorities, completion status and filters
- Notes editor with create, edit and delete workflows
- Arithmetic calculator with operator precedence, parentheses and safe parsing (no `eval`)
- Light/dark theme with persisted preference
- JSON export/import, schema validation and explicit import/reset confirmation
- Keyboard accessibility, visible focus states, reduced-motion support and skip navigation
- Automated unit tests and a GitHub Actions quality workflow
- No runtime dependencies, trackers, analytics or external network requests

## Run locally

Requires Node.js 20 or newer.

```bash
git clone https://github.com/naim-munshi/CampusOS.git
cd CampusOS
npm run dev
```

Open **http://127.0.0.1:4173** in a browser.

No `npm install`, API key, database or environment file is required. The development server is intentionally bound to localhost. For static hosting, upload the repository's `index.html`, `styles.css`, `src/` and `assets/` files together, preserving their relative paths.

## Quality checks

```bash
npm run check
npm test
```

JavaScript syntax is checked using Node.js and pure logic is tested using the built-in test runner. See [manual acceptance checklist](docs/QA.md) for browser-level verification.

## Data and privacy

CampusOS persists a versioned object under `campusos:workspace:v1` in localStorage. The browser stores up to 500 tasks and 100 notes; each note holds up to 5,000 characters. Data is **not encrypted or synced**. Clearing browser storage or using a different browser/device will not restore data automatically.

Use **Settings → Export JSON backup** to save a portable copy. **Import JSON backup** validates the format and asks before replacing local data. Exported JSON is unencrypted; do not upload or share it with people who should not see its contents.

LocalStorage can be disabled or full. The UI warns when saving fails, but temporary changes are not durable in that case. Do not use CampusOS to store credentials, confidential records or other sensitive information.

## Project layout

```text
CampusOS/
├── index.html                 # Semantic UI and views
├── styles.css                 # Responsive themes and components
├── assets/favicon.svg
├── src/
│   ├── app.js                 # DOM interactions and workflows
│   ├── model.js               # Validation, limits and domain logic
│   ├── storage.js             # Local persistence and backups
│   └── calculator.js          # Safe arithmetic parser
├── scripts/dev-server.js      # Localhost static development server
├── tests/                     # Node.js unit tests
├── docs/                      # Architecture and QA notes
├── .github/workflows/ci.yml   # Automated syntax checks and unit tests
└── package.json
```

## Architecture

The UI calls functions in the domain model and updates a single normalized workspace state. Storage is isolated from UI logic; the calculator accepts arithmetic only and does not execute JavaScript. User-generated text is rendered through `textContent`, not through HTML interpretation. See [architecture and threat model](docs/ARCHITECTURE.md).

## Current scope and roadmap

This release is a browser-local MVP. It does **not** include authentication, multi-device sync, a database, background reminders, calendar integration or AI assistants. Potential next steps: automated browser tests, an optional offline service worker, class timetable integration, accessible drag-and-drop task ordering and an opt-in authenticated sync service with proper authorization.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Report security weaknesses privately rather than publishing sensitive exploitation details. Changes should be proposed through pull requests with tests.

**License:** No open-source license has been selected yet. All rights remain with the copyright holder unless a license is added.
