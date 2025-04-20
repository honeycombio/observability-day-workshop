const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Array of phrases used in the application
const phrases = [
  "you're muted",
  "not dead yet",
  "Let them.",
  "Boiling Loves Company!",
  "Must we?",
  "SRE not-sorry",
  "Honeycomb at home",
  "There is no cloud",
  "This is fine",
  "It's a trap!",
  "Not Today",
  "You had one job",
  "bruh",
  "have you tried restarting?",
  "try again after coffee",
  "deploy != release",
  "oh, just the crimes",
  "not a bug, it's a feature",
  "test in prod",
  "who broke the build?",
  "it was dns",
  "all the best things are stupid",
  "entropy comes for us all",
  "I'm down if you're up for it",
  "Can you give me a concrete example?",
  "Roll forward",
  "there is no root cause",
  "the system is broken",
  "i deploy whenever i want",
  "nobody saw me",
  "run less software",
  "the tooth fairy told me to",
  "everything is an experiment",
  "idk what i'm doing as a service",
  "what if we just fix it",
  "do it with style",
  "certainty is a feeling",
  "joyfully adding capabilities",
  "quick, blame the human",
  "You're absolutely right. Let me try again",
  "Hold on, pausing for GC",
  "AbstractSingletonProxyFactoryBean",
  "Generics were a mistake",
  "give my kids a completablefuture",
  "Hello Wrold",
  "the OOMKiller"
];

// Database file path
const dbPath = path.join(__dirname, "phrases.db");

// Create a new database connection
const db = new sqlite3.Database(dbPath);

// Create the phrases table and insert data
db.serialize(() => {
  // Drop the table if it exists
  db.run("DROP TABLE IF EXISTS phrases");

  // Create the phrases table
  db.run(`
    CREATE TABLE phrases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL
    )
  `);

  // Prepare the insert statement
  const stmt = db.prepare("INSERT INTO phrases (text) VALUES (?)");

  // Insert each phrase
  phrases.forEach((phrase) => {
    stmt.run(phrase);
  });

  // Finalize the statement
  stmt.finalize();

  // Verify the data was inserted
  db.all("SELECT COUNT(*) as count FROM phrases", (err, rows) => {
    if (err) {
      console.error("Error counting phrases:", err);
    } else {
      console.log(`Inserted ${rows[0].count} phrases into the database`);
    }

    // Close the database connection
    db.close();
  });
});

console.log(`Phrases database initialized at ${dbPath}`);
