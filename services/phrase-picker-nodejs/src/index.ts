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

// Path to the SQLite database
const dbPath = "/app/shared-data/phrases.db";

// Initialize database connection with read-only mode
let db: any;
try {
  db = new Database(dbPath, { readonly: true });
} catch (err) {
  const currentSpan = trace.getActiveSpan();

  if (err instanceof Error) {
    currentSpan?.recordException(err);
  }

  currentSpan?.setStatus({
    code: SpanStatusCode.ERROR,
    message: `Error opening database at ${dbPath}: ${err}`,
  });

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
      currentSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Failed to retrieve phrase data",
      });
      res.status(500).json({ error: "Failed to retrieve phrase data" });
    }
  } catch (error) {
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

function getRandomPhrase(): string | null {
  const currentSpan = trace.getActiveSpan();
  try {
    const countRow = db.prepare("SELECT COUNT(*) as count FROM phrases").get();
    if (!countRow) {
      currentSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Error counting phrases: No result returned",
      });
      return null;
    }

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

app.listen(PORT, () => {});
