console.log("app.js loaded");

async function loadTodos() {
  const res = await fetch("/todos");
  const todos = await res.json();

  console.log("Todos from backend:", todos); // DEBUG

  const list = document.getElementById("todoList");
  list.innerHTML = "";

  todos.forEach(todo => {
    const li = document.createElement("li");

    // Normalize completed to boolean (handles "true"/"false" strings)
    const isCompleted = todo.completed === true || todo.completed === "true";

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
      toggleTodo(todo._id, checkbox.checked);
    });

    // --- Status label ---
    const label = document.createElement("span");
    label.textContent = isCompleted ? " Completed" : " Pending";

    li.appendChild(nameInput);
    li.appendChild(checkbox);
    li.appendChild(label);

    list.appendChild(li);
  });
}

async function addTodo() {
  const input = document.getElementById("todoInput");
  if (!input.value.trim()) return;

  await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: input.value })
  });

  input.value = "";
  loadTodos();
}

async function updateTodo(id, newName) {
  await fetch(`/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  });

  loadTodos();
}

async function toggleTodo(id, status) {
  console.log("Updating completed:", status); // DEBUG

  await fetch(`/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: status })
  });

  loadTodos();
}

loadTodos();
