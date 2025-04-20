from flask import Flask, jsonify
import random
import os
import sqlite3
from opentelemetry import trace

app = Flask(__name__)

# Path to the SQLite database - use a single, consistent path
db_path = "/app/shared-data/phrases.db"

# We don't create directories or handle missing databases
# If the database doesn't exist, the service should fail
# This is better for instructional purposes to demonstrate error telemetry

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
        current_span = trace.get_current_span()
        # Record the exception in the span
        current_span.record_exception(e)
        # Set the span status to error
        current_span.set_status(trace.StatusCode.ERROR, f"Failed to connect to database: {e}")
        # Don't print to console - all error information is in the span
        return None

# Helper function to get a random phrase from the database
def get_random_phrase():
    current_span = trace.get_current_span()
    conn = get_db_connection()
    if conn is None:
        # Don't use fallback behavior - instead, return None to indicate failure
        # Error information is already recorded in get_db_connection
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
            # Set the span status to error
            current_span.set_status(trace.StatusCode.ERROR, error_msg)
            return None

        # Get a random phrase from the database
        random_id = random.randint(1, count)
        current_span.set_attribute("app.random_phrase_id", random_id)
        cursor.execute("SELECT text FROM phrases WHERE id = ?", (random_id,))
        phrase_row = cursor.fetchone()

        if phrase_row is None:
            conn.close()
            error_msg = f"Phrase with ID {random_id} not found"
            # Set the span status to error
            current_span.set_status(trace.StatusCode.ERROR, error_msg)
            # We can still add important attributes
            current_span.set_attribute("phrase.id", random_id)
            return None

        # Get the phrase text
        phrase = phrase_row[0]
        conn.close()
        return phrase

    except sqlite3.Error as e:
        if conn:
            conn.close()
        # Record the exception in the span
        current_span.record_exception(e)
        # Set the span status to error
        current_span.set_status(trace.StatusCode.ERROR, f"Error getting random phrase: {e}")
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
