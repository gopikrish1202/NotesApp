// ---------------- IMPORTS ----------------
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());

// ---------------- USER SCHEMA ----------------
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}); //creating schema for user

const User = mongoose.model("User", UserSchema); //building a model using the schema

// ---------------- TODO SCHEMA ----------------
const TodoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: {
  type: String,
  enum: ["active", "completed", "archived", "deleted"],
  default: "active"
},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}); //creating schema for todo items

const Todo = mongoose.model("Todo", TodoSchema); //building a model for todo items data using the respective schema

// ---------------- AUTH ROUTES ----------------

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    await User.create({ username, password });

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body; //getting username and password from req body

    const user = await User.findOne({ username, password }); //comparing with the database, using the schema instance
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      username: user.username
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- UI ROUTES ----------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.use(express.static(path.join(__dirname, "public")));

// ---------------- TODO ROUTES ----------------

// CREATE TODO
app.post("/todos", async (req, res) => {
  try {
    const { name, userId, status } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ message: "name and userId required" });
    }

    const todo = await Todo.create({
      name: name.trim(),
      status: status || "active",
      userId: new mongoose.Types.ObjectId(userId)
    });

    res.status(201).json(todo);

  } catch (err) {
    console.error("Create todo validation error:", err);
    res.status(500).json({ error: err.message });
  }
});



// GET TODOS FOR LOGGED-IN USER ✅
app.get("/todos/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

   const todos = await Todo.find({
  userId: new mongoose.Types.ObjectId(userId),
  status: { $in: ["active", "completed", "archived"] }
});


    
    res.json(todos);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE TODO
app.put("/todos/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

  const updateData = {};
if (req.body.name !== undefined) updateData.name = req.body.name;
if (req.body.status !== undefined) updateData.status = req.body.status;

const updatedTodo = await Todo.findByIdAndUpdate(
  req.params.id,
  updateData,
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

// DELETE TODO
app.delete("/todos/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
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



// ---------------- DB CONNECTION ----------------
mongoose.connect(
  "mongodb+srv://gurramsriranga1202_db_user:mCnenO3B0CJePEwL@nodecluster1202.a98coqp.mongodb.net/todos"
)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
