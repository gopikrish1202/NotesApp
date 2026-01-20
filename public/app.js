console.log("app.js loaded");

// ── LOAD TODOS ─────────────────────────────────────────────
async function loadTodos() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.warn("No userId → redirecting to login");
    window.location.href = "/login.html";
    return;
  }

  try {
    const res = await fetch(`/todos/user/${userId}`);
    if (!res.ok) throw new Error(await res.text());

    const todos = await res.json();
    const list = document.getElementById("todoList");
    list.innerHTML = "";

    todos.forEach(todo => {
      const li = document.createElement("li");
      li.className = "todo-item";

      // Status icon
      const statusIcon = document.createElement("span");
      statusIcon.textContent = todo.status === "completed" ? "✅" : "○";
      statusIcon.className = todo.status === "completed" ? "status-completed" : "status-active";
      statusIcon.title = todo.status === "completed" ? "Completed" : "Mark as completed";
      statusIcon.addEventListener("click", () => {
        updateStatus(todo._id, todo.status === "completed" ? "active" : "completed");
      });

      // Todo text input
      const input = document.createElement("input");
      input.type = "text";
      input.value = todo.name;
      input.className = "todo-text";
      if (todo.status === "completed") input.classList.add("completed");
      input.addEventListener("change", () => updateTodo(todo._id, input.value));

      // Archive button
      const archiveBtn = document.createElement("img");
      archiveBtn.src = "https://cdn.prod.website-files.com/680a93d128c5b2a854b57c98/68ba0a0f910357491c07cf6e_644057e01cce5c85d15d1c80_archive_24px.svg";
      archiveBtn.width = 20;
      archiveBtn.className = "icon-btn";
      archiveBtn.title = "Archive";
      archiveBtn.addEventListener("click", () => updateStatus(todo._id, "archived"));

      // Delete button (soft delete)
      const deleteBtn = document.createElement("span");
      deleteBtn.textContent = "🗑️";
      deleteBtn.className = "icon-btn";
      deleteBtn.title = "Delete";
      deleteBtn.addEventListener("click", () => {
        if (confirm("Delete this todo?")) {
          updateStatus(todo._id, "deleted");
        }
      });

      li.append(statusIcon, input, archiveBtn, deleteBtn);
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Load todos failed:", err.message);
  }
}

// ── ADD TODO ───────────────────────────────────────────────
async function addTodo() {
  const input = document.getElementById("todoInput");
  const name = input.value.trim();
  const userId = localStorage.getItem("userId");

  if (!name || !userId) {
    alert("Please enter a todo and make sure you're logged in");
    return;
  }

  try {
    const res = await fetch("/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, userId, status: "active" })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Add todo failed:", errorText);
      alert("Could not add todo: " + errorText);
      return;
    }

    input.value = "";
    loadTodos();
  } catch (err) {
    console.error(err);
    alert("Network error while adding todo");
  }
}

// ── UPDATE NAME ────────────────────────────────────────────
async function updateTodo(id, newName) {
  if (!newName.trim()) return;
  try {
    const res = await fetch(`/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    });
    if (res.ok) loadTodos();
  } catch (err) {
    console.error("Update name failed", err);
  }
}

// ── UPDATE STATUS ──────────────────────────────────────────
async function updateStatus(id, status) {
  try {
    const res = await fetch(`/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) loadTodos();
  } catch (err) {
    console.error("Update status failed", err);
  }
}

// ── INIT ───────────────────────────────────────────────────
loadTodos();