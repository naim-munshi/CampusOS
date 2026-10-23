import {
  MAX_TASKS, MAX_NOTES, createDefaultState, cleanText, localDateKey,
  makeTask, makeNote, taskSummary, sortedTasks, upcomingTasks, normalizeState
} from "./model.js";
import { evaluateExpression } from "./calculator.js";
import { STORAGE_KEY, loadState, saveState, clearState, serializeBackup, deserializeBackup } from "./storage.js";

const $ = (id) => document.getElementById(id);
const VIEWS = ["overview", "tasks", "notes", "calculator", "settings"];
let state = loadState();
let currentView = "overview";
let taskFilter = "all";
let calcInput = "";
let justCalculated = false;
let toastTimer;

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function announce(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

function store(next) {
  state = normalizeState(next);
  if (!saveState(state)) announce("Changes are temporary: this browser is blocking local storage.");
  render();
}

function friendlyDate(value) {
  if (!value) return "No due date";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day, 12));
}

function dueLabel(task) {
  if (!task.dueDate) return "No due date";
  const today = localDateKey();
  const prefix = !task.completed && task.dueDate < today ? "Overdue · " : "";
  return prefix + friendlyDate(task.dueDate);
}

function renderCompact(containerId, tasks, emptyText) {
  const container = $(containerId);
  if (!tasks.length) {
    container.replaceChildren(element("div", "empty-state", emptyText));
    return;
  }
  const nodes = tasks.map((task) => {
    const item = element("div", "compact-item");
    const icon = element("span", "compact-icon", task.completed ? "✓" : "↗");
    icon.setAttribute("aria-hidden", "true");
    const details = element("div", "compact-details");
    details.append(element("strong", "", task.title), element("small", "", dueLabel(task)));
    item.append(icon, details);
    return item;
  });
  container.replaceChildren(...nodes);
}

function renderOverview() {
  const summary = taskSummary(state.tasks);
  $("stat-total").textContent = String(summary.total);
  $("stat-open").textContent = String(summary.active);
  $("stat-done").textContent = String(summary.completed);
  $("stat-notes").textContent = String(state.notes.length);
  renderCompact("upcoming-list", upcomingTasks(state.tasks).slice(0, 4), "No upcoming deadlines. You're all caught up.");
  renderCompact("overview-task-list", sortedTasks(state.tasks).filter((task) => !task.completed).slice(0, 4), "Nothing in progress. Add your first task.");
}

function renderTasks() {
  const active = taskFilter === "active";
  const completed = taskFilter === "completed";
  const tasks = sortedTasks(state.tasks).filter((task) =>
    active ? !task.completed : completed ? task.completed : true);
  $("task-count").textContent = `${tasks.length} shown · ${state.tasks.length} total`;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === taskFilter;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (!tasks.length) {
    $("task-list").replaceChildren(element("div", "empty-state", "No tasks in this view yet."));
    return;
  }
  const nodes = tasks.map((task) => {
    const row = element("article", "task-row" + (task.completed ? " completed" : ""));
    const checkbox = element("input", "task-checkbox");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.toggleTask = task.id;
    checkbox.setAttribute("aria-label", `${task.completed ? "Mark incomplete" : "Complete"}: ${task.title}`);
    const info = element("div", "task-info");
    info.append(element("strong", "", task.title), element("small", "", dueLabel(task)));
    const priority = element("span", "priority " + task.priority, task.priority);
    const remove = element("button", "delete-button", "Delete");
    remove.type = "button";
    remove.dataset.deleteTask = task.id;
    remove.setAttribute("aria-label", "Delete task: " + task.title);
    row.append(checkbox, info, priority, remove);
    return row;
  });
  $("task-list").replaceChildren(...nodes);
}

function renderNotes() {
  $("notes-count").textContent = `${state.notes.length} note${state.notes.length === 1 ? "" : "s"}`;
  if (!state.notes.length) {
    $("notes-list").replaceChildren(element("div", "empty-state", "Your notes will appear here. Write your first one."));
    return;
  }
  const nodes = [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((note) => {
    const card = element("article", "note-item");
    const heading = element("h3", "", note.title);
    const preview = element("p", "", note.content.length > 190 ? note.content.slice(0, 190) + "…" : note.content || "Empty note");
    const meta = element("div", "note-meta");
    const date = element("small", "", new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(note.updatedAt)));
    const actions = element("div", "note-actions");
    const edit = element("button", "", "Edit");
    edit.type = "button";
    edit.dataset.editNote = note.id;
    edit.setAttribute("aria-label", "Edit note: " + note.title);
    const remove = element("button", "", "Delete");
    remove.type = "button";
    remove.dataset.deleteNote = note.id;
    remove.setAttribute("aria-label", "Delete note: " + note.title);
    actions.append(edit, remove);
    meta.append(date, actions);
    card.append(heading, preview, meta);
    return card;
  });
  $("notes-list").replaceChildren(...nodes);
}

function render() {
  renderOverview();
  renderTasks();
  renderNotes();
  applyTheme();
}

function applyTheme() {
  const dark = state.preferences.theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("theme-toggle").textContent = dark ? "☀" : "◐";
  $("theme-toggle").setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]').content = dark ? "#101323" : "#f6f8fc";
}

function showView(name) {
  if (!VIEWS.includes(name)) return;
  currentView = name;
  document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const label = name[0].toUpperCase() + name.slice(1);
  $("page-label").textContent = label;
  document.title = `CampusOS | ${label}`;
  $("main-content").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function updateClock() {
  const now = new Date();
  $("clock").textContent = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(now);
  $("clock-date").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);
  $("header-date").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(now);
}

function addTask(form) {
  if (state.tasks.length >= MAX_TASKS) { announce("Task limit reached. Delete an old task first."); return; }
  const data = new FormData(form);
  try {
    const task = makeTask(data.get("title"), data.get("due") || "", data.get("priority") || "medium");
    store({ ...state, tasks: [task, ...state.tasks] });
    form.reset();
    announce("Task added.");
  } catch (error) { announce(error.message); }
}

function clearNoteEditor() {
  $("note-form").reset();
  $("note-id").value = "";
  $("note-editor-heading").textContent = "New note";
  $("save-note").textContent = "Save note";
  $("cancel-note").hidden = true;
}

function saveNote(form) {
  const id = cleanText($("note-id").value, 100);
  const existing = id ? state.notes.find((note) => note.id === id) : null;
  if (id && !existing) { announce("This note no longer exists."); clearNoteEditor(); return; }
  if (!existing && state.notes.length >= MAX_NOTES) { announce("Note limit reached."); return; }
  try {
    const note = makeNote($("note-title").value, $("note-content").value, existing?.id);
    store({ ...state, notes: existing
      ? state.notes.map((item) => item.id === id ? note : item)
      : [note, ...state.notes] });
    clearNoteEditor();
    announce(existing ? "Note updated." : "Note saved.");
  } catch (error) { announce(error.message); }
}

function handleCalculator(action) {
  if (action === "clear") { calcInput = ""; justCalculated = false; $("calc-result").textContent = "0"; }
  else if (action === "backspace") { calcInput = calcInput.slice(0, -1); justCalculated = false; $("calc-result").textContent = "0"; }
  else if (action === "=") {
    try {
      const result = evaluateExpression(calcInput);
      calcInput = String(result);
      $("calc-result").textContent = calcInput;
      justCalculated = true;
    } catch (error) { $("calc-result").textContent = error.message; justCalculated = false; }
  } else if (/^[0-9.+*/()-]$/.test(action) && calcInput.length < 120) {
    if (justCalculated && /[0-9.(]/.test(action)) calcInput = "";
    justCalculated = false;
    calcInput += action;
    $("calc-result").textContent = "0";
  }
  $("calc-expression").textContent = calcInput || "0";
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view], [data-go]");
  if (viewButton) showView(viewButton.dataset.view || viewButton.dataset.go);
  const filter = event.target.closest("[data-filter]");
  if (filter) { taskFilter = filter.dataset.filter; renderTasks(); }
  const calc = event.target.closest("[data-calc]");
  if (calc) handleCalculator(calc.dataset.calc);
});

$("quick-task-form").addEventListener("submit", (event) => { event.preventDefault(); addTask(event.currentTarget); });
$("task-form").addEventListener("submit", (event) => { event.preventDefault(); addTask(event.currentTarget); });
$("task-list").addEventListener("change", (event) => {
  const id = event.target.dataset.toggleTask;
  if (!id) return;
  store({ ...state, tasks: state.tasks.map((task) => task.id === id ? { ...task, completed: event.target.checked } : task) });
});
$("task-list").addEventListener("click", (event) => {
  const id = event.target.closest("[data-delete-task]")?.dataset.deleteTask;
  if (!id || !window.confirm("Delete this task?")) return;
  store({ ...state, tasks: state.tasks.filter((task) => task.id !== id) });
  announce("Task deleted.");
});
$("note-form").addEventListener("submit", (event) => { event.preventDefault(); saveNote(event.currentTarget); });
$("cancel-note").addEventListener("click", clearNoteEditor);
$("notes-list").addEventListener("click", (event) => {
  const editId = event.target.closest("[data-edit-note]")?.dataset.editNote;
  if (editId) {
    const note = state.notes.find((item) => item.id === editId);
    if (!note) return;
    $("note-id").value = note.id;
    $("note-title").value = note.title;
    $("note-content").value = note.content;
    $("note-editor-heading").textContent = "Edit note";
    $("save-note").textContent = "Update note";
    $("cancel-note").hidden = false;
    $("note-title").focus();
    return;
  }
  const deleteId = event.target.closest("[data-delete-note]")?.dataset.deleteNote;
  if (!deleteId || !window.confirm("Delete this note?")) return;
  store({ ...state, notes: state.notes.filter((note) => note.id !== deleteId) });
  if ($("note-id").value === deleteId) clearNoteEditor();
  announce("Note deleted.");
});
$("theme-toggle").addEventListener("click", () => {
  store({ ...state, preferences: { theme: state.preferences.theme === "dark" ? "light" : "dark" } });
});
$("export-data").addEventListener("click", () => {
  const blob = new Blob([serializeBackup(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = element("a");
  link.href = url;
  link.download = `campusos-backup-${localDateKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce("Backup exported. Store the file securely.");
});
$("import-data").addEventListener("change", async (event) => {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 4_000_000) throw new Error("Backup exceeds the 4 MB limit.");
    const imported = deserializeBackup(await file.text());
    if (!window.confirm("Import this backup? It will replace all current tasks and notes.")) return;
    store(imported);
    clearNoteEditor();
    announce("Backup imported.");
  } catch (error) { announce(error.message); }
  finally { input.value = ""; }
});
$("reset-data").addEventListener("click", () => {
  if (!window.confirm("Clear ALL CampusOS data in this browser? This cannot be undone.")) return;
  if (!clearState()) { announce("Browser storage could not be cleared."); return; }
  state = createDefaultState();
  clearNoteEditor();
  render();
  announce("Local workspace cleared.");
});

document.addEventListener("keydown", (event) => {
  if (currentView !== "calculator" || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target.closest("input, textarea, select")) return;
  if (event.target.closest("button") && event.key === "Enter") return;
  const key = event.key === "Enter" ? "=" : event.key === "Escape" ? "clear"
    : event.key === "Backspace" ? "backspace" : event.key;
  if (key === "=" || key === "clear" || key === "backspace" || /^[0-9.+*/()-]$/.test(key)) {
    event.preventDefault();
    handleCalculator(key);
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    state = loadState();
    clearNoteEditor();
    render();
    announce("Workspace refreshed from another tab.");
  }
});

render();
updateClock();
setInterval(updateClock, 30_000);
