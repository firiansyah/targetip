/**
 * script.js – Task List App
 * ─────────────────────────────────────────────────────────
 * Features:
 *  • CRUD  : Create, Read, Update, Delete tasks
 *  • Toggle: Mark tasks as Active / Completed
 *  • Filter: All | Active | Completed (no page reload)
 *  • Persist: localStorage so tasks survive page refresh
 * ─────────────────────────────────────────────────────────
 */

"use strict";

/* ══════════════════════════════════════════════════════════
   1.  STATE
   ══════════════════════════════════════════════════════════ */

/** @type {{ id: string, text: string, completed: boolean }[]} */
let tasks = [];

/** Currently active filter: 'all' | 'active' | 'completed' */
let currentFilter = "all";

/** ID of the task being edited (null when modal is closed) */
let editingId = null;

/* ══════════════════════════════════════════════════════════
   2.  DOM REFERENCES
   ══════════════════════════════════════════════════════════ */
const taskForm          = document.getElementById("task-form");
const taskInput         = document.getElementById("task-input");
const formError         = document.getElementById("form-error");
const taskList          = document.getElementById("task-list");
const emptyState        = document.getElementById("empty-state");
const emptyMessage      = document.getElementById("empty-message");
const taskCounter       = document.getElementById("task-counter");
const clearCompletedBtn = document.getElementById("clear-completed-btn");
const filterBtns        = document.querySelectorAll(".filter-btn");

// Modal
const modalOverlay  = document.getElementById("modal-overlay");
const modalInput    = document.getElementById("modal-input");
const modalCancel   = document.getElementById("modal-cancel");
const modalSave     = document.getElementById("modal-save");

/* ══════════════════════════════════════════════════════════
   3.  PERSISTENCE HELPERS
   ══════════════════════════════════════════════════════════ */

const STORAGE_KEY = "tasklist_tasks";

/** Load tasks from localStorage. */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}

/** Persist current tasks array to localStorage. */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* ══════════════════════════════════════════════════════════
   4.  UTILITY HELPERS
   ══════════════════════════════════════════════════════════ */

/** Generate a lightweight unique ID. */
function generateId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Sanitise raw string: trim + collapse inner whitespace. */
function sanitise(str) {
  return str.trim().replace(/\s+/g, " ");
}

/** Return tasks visible under the active filter. */
function getFilteredTasks() {
  switch (currentFilter) {
    case "active":    return tasks.filter((t) => !t.completed);
    case "completed": return tasks.filter((t) =>  t.completed);
    default:          return tasks;
  }
}

/* ══════════════════════════════════════════════════════════
   5.  RENDER
   ══════════════════════════════════════════════════════════ */

/** Re-render the entire list based on state + current filter. */
function render() {
  const filtered = getFilteredTasks();

  // Toggle empty state visibility
  const isEmpty = filtered.length === 0;
  emptyState.classList.toggle("hidden",   !isEmpty);
  emptyState.classList.toggle("flex",      isEmpty);

  // Update empty-state message to match current filter
  const emptyMessages = {
    all:       "No tasks yet. Add one above!",
    active:    "No active tasks. Great work! 🎉",
    completed: "No completed tasks yet.",
  };
  emptyMessage.textContent = emptyMessages[currentFilter];

  // Render task items
  taskList.innerHTML = "";
  filtered.forEach((task) => {
    const li = buildTaskItem(task);
    taskList.appendChild(li);
  });

  updateFooter();
}

/**
 * Build a single <li> task item element.
 * @param {{ id: string, text: string, completed: boolean }} task
 * @returns {HTMLLIElement}
 */
function buildTaskItem(task) {
  const li = document.createElement("li");
  li.className = "task-item task-enter";
  li.dataset.id = task.id;

  // ── Checkbox ──
  const checkbox = document.createElement("input");
  checkbox.type      = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked   = task.completed;
  checkbox.setAttribute("aria-label", `Mark "${task.text}" as ${task.completed ? "active" : "completed"}`);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  // ── Label ──
  const label = document.createElement("span");
  label.className = `task-label${task.completed ? " completed" : ""}`;
  label.textContent = task.text;
  // Double-click label to edit
  label.addEventListener("dblclick", () => openEditModal(task.id));

  // ── Action buttons ──
  const actions = document.createElement("div");
  actions.className = "task-actions";

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.className  = "btn-icon btn-edit";
  editBtn.setAttribute("aria-label", `Edit task: ${task.text}`);
  editBtn.innerHTML  = `
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z"/>
    </svg>`;
  editBtn.addEventListener("click", () => openEditModal(task.id));

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className  = "btn-icon btn-delete";
  deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
  deleteBtn.innerHTML  = `
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18"/>
    </svg>`;
  deleteBtn.addEventListener("click", () => deleteTask(task.id, li));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(label);
  li.appendChild(actions);

  return li;
}

/** Update footer counter, filter tab counts, and "Clear completed" button. */
function updateFooter() {
  const activeCount    = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) =>  t.completed).length;
  const totalCount     = tasks.length;

  taskCounter.textContent = `${activeCount} task${activeCount !== 1 ? "s" : ""} left`;

  // Update count badges inside each filter tab
  document.getElementById("count-all").textContent       = totalCount     > 0 ? `(${totalCount})`     : "";
  document.getElementById("count-active").textContent    = activeCount    > 0 ? `(${activeCount})`    : "";
  document.getElementById("count-completed").textContent = completedCount > 0 ? `(${completedCount})` : "";

  if (completedCount > 0) {
    clearCompletedBtn.classList.remove("hidden");
  } else {
    clearCompletedBtn.classList.add("hidden");
  }
}

/* ══════════════════════════════════════════════════════════
   6.  CRUD OPERATIONS
   ══════════════════════════════════════════════════════════ */

/** CREATE – add a new task from the form input. */
function addTask(text) {
  const newTask = {
    id:        generateId(),
    text:      text,
    completed: false,
  };
  tasks.unshift(newTask); // newest tasks appear at the top
  saveTasks();
  render();
}

/** UPDATE – change the text of an existing task. */
function updateTask(id, newText) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.text = newText;
  saveTasks();
  render();
}

/** DELETE – remove a task with an exit animation. */
function deleteTask(id, liElement) {
  // Play exit animation, then remove from state + DOM
  liElement.classList.add("task-exit");
  liElement.addEventListener(
    "animationend",
    () => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    },
    { once: true }
  );
}

/** TOGGLE – flip a task's completed status. */
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

/** Clear all completed tasks at once. */
function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

/* ══════════════════════════════════════════════════════════
   7.  FILTER
   ══════════════════════════════════════════════════════════ */

/** Switch the active filter and re-render. */
function setFilter(filter) {
  currentFilter = filter;

  // Update active-filter class on tab buttons
  filterBtns.forEach((btn) => {
    btn.classList.toggle("active-filter", btn.dataset.filter === filter);
  });

  render();
}

/* ══════════════════════════════════════════════════════════
   8.  EDIT MODAL
   ══════════════════════════════════════════════════════════ */

/** Open the edit modal pre-filled with the task's current text. */
function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingId          = id;
  modalInput.value   = task.text;
  modalOverlay.classList.remove("hidden");
  modalInput.focus();
  // Position cursor at end of text
  modalInput.setSelectionRange(task.text.length, task.text.length);
}

/** Close the edit modal without saving. */
function closeModal() {
  editingId = null;
  modalOverlay.classList.add("hidden");
  modalInput.value = "";
}

/** Save edits from the modal. */
function saveModal() {
  const newText = sanitise(modalInput.value);
  if (!newText) {
    modalInput.focus();
    return;
  }
  updateTask(editingId, newText);
  closeModal();
}

/* ══════════════════════════════════════════════════════════
   9.  FORM VALIDATION
   ══════════════════════════════════════════════════════════ */

/** Show an inline validation error under the form. */
function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
  taskInput.classList.add("border-red-300", "focus:border-red-400");
}

/** Clear any existing form validation error. */
function clearFormError() {
  formError.textContent = "";
  formError.classList.add("hidden");
  taskInput.classList.remove("border-red-300", "focus:border-red-400");
}

/* ══════════════════════════════════════════════════════════
   10. EVENT LISTENERS
   ══════════════════════════════════════════════════════════ */

// Add task on form submit
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = sanitise(taskInput.value);

  if (!text) {
    showFormError("Task cannot be empty.");
    taskInput.focus();
    return;
  }
  if (text.length > 120) {
    showFormError("Task must be 120 characters or fewer.");
    return;
  }

  clearFormError();
  addTask(text);
  taskInput.value = "";
  taskInput.focus();
});

// Clear validation error as user types
taskInput.addEventListener("input", clearFormError);

// Filter buttons
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

// Clear completed button
clearCompletedBtn.addEventListener("click", clearCompleted);

// Modal – cancel
modalCancel.addEventListener("click", closeModal);

// Modal – save
modalSave.addEventListener("click", saveModal);

// Modal – save on Enter key
modalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveModal();
  if (e.key === "Escape") closeModal();
});

// Modal – close when clicking the overlay backdrop
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

/* ══════════════════════════════════════════════════════════
   11. INITIALISE
   ══════════════════════════════════════════════════════════ */

/** Bootstrap the application. */
function init() {
  loadTasks();
  render();
}

init();
