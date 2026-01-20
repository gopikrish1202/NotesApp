const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());

// ── SCHEMAS ────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const TodoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ["active", "completed", "archived", "deleted"],
    default: "active"
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
const Todo = mongoose.model("Todo", TodoSchema);

// ── AUTH ROUTES ────────────────────────────────────────────
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    await User.create({ username, password });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user._id.toString(),
      username: user.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── TODO ROUTES ────────────────────────────────────────────
app.post("/todos", async (req, res) => {
  try {
    const { name, userId, status } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Todo name is required" });
    }
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    let todoUserId;
    try {
      todoUserId = new mongoose.Types.ObjectId(userId);
    } catch {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const todo = await Todo.create({
      name: name.trim(),
      status: status || "active",
      userId: todoUserId
    });

    res.status(201).json(todo);
  } catch (err) {
    console.error("Create todo error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/todos/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let queryUserId;
    try {
      queryUserId = new mongoose.Types.ObjectId(userId);
    } catch {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const todos = await Todo.find({
      userId: queryUserId,
      status: { $in: ["active", "completed", "archived"] }
    }).sort({ updatedAt: -1 });

    res.json(todos);
  } catch (err) {
    console.error("Get todos error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/todos/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid todo ID" });
    }

    const updateData = {};
    if (req.body.name !== undefined) {
      if (!req.body.name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      updateData.name = req.body.name.trim();
    }
    if (req.body.status !== undefined) {
      if (!["active", "completed", "archived", "deleted"].includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updateData.status = req.body.status;
    }

    const updated = await Todo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Optional: permanent delete route (not used by frontend yet)
app.delete("/todos/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Todo not found" });
    res.json({ message: "Todo permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SERVE FRONTEND ─────────────────────────────────────────
// IMPORTANT: Login route first → overrides any index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve all static files (css, js, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Catch-all → fallback to login (in case someone types /something)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ── DATABASE & SERVER START ────────────────────────────────
mongoose.connect(
  "mongodb+srv://gurramsriranga1202_db_user:mCnenO3B0CJePEwL@nodecluster1202.a98coqp.mongodb.net/todos?retryWrites=true&w=majority"
)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection failed:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});