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

    const isCompleted = todo.status === "completed";


    // --- Name input ---
    const nameInput = document.createElement("input");
    nameInput.value = todo.name;
    nameInput.addEventListener("change", () => {
      updateTodo(todo._id, nameInput.value);
    });

    // --- Checkbox ---
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isCompleted;
    checkbox.addEventListener("change", () => {
  const newStatus = checkbox.checked ? "completed" : "active";
  updateStatus(todo._id, newStatus);
});

// --- Delete icon ---
const deleteBtn = document.createElement("span");
deleteBtn.textContent = "🗑️";
deleteBtn.style.cursor = "pointer";
deleteBtn.style.marginLeft = "10px";

deleteBtn.addEventListener("click", () => {
  deleteTodo(todo._id);
});

const archiveBtn = document.createElement("span");
archiveBtn.innerHTML = `<img src="https://cdn.prod.website-files.com/680a93d128c5b2a854b57c98/68ba0a0f910357491c07cf6e_644057e01cce5c85d15d1c80_archive_24px.svg" alt="Archive" width="16" height="16">`;
archiveBtn.style.cursor = "pointer";
archiveBtn.style.marginLeft = "10px";

archiveBtn.addEventListener("click", () => {
  updateStatus(todo._id, "archived");
});








    // --- Status label ---
    const label = document.createElement("span");
    label.textContent =
  todo.status === "completed"
    ? " Completed"
    : todo.status === "archived"
    ? " Archived"
    : " Pending";

    li.appendChild(nameInput);
    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(deleteBtn);
    li.appendChild(archiveBtn);

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
      name: input.value,
      userId: userId,
      status: "active"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to add todo:", text);
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
    body: JSON.stringify({ name: newName })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to update todo:", text);
    return;
  }

  loadTodos();
}

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


async function deleteTodo(id) {
  const res = await fetch(`/todos/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to delete todo:", text);
    return;
  }
  loadTodos();
}
// ---------------- INITIAL LOAD ----------------
loadTodos();
