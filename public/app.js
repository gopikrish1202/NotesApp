console.log("app.js loaded");

// ---------------- LOAD TODOS ----------------
async function loadTodos() {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    console.warn("No userId found. Redirecting to login.");
    window.location.href = "/login.html";
    return;
  }

  const res = await fetch(`/todos/user/${userId}`);

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to load todos:", text);
    return;
  }

  const todos = await res.json();
  console.log("Todos from backend:", todos);

  const list = document.getElementById("todoList");
  list.innerHTML = "";

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item";

    // ===== STATUS ICON =====
    let statusIcon;

    if (todo.status === "completed") {
      statusIcon = document.createElement("span");
      statusIcon.textContent = "✅";
      statusIcon.className = "status-completed";
    } else {
      statusIcon = document.createElement("span");
      statusIcon.className = "status-icon status-active";
      statusIcon.title = "Mark completed";
    }

    statusIcon.addEventListener("click", () => {
      const newStatus = todo.status === "completed" ? "active" : "completed";
      updateStatus(todo._id, newStatus);
    });

    // ===== TODO TEXT =====
    const nameInput = document.createElement("input");
    nameInput.value = todo.name;
    nameInput.className = "todo-text";
    if (todo.status === "completed") {
      nameInput.classList.add("completed");
    }

    nameInput.addEventListener("change", () => {
      updateTodo(todo._id, nameInput.value);
    });

    // ===== ARCHIVE BUTTON =====
    const archiveBtn = document.createElement("img");
    archiveBtn.src =
      "https://cdn.prod.website-files.com/680a93d128c5b2a854b57c98/68ba0a0f910357491c07cf6e_644057e01cce5c85d15d1c80_archive_24px.svg";
    archiveBtn.width = 16;
    archiveBtn.className = "icon-btn";
    archiveBtn.title = "Archive";

    archiveBtn.addEventListener("click", () => {
      updateStatus(todo._id, "archived");
    });

    // ===== DELETE BUTTON (now soft delete) =====
    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = "🗑️";
    deleteBtn.className = "icon-btn";
    deleteBtn.title = "Delete";

    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this todo?")) {
        updateStatus(todo._id, "deleted");
      }
    });

    // ===== APPEND =====
    li.appendChild(statusIcon);
    li.appendChild(nameInput);
    li.appendChild(archiveBtn);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

// ---------------- ADD TODO ----------------
async function addTodo() {
  const input = document.getElementById("todoInput");
  const userId = localStorage.getItem("userId");

  if (!input.value.trim() || !userId) return;

  const res = await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.value.trim(),
      userId: userId,
      status: "active"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to add todo:", text);
    alert("Error adding todo", userId);
    return;
  }

  input.value = "";
  loadTodos();
}

// ---------------- UPDATE TODO NAME ----------------
async function updateTodo(id, newName) {
  const res = await fetch(`/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName.trim() })
  });

  if (!res.ok) {
    console.error("Failed to update name");
    return;
  }
  loadTodos();
}

// ---------------- UPDATE STATUS (completed, archived, deleted) ----------------
async function updateStatus(id, status) {
  const res = await fetch(`/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to update status:", text);
    return;
  }
  loadTodos();
}

// ---------------- INITIAL LOAD ----------------
loadTodos();