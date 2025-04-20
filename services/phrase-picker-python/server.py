from flask import Flask, jsonify
import random
import os
import sqlite3
from opentelemetry import trace

app = Flask(__name__)

print("I am the phrase picker!")

# Path to the SQLite database
db_path = os.path.join(os.path.dirname(__file__), "shared-data/phrases.db")

# Try alternative paths if the default doesn't exist
if not os.path.exists(db_path):
    # Try Docker path
    docker_path = "/app/shared-data/phrases.db"
    if os.path.exists(docker_path):
        db_path = docker_path

print(f"Using database path: {db_path}")
print(f"Database exists: {os.path.exists(db_path)}")

# We don't use fallback phrases as per project guidelines
# Instead, we'll let the service fail if the database is not available
# This is better for instructional purposes to demonstrate error telemetry

# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here, ready to pick a phrase", "status_code": 0})

# Initialize database connection with read-only mode
def get_db_connection():
    try:
        current_span = trace.get_current_span()
        # Open the database in read-only mode using URI parameters
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        return conn
    except sqlite3.Error as e:
        if current_span:
            current_span.add_event(
                name="database.connection.error",
                attributes={"error.message": f"Failed to connect to database: {e}", "app.db_path": db_path}
            )
        print(f"Error connecting to database at {db_path}: {e}")
        return None

# Helper function to get a random phrase from the database
def get_random_phrase():
    current_span = trace.get_current_span()
    conn = get_db_connection()
    if conn is None:
        # Don't use fallback behavior - instead, return None to indicate failure
        current_span.set_attribute("error", True)
        current_span.set_attribute("error.message", "Failed to connect to database")
        current_span.set_attribute("error.type", "database.connection.error")
        return None

    try:
        # Count the total number of phrases
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM phrases")
        count = cursor.fetchone()[0]
        current_span.set_attribute("app.phrase_count", count)

        if count == 0:
            conn.close()
            error_msg = "No phrases found in database"
            current_span.set_attribute("error", True)
            current_span.set_attribute("error.message", error_msg)
            current_span.set_attribute("error.type", "database.query.error")
            current_span.add_event(
                name="database.query.error",
                attributes={"error.message": error_msg}
            )
            return None

        # Get a random phrase from the database
        random_id = random.randint(1, count)
        current_span.set_attribute("app.random_phrase_id", random_id)
        cursor.execute("SELECT text FROM phrases WHERE id = ?", (random_id,))
        phrase_row = cursor.fetchone()

        if phrase_row is None:
            conn.close()
            error_msg = f"Phrase with ID {random_id} not found"
            current_span.set_attribute("error", True)
            current_span.set_attribute("error.message", error_msg)
            current_span.set_attribute("error.type", "database.query.error")
            current_span.set_attribute("phrase.id", random_id)
            current_span.add_event(
                name="database.query.error",
                attributes={
                    "error.message": error_msg,
                    "phrase.id": random_id
                }
            )
            return None

        # Get the phrase text
        phrase = phrase_row[0]
        conn.close()
        return phrase

    except sqlite3.Error as e:
        error_message = f"Error getting random phrase: {e}"
        current_span.set_attribute("error", True)
        current_span.set_attribute("error.message", error_message)
        current_span.set_attribute("error.type", "database.query.exception")
        current_span.add_event(
            name="database.query.exception",
            attributes={
                "error.message": error_message,
                "error.type": "sqlite3.Error"
            }
        )
        if conn:
            conn.close()
        return None

# Route for getting a random phrase
@app.route('/phrase')
def get_phrase():
    current_span = trace.get_current_span()

    # Get a random phrase
    phrase = get_random_phrase()

    # If we couldn't get a phrase, return a 500 error
    if phrase is None:
        return jsonify({"error": "Failed to retrieve phrase data"}), 500

    # Add phrase to the current span
    current_span.set_attribute("app.phrase", phrase)

    return jsonify({"phrase": phrase})

if __name__ == '__main__':
    app.run(debug=True, port=10117)
