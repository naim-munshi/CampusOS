import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanText, cleanBody, isValidDate, localDateKey, createDefaultState, normalizeState,
  makeTask, makeNote, taskSummary, sortedTasks, upcomingTasks, parseBackup, MAX_TASKS
} from "../src/model.js";

test("default state is distinct on each call", () => {
  const a = createDefaultState();
  const b = createDefaultState();
  a.notes.push({ id: "test" });
  assert.equal(b.notes.length, 0);
  assert.equal(a.version, 1);
});
test("normalizes unknown fields, invalid dates and priorities", () => {
  const state = normalizeState({
    version: 1, permissions: "admin",
    tasks: [
      { id: "a", title: "  Assignment  ", dueDate: "2026-02-29", priority: "critical", completed: 1, secret: true },
      { id: "a", title: "duplicate" }, { id: "b", title: "  " }
    ],
    notes: [{ id: "n", title: "Note", content: "<script>alert(1)</script>" }],
    preferences: { theme: "dark", attacker: "x" }
  });
  assert.equal(state.tasks.length, 1);
  assert.deepEqual(state.tasks[0].title, "Assignment");
  assert.equal(state.tasks[0].dueDate, "");
  assert.equal(state.tasks[0].priority, "medium");
  assert.equal(state.tasks[0].completed, false);
  assert.equal(state.notes[0].content, "<script>alert(1)</script>");
  assert.equal(state.preferences.theme, "dark");
  assert.equal("secret" in state.tasks[0], false);
  assert.equal("permissions" in state, false);
});
test("validates calendar dates", () => {
  assert.equal(isValidDate("2024-02-29"), true);
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2026-13-01"), false);
  assert.equal(isValidDate("tomorrow"), false);
});
test("local date key does not convert through UTC", () => {
  assert.equal(localDateKey(new Date(2026, 9, 23, 11)), "2026-10-23");
});
test("trims and caps user text", () => {
  assert.equal(cleanText("  A\n B  ", 100), "A  B");
  assert.equal(cleanText("123456", 3), "123");
  assert.equal(cleanText(null, 12), "");\n  assert.equal(cleanBody("  Line 1\\nLine 2  ", 50), "Line 1\\nLine 2");
});
test("creates task and note with sensible defaults", () => {
  const task = makeTask("Read chapter 3", "2026-10-30");
  const note = makeNote("Idea", "Useful concept");
  assert.equal(task.completed, false);
  assert.equal(task.priority, "medium");
  assert.equal(note.title, "Idea");
  assert.notEqual(task.id, note.id);
  assert.throws(() => makeTask("  "), /required/);
  assert.throws(() => makeTask("X", "2026-99-99"), /date/);
});
test("counts and sorts tasks without mutating original", () => {
  const tasks = [
    { id: "c", title: "Completed", completed: true, dueDate: "2026-10-20", createdAt: "2026-10-01T00:00:00Z" },
    { id: "b", title: "Later", completed: false, dueDate: "2026-12-01", createdAt: "2026-10-01T00:00:00Z" },
    { id: "a", title: "Sooner", completed: false, dueDate: "2026-11-01", createdAt: "2026-10-01T00:00:00Z" }
  ];
  assert.deepEqual(taskSummary(tasks), { total: 3, active: 2, completed: 1 });
  assert.deepEqual(sortedTasks(tasks).map((item) => item.id), ["a", "b", "c"]);
  assert.deepEqual(upcomingTasks(tasks).map((item) => item.id), ["a", "b"]);
  assert.equal(tasks[0].id, "c");
});
test("backup rejects invalid, oversized, and incompatible data", () => {
  assert.throws(() => parseBackup("{oops"), /JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ version: 2, tasks: [], notes: [] })), /version/);
  assert.throws(() => parseBackup("x".repeat(4_000_001)), /4 MB/);
  assert.deepEqual(parseBackup(JSON.stringify(createDefaultState())), createDefaultState());
});
test("caps untrusted import arrays", () => {
  const tasks = Array.from({ length: MAX_TASKS + 10 }, (_, i) =>
    ({ id: "t" + i, title: "Task" + i }));
  assert.equal(normalizeState({ tasks }).tasks.length, MAX_TASKS);
});
