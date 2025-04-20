import "./tracing";
import express, { Request, Response } from "express";
import { trace, context } from "@opentelemetry/api";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 10117; // Docker uses 10117, local dev can use a different port

// Middleware to parse JSON bodies
app.use(express.json());

// Path to the SQLite database
let dbPath = path.join(__dirname, "../../shared-data/phrases.db");
// For Docker, use this path if the above doesn't exist
if (!fs.existsSync(dbPath)) {
  const dockerPath = path.join("/usr/src/app/shared-data/phrases.db");
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
let db: Database.Database;
try {
  // Open the database in read-only mode
  db = new Database(dbPath, { readonly: true });
  console.log(`Connected to the SQLite database at ${dbPath} in read-only mode`);
} catch (err) {
  console.error(`Error opening database at ${dbPath}:`, err);
  // Don't use fallback behavior - let the error propagate
  // This will cause the service to fail if the database is not available
  // which is the desired behavior for instructional purposes
}

app.get("/health", (req: Request, res: Response) => {
  res.send({ message: "I am here, ready to pick a phrase", status_code: 0 });
});

app.get("/phrase", async (req, res) => {
  const currentSpan = trace.getActiveSpan();
  try {
    const phrase = getRandomPhrase();
    if (phrase) {
      // Add phrase to the current span
      currentSpan?.setAttribute("app.phrase", phrase);
      res.send({ phrase });
    } else {
      // If we couldn't get a phrase, return a 500 error
      currentSpan?.setAttribute("error", true);
      currentSpan?.setAttribute("error.message", "Failed to retrieve phrase data");
      res.status(500).json({ error: "Failed to retrieve phrase data" });
    }
  } catch (error) {
    console.error("Error getting random phrase:", error);
    currentSpan?.setAttribute("error", true);
    currentSpan?.setAttribute("error.message", String(error));
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to get a random phrase from the database
function getRandomPhrase(): string | null {
  const currentSpan = trace.getActiveSpan();
  try {
    // Count the total number of phrases
    const countRow = db.prepare("SELECT COUNT(*) as count FROM phrases").get();
    if (!countRow) {
      const errorMsg = "Error counting phrases: No result returned";
      console.error(errorMsg);
      currentSpan?.setAttribute("error", true);
      currentSpan?.setAttribute("error.message", errorMsg);
      currentSpan?.setAttribute("error.type", "database.query.error");
      currentSpan?.addEvent("database.query.error", { "error.message": errorMsg });
      return null;
    }

    // Get a random phrase from the database
    const count = countRow.count;
    currentSpan?.setAttribute("app.phrase_count", count);

    const randomId = Math.floor(Math.random() * count) + 1;
    currentSpan?.setAttribute("app.random_phrase_id", randomId);

    const phrase = db.prepare("SELECT text FROM phrases WHERE id = ?").get(randomId);

    if (!phrase) {
      const errorMsg = `Error getting random phrase: Phrase with ID ${randomId} not found`;
      console.error(errorMsg);
      currentSpan?.setAttribute("error", true);
      currentSpan?.setAttribute("error.message", errorMsg);
      currentSpan?.setAttribute("error.type", "database.query.error");
      currentSpan?.setAttribute("phrase.id", randomId);
      currentSpan?.addEvent("database.query.error", {
        "error.message": errorMsg,
        "phrase.id": randomId,
      });
      return null;
    }

    return phrase.text;
  } catch (err) {
    const errorMsg = `Database error: ${err}`;
    console.error(errorMsg);
    currentSpan?.setAttribute("error", true);
    currentSpan?.setAttribute("error.message", errorMsg);
    currentSpan?.setAttribute("error.type", "database.query.exception");
    currentSpan?.addEvent("database.query.exception", {
      "error.message": errorMsg,
      "error.type": err instanceof Error ? err.name : "unknown",
    });
    return null;
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
