require("./tracing");
const express = require("express");
const { trace } = require("@opentelemetry/api");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
// Use environment variable for port with a different default for local development
const PORT = process.env.PORT || 3000; // Docker uses 10119, local dev uses 3000

app.use(express.json());

// Path to the SQLite database
let dbPath = path.join(__dirname, "../shared-data/users.db");
// For Docker, use this path if the above doesn't exist
if (!fs.existsSync(dbPath)) {
  const dockerPath = path.join("/app/shared-data/users.db");
  if (fs.existsSync(dockerPath)) {
    dbPath = dockerPath;
  }
}

// Make sure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection with read-only mode
let db;
try {
  // Open the database in read-only mode
  db = new Database(dbPath, { readonly: true });
  console.log(
    `Connected to the SQLite database at ${dbPath} in read-only mode`
  );
} catch (err) {
  console.error(`Error opening database at ${dbPath}:`, err.message);
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ message: "User service is healthy", status_code: 0 });
});

// Helper function to get a random user from the database
function getRandomUser(callback) {
  try {
    // Count the total number of users
    const countRow = db.prepare("SELECT COUNT(*) as count FROM users").get();
    if (!countRow) {
      console.error("Error counting users: No result returned");
      callback(null, {
        message: "Database error: Unable to count users",
        status: 500,
      });
      return;
    }

    // Get a random user from the database
    const count = countRow.count;
    const randomId = Math.floor(Math.random() * count) + 1;

    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(randomId.toString());
    if (!user) {
      console.error("Error getting random user: User not found");
      callback(null, {
        message: "User not found",
        status: 404,
      });
      return;
    }

    callback(user, null);
  } catch (err) {
    console.error("Database error:", err.message);
    callback(null, {
      message: `Database error: ${err.message}`,
      status: 500,
    });
  }
}

// Get current user endpoint
app.get("/current-user", (req, res) => {
  const currentSpan = trace.getActiveSpan();

  // Get a random user
  getRandomUser((user, error) => {
    if (error) {
      currentSpan.setAttribute("error", true);
      currentSpan.setAttribute("error.message", error.message);
      return res.status(error.status).json({ error: error.message });
    }

    currentSpan.setAttribute("user.id", user.id);
    currentSpan.setAttribute("user.name", user.name);

    res.json(user);
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`User service running on http://localhost:${PORT}`);
});

// Close database connection when the server is shut down
process.on("SIGINT", () => {
  try {
    db.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error("Error closing database:", err.message);
  }
  server.close(() => {
    console.log("Server shut down");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  try {
    db.close();
    console.log("Database connection closed");
  } catch (err) {
    console.error("Error closing database:", err.message);
  }
  server.close(() => {
    console.log("Server shut down");
    process.exit(0);
  });
});
