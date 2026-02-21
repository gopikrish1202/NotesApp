console.log("app.js loaded");

let dragSrcIndex = null;

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
  rerenderList(todos, list); // ✅ use rerenderList instead of inline build
}

// ---------------- RERENDER LIST (no fetch) ----------------
function rerenderList(todos, list) {
  list.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.index = index; // ✅ needed for drag

    // ===== DRAG HANDLE =====
    const brailleScrollIcon = document.createElement("span");
    brailleScrollIcon.textContent = "⠿";
    brailleScrollIcon.className = "drag-handle";

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
    if (todo.status === "completed") nameInput.classList.add("completed");

    nameInput.addEventListener("change", () => {
      updateTodo(todo._id, nameInput.value);
    });

    // ===== STATUS TEXT =====
    const statusText = document.createElement("span");
    statusText.className = "status-text";
    statusText.textContent = todo.status.toUpperCase();
    statusText.dataset.status = todo.status;

    // ===== ARCHIVE BUTTON =====
    const archiveBtn = document.createElement("img");
    archiveBtn.src = "https://cdn.prod.website-files.com/680a93d128c5b2a854b57c98/68ba0a0f910357491c07cf6e_644057e01cce5c85d15d1c80_archive_24px.svg";
    archiveBtn.width = 16;
    archiveBtn.className = "icon-btn";
    archiveBtn.title = "Archive";
    archiveBtn.addEventListener("click", () => {
      const newStatus = todo.status === "archived" ? "active" : "archived";
      updateStatus(todo._id, newStatus);
    });

    // ===== DELETE BUTTON =====
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
    li.appendChild(brailleScrollIcon);
    li.appendChild(statusIcon);
    li.appendChild(nameInput);
    li.appendChild(statusText);
    li.appendChild(archiveBtn);
    li.appendChild(deleteBtn);

    attachDragEvents(li, index, list, todos);
    list.appendChild(li);
  });
}

// ---------------- DRAG EVENTS ----------------
function attachDragEvents(li, index, list, todos) {
  const handle = li.querySelector(".drag-handle");

  handle.addEventListener("mousedown", () => li.draggable = true);
  document.addEventListener("mouseup",  () => li.draggable = false);

  li.addEventListener("dragstart", () => {
    dragSrcIndex = index;
    setTimeout(() => li.classList.add("dragging"), 0);
  });

  li.addEventListener("dragend", () => {
    li.draggable = false;
    li.classList.remove("dragging");
    clearIndicators(list);
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    clearIndicators(list);
    const midY = li.getBoundingClientRect().top + li.offsetHeight / 2;
    li.classList.add(e.clientY < midY ? "drop-above" : "drop-below");
  });

  li.addEventListener("dragleave", () => clearIndicators(list));

  li.addEventListener("drop", (e) => {
    e.preventDefault();
    const targetIndex = parseInt(li.dataset.index);
    if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;

    const midY = li.getBoundingClientRect().top + li.offsetHeight / 2;
    let insertAt = e.clientY < midY ? targetIndex : targetIndex + 1;

    // ✅ Splice in the todos array
    const [moved] = todos.splice(dragSrcIndex, 1);
    if (insertAt > dragSrcIndex) insertAt--;
    todos.splice(insertAt, 0, moved);

    // ✅ Re-render locally — no loadTodos(), no fetch
    rerenderList(todos, list);

    // ✅ Flash the dropped item green
    setTimeout(() => {
      const items = list.querySelectorAll("li");
      items[insertAt]?.classList.add("dropped");
    }, 0);
  });
}

// ---------------- HELPERS ----------------
function clearIndicators(list) {
  list.querySelectorAll("li").forEach(item => {
    item.classList.remove("drop-above", "drop-below");
  });
}

// ---------------- ADD TODO ----------------
async function addTodo() {
  const input = document.getElementById("todoInput");
  const userId = localStorage.getItem("userId");

  if (!input.value.trim() || !userId) return;

  if (userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)) {
    alert("Invalid or missing user ID. Please log in again.");
    return;
  }

  const res = await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: input.value.trim(), userId })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to add todo:", text);
    alert("Error adding todo");
    return;
  }

  input.value = "";
  loadTodos(); // ✅ fetch fresh list after adding
}

// ---------------- UPDATE TODO NAME ----------------
async function updateTodo(id, newName) {
  const res = await fetch(`/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName.trim() })
  });

  if (!res.ok) { console.error("Failed to update name"); return; }
  loadTodos(); // ✅ fetch fresh list after rename
}

// ---------------- UPDATE STATUS ----------------
async function updateStatus(id, status) {
  if (status !== "deleted") {
    const res = await fetch(`/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) { console.error("Failed to update status"); return; }
  } else {
    const res = await fetch(`/todos/${id}`, { method: "DELETE" });
    if (!res.ok) { console.error("Failed to delete todo"); return; }
  }
  loadTodos(); // ✅ fetch fresh list after status change
}

// ---------------- INITIAL LOAD ----------------
loadTodos();
