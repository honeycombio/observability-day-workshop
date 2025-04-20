import sqlite3
import os

# Array of phrases used in the application
phrases = [
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
]

# Database file path
db_path = os.path.join(os.path.dirname(__file__), "phrases.db")

# Create a new database connection
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create the phrases table and insert data
# Drop the table if it exists
cursor.execute("DROP TABLE IF EXISTS phrases")

# Create the phrases table
cursor.execute("""
    CREATE TABLE phrases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL
    )
""")

# Insert each phrase
for phrase in phrases:
    cursor.execute("INSERT INTO phrases (text) VALUES (?)", (phrase,))

# Commit the changes
conn.commit()

# Verify the data was inserted
cursor.execute("SELECT COUNT(*) as count FROM phrases")
count = cursor.fetchone()[0]
print(f"Inserted {count} phrases into the database")

# Close the database connection
conn.close()

print(f"Phrases database initialized at {db_path}")
