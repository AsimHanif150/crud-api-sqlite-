const express = require("express");
const Database = require("better-sqlite3");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");

const app = express();
const PORT = 3000;

// Connect to SQLite database (creates tasks.db if it doesn't exist)
const db = new Database("tasks.db");

app.use(express.json()); // lets us read JSON request bodies

// ---------- Stage 0: SQLite Database ----------

// Create the tasks table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT,
    done BOOLEAN
  )
`);

// Check how many tasks are already in the database
const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();

// If the database is empty, add the 3 starting tasks (only runs once)
if (count === 0) {
  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  insert.run("Buy milk", 0);
  insert.run("Walk the dog", 0);
  insert.run("Finish assignment", 1);
}

// Helper: SQLite stores done as 0/1 — convert back to true/false so the
// API's response shape matches Assignment 1 exactly.
function toApiTask(row) {
  return { ...row, done: !!row.done };
}

// ---------- Stage 1: root + health ----------

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- Stage 2: read ----------

app.get("/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks").all();
  res.json(tasks.map(toApiTask));
});

app.get("/tasks/:id", (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${req.params.id} not found`,
    });
  }

  res.json(toApiTask(task));
});

// ---------- Stage 3: create ----------

app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "title is required and cannot be empty",
    });
  }

  const result = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
    .run(title.trim(), 0);

  const newTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(toApiTask(newTask));
});

// ---------- Stage 4: update + delete ----------

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body || {};

  // Check if at least one field was provided
  if (title === undefined && done === undefined) {
    return res.status(400).json({
      error: "provide title and/or done to update",
    });
  }

  // Validate title
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        error: "title must be a non-empty string",
      });
    }
  }

  // Validate done
  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({
        error: "done must be true or false",
      });
    }
  }

  // Check if task exists
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`,
    });
  }

  // Update title if provided
  if (title !== undefined) {
    db.prepare("UPDATE tasks SET title = ? WHERE id = ?").run(
      title.trim(),
      id
    );
  }

  // Update done if provided
  if (done !== undefined) {
    db.prepare("UPDATE tasks SET done = ? WHERE id = ?").run(
      done ? 1 : 0,
      id
    );
  }

  // Get updated task
  const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  res.json(toApiTask(updatedTask));
}); // <-- closes app.put

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: `Task ${id} not found`,
    });
  }

  res.status(204).send();
});

// ---------- Stage 5: Swagger UI at /docs ----------

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// ---------- Start Server ----------

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
  console.log(`Swagger UI at http://localhost:${PORT}/docs`);
});