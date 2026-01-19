// Import Express framework
const express = require("express");

// Import Mongoose to work with MongoDB
const mongoose = require("mongoose");

const path = require("path");

const app = express(); // ✅ CREATE APP FIRST

app.use(express.json());

// ✅ Login page as default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// ✅ Serve static files (login.html, index.html, app.js)
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://gurramsriranga1202_db_user:mCnenO3B0CJePEwL@nodecluster1202.a98coqp.mongodb.net/todos"
)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

// Define schema
const TodoSchema = new mongoose.Schema({
  name: String,
  completed: Boolean
});

// Create model
const Todo = mongoose.model("Todo", TodoSchema);

/* ---------------- CREATE ---------------- */
app.post("/todos", async (req, res) => {
  try {
    const todo = await Todo.create({
      name: req.body.name,
      completed: false
    });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- READ ALL ---------------- */
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- READ ONE ---------------- */
app.get("/todos/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- UPDATE ---------------- */
app.put("/todos/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        completed: req.body.completed
      },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DELETE ---------------- */
app.delete("/todos/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);

    if (!deletedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
// app.listen(3000, () =>
//   console.log("Server running on http://localhost:3000")
// );
const PORT = process.env.PORT || 3000;
 console.log(`Server running on port ${PORT}`);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




