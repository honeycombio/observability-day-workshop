import "./tracing";
import express, { Request, Response } from "express";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 10117; // Docker uses 10117, local dev can use a different port

// Middleware to parse JSON bodies
app.use(express.json());

// Path to the SQLite database - use a single, consistent path
const dbPath = "/app/shared-data/phrases.db";

// We don't create directories or handle missing databases
// If the database doesn't exist, the service should fail
// This is better for instructional purposes to demonstrate error telemetry

// Initialize database connection with read-only mode
let db: any;
try {
  // Open the database in read-only mode
  db = new Database(dbPath, { readonly: true });
} catch (err) {
  // Get the active span for telemetry
  const currentSpan = trace.getActiveSpan();

  // Record the exception in telemetry
  if (err instanceof Error) {
    currentSpan?.recordException(err);
  }

  // Set the span status to error
  currentSpan?.setStatus({
    code: SpanStatusCode.ERROR,
    message: `Error opening database at ${dbPath}: ${err}`,
  });

  // Don't use fallback behavior - let the error propagate
  // This will cause the service to fail if the database is not available
  // which is the desired behavior for instructional purposes
  throw err;
}

app.get("/health", (req: Request, res: Response) => {
  res.send({ message: "I am here, ready to pick a phrase", status_code: 0 });
});

app.get("/phrase", async (req, res) => {
  const currentSpan = trace.getActiveSpan();
  try {
    const phrase = getRandomPhrase();
    if (phrase) {
      res.send({ phrase });
    } else {
      // If we couldn't get a phrase, return a 500 error
      currentSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Failed to retrieve phrase data",
      });
      res.status(500).json({ error: "Failed to retrieve phrase data" });
    }
  } catch (error) {
    // Record error in telemetry
    if (error instanceof Error) {
      currentSpan?.recordException(error);
    }

    currentSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: String(error),
    });

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
      currentSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Error counting phrases: No result returned",
      });
      return null;
    }

    // Get a random phrase from the database
    const count = countRow.count;

    const randomId = Math.floor(Math.random() * count) + 1;

    const phrase = db.prepare("SELECT text FROM phrases WHERE id = ?").get(randomId);

    if (!phrase) {
      currentSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: `Error getting random phrase: Phrase with ID ${randomId} not found`,
      });
      return null;
    }

    return phrase.text;
  } catch (err) {
    // Record the exception in telemetry
    if (err instanceof Error) {
      currentSpan?.recordException(err);
    }

    currentSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: `Database error: ${err}`,
    });

    return null;
  }
}

// Start the server
app.listen(PORT, () => {
  // Server is now running - we don't log to console
  // Any important information should be in span attributes
});
