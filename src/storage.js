import { createDefaultState, normalizeState, parseBackup } from "./model.js";

export const STORAGE_KEY = "campusos:workspace:v1";

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage = globalThis.localStorage) {
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function serializeBackup(state) {
  return JSON.stringify(normalizeState(state), null, 2);
}

export function deserializeBackup(text) {
  return parseBackup(text);
}
