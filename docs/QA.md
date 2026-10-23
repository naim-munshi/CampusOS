# Manual browser acceptance checklist

Run `npm run dev` and open http://127.0.0.1:4173. Run `npm run check` and `npm test` before browser acceptance.

## Functional scenarios

- [ ] Overview loads with a live clock and accurate zero-state statistics.
- [ ] Create a task with due date and priority; it appears in Tasks and Overview.
- [ ] Mark a task completed; counters and Active/Completed filters update.
- [ ] Delete a task after confirmation; counters update and it stays deleted after refresh.
- [ ] Create, edit and delete a note; multiline content remains intact after refresh.
- [ ] Theme toggles and persists across reloads.
- [ ] Calculator evaluates `2+3*4` as `14`, `(2+3)*4` as `20`, and rejects `1/0`.
- [ ] Calculator works using its on-screen buttons and number/operator keyboard keys.
- [ ] Export a JSON backup; delete data; import the same file; data returns.
- [ ] Cancel an import; existing data stays untouched.
- [ ] Attempt import of malformed JSON or wrong version; the app rejects it.
- [ ] Clear all local data after confirmation; tasks, notes and theme reset.
- [ ] Open two tabs; edits in one are reflected in the other.

## Accessibility and layout

- [ ] Navigate the sidebar and forms by keyboard; focus is always visible.
- [ ] Skip link moves focus to the main content.
- [ ] Each form control has a label; task checkboxes have accessible names.
- [ ] Test on narrow mobile width (320px), tablet and desktop with no horizontal content clipping.
- [ ] Both themes retain readable contrast and layout.
- [ ] With reduced-motion enabled, interface remains fully usable.

## Security and resilience

- [ ] Add text resembling HTML (`<img src=x onerror=alert(1)>`) to a note; it displays as text and does not execute.
- [ ] Enter malformed arithmetic (`2**3`, `1/0`); no code execution or application crash.
- [ ] Disable/block localStorage in a test profile; user is warned when persistence is unavailable.
- [ ] Test malformed import and file above 4 MB; no existing content is overwritten.

These are **manual scenarios**, not a statement that browser end-to-end testing has been completed. Node unit tests and CI cover only model, calculator and storage logic plus syntax checking. Add automated browser acceptance tests before claiming production-ready accessibility or compatibility.
