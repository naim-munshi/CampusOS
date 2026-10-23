export const SCHEMA_VERSION = 1;
export const MAX_TASKS = 500;
export const MAX_NOTES = 100;

export function cleanText(value, maxLength) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength)
    : "";
}

export function cleanBody(value, maxLength) {
  return typeof value === "string"
    ? value.replace(/[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]/g, "").trim().slice(0, maxLength)
    : "";
}

export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function localDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDefaultState() {
  return { version: SCHEMA_VERSION, tasks: [], notes: [], preferences: { theme: "light" } };
}

function validId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
}

function validTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : new Date(0).toISOString();
}

export function normalizeState(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return createDefaultState();
  const seenTasks = new Set();
  const seenNotes = new Set();
  const tasks = (Array.isArray(input.tasks) ? input.tasks : []).slice(0, MAX_TASKS)
    .filter((item) => item && typeof item === "object" && validId(item.id))
    .map((item) => ({
      id: item.id,
      title: cleanText(item.title, 160),
      dueDate: isValidDate(item.dueDate) ? item.dueDate : "",
      priority: ["low", "medium", "high"].includes(item.priority) ? item.priority : "medium",
      completed: item.completed === true,
      createdAt: validTimestamp(item.createdAt)
    }))
    .filter((item) => {
      if (!item.title || seenTasks.has(item.id)) return false;
      seenTasks.add(item.id);
      return true;
    });
  const notes = (Array.isArray(input.notes) ? input.notes : []).slice(0, MAX_NOTES)
    .filter((item) => item && typeof item === "object" && validId(item.id))
    .map((item) => ({
      id: item.id,
      title: cleanText(item.title, 160),
      content: cleanBody(item.content, 5000),
      updatedAt: validTimestamp(item.updatedAt)
    }))
    .filter((item) => {
      if (!item.title || seenNotes.has(item.id)) return false;
      seenNotes.add(item.id);
      return true;
    });
  const theme = input.preferences?.theme === "dark" ? "dark" : "light";
  return { version: SCHEMA_VERSION, tasks, notes, preferences: { theme } };
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function makeTask(title, dueDate = "", priority = "medium") {
  const safeTitle = cleanText(title, 160);
  if (!safeTitle) throw new Error("Task name is required.");
  if (dueDate && !isValidDate(dueDate)) throw new Error("Invalid due date.");
  return {
    id: newId(), title: safeTitle, dueDate,
    priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
    completed: false, createdAt: new Date().toISOString()
  };
}

export function makeNote(title, content = "", id = newId()) {
  const safeTitle = cleanText(title, 160);
  if (!safeTitle) throw new Error("Note title is required.");
  return { id, title: safeTitle, content: cleanBody(content, 5000), updatedAt: new Date().toISOString() };
}

export function taskSummary(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  return { total: tasks.length, active: tasks.length - completed, completed };
}

export function sortedTasks(tasks) {
  return [...tasks].sort((a, b) =>
    Number(a.completed) - Number(b.completed)
    || (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")
    || b.createdAt.localeCompare(a.createdAt));
}

export function upcomingTasks(tasks) {
  return sortedTasks(tasks).filter((task) => !task.completed && task.dueDate);
}

export function parseBackup(text) {
  if (typeof text !== "string" || text.length > 4_000_000) throw new Error("Backup must be a JSON file under 4 MB.");
  let input;
  try { input = JSON.parse(text); } catch { throw new Error("Invalid JSON backup."); }
  if (!input || input.version !== SCHEMA_VERSION || !Array.isArray(input.tasks) || !Array.isArray(input.notes)) {
    throw new Error("Unsupported backup format or version.");
  }
  return normalizeState(input);
}
