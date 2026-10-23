import test from "node:test";
import assert from "node:assert/strict";
import { loadState, saveState, clearState, serializeBackup, deserializeBackup, STORAGE_KEY } from "../src/storage.js";
import { createDefaultState } from "../src/model.js";

function mockStorage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key)
  };
}

test("saves, restores and clears state", () => {
  const storage = mockStorage();
  const state = createDefaultState();
  state.preferences.theme = "dark";
  assert.equal(saveState(state, storage), true);
  assert.ok(storage.getItem(STORAGE_KEY));
  assert.equal(loadState(storage).preferences.theme, "dark");
  assert.equal(clearState(storage), true);
  assert.deepEqual(loadState(storage), createDefaultState());
});
test("bad JSON and disabled storage fail safely", () => {
  const storage = mockStorage();
  storage.setItem(STORAGE_KEY, "{");
  assert.deepEqual(loadState(storage), createDefaultState());
  const blocked = { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); }, removeItem: () => { throw Error("blocked"); } };
  assert.deepEqual(loadState(blocked), createDefaultState());
  assert.equal(saveState(createDefaultState(), blocked), false);
  assert.equal(clearState(blocked), false);
});
test("export and import round-trip normalized data", () => {
  const state = createDefaultState();
  state.notes.push({ id: "n1", title: "Study", content: "Read chapter", updatedAt: "2026-10-23T01:00:00Z" });
  const restored = deserializeBackup(serializeBackup(state));
  assert.deepEqual(restored, state);
});
