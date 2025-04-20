from flask import Flask, jsonify
import random
import os
import sqlite3
from opentelemetry import trace

app = Flask(__name__)

# Path to the SQLite database
db_path = "/app/shared-data/phrases.db"

# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here, ready to pick a phrase", "status_code": 0})

def get_db_connection():
    try:
        current_span = trace.get_current_span()
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        current_span = trace.get_current_span()
        current_span.record_exception(e)
        current_span.set_status(trace.StatusCode.ERROR, f"Failed to connect to database: {e}")
        return None

def get_random_phrase():
    current_span = trace.get_current_span()
    conn = get_db_connection()
    if conn is None:
        return None

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM phrases")
        count = cursor.fetchone()[0]
        current_span.set_attribute("app.phrase_count", count)

        if count == 0:
            conn.close()
            current_span.set_status(trace.StatusCode.ERROR, "No phrases found in database")
            return None

        random_id = random.randint(1, count)
        current_span.set_attribute("app.random_phrase_id", random_id)
        cursor.execute("SELECT text FROM phrases WHERE id = ?", (random_id,))
        phrase_row = cursor.fetchone()

        if phrase_row is None:
            conn.close()
            current_span.set_status(trace.StatusCode.ERROR, f"Phrase with ID {random_id} not found")
            current_span.set_attribute("phrase.id", random_id)
            return None

        phrase = phrase_row[0]
        conn.close()
        return phrase

    except sqlite3.Error as e:
        if conn:
            conn.close()
        current_span.record_exception(e)
        current_span.set_status(trace.StatusCode.ERROR, f"Error getting random phrase: {e}")
        return None

@app.route('/phrase')
def get_phrase():
    current_span = trace.get_current_span()
    phrase = get_random_phrase()

    if phrase is None:
        return jsonify({"error": "Failed to retrieve phrase data"}), 500

    current_span.set_attribute("app.phrase", phrase)
    return jsonify({"phrase": phrase})

if __name__ == '__main__':
    app.run(debug=True, port=10117)
