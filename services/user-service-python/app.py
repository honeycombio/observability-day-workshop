from flask import Flask, jsonify
from opentelemetry import trace
import random
import os
import sqlite3

app = Flask(__name__)

# Use environment variable for port with a different default for local development
PORT = int(os.environ.get("PORT", 3000))  # Docker uses 10119, local dev uses 3000

# Path to the SQLite database
db_path = os.path.join(os.path.dirname(__file__), "shared-data/users.db")

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

# Helper function to get a random user from the database
def get_random_user():
    current_span = trace.get_current_span()
    conn = get_db_connection()
    if conn is None:
        return None

    try:
        # Count the total number of users
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users")
        count = cursor.fetchone()[0]

        if count == 0:
            conn.close()
            if current_span:
                current_span.add_event(
                    name="database.query.error",
                    attributes={"error.message": "No users found in database"}
                )
            return None

        # Get a random user from the database
        random_id = str(random.randint(1, count))
        cursor.execute("SELECT * FROM users WHERE id = ?", (random_id,))
        user = cursor.fetchone()

        if user is None:
            conn.close()
            if current_span:
                current_span.add_event(
                    name="database.query.error",
                    attributes={
                        "error.message": f"User with ID {random_id} not found",
                        "user.id": random_id
                    }
                )
            return None

        # Convert the sqlite3.Row to a dictionary
        user_dict = {key: user[key] for key in user.keys()}
        conn.close()
        return user_dict

    except sqlite3.Error as e:
        error_message = f"Error getting random user: {e}"
        if current_span:
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

# Health check endpoint
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"message": "User service is healthy", "status_code": 0})

# Get current user endpoint
@app.route("/current-user", methods=["GET"])
def current_user():
    current_span = trace.get_current_span()

    # Get a random user
    user = get_random_user()

    # Return a 500 error if we couldn't get a user
    if user is None:
        error_message = {"error": "Failed to retrieve user data"}
        if current_span:
            current_span.set_attribute("error", True)
            current_span.set_attribute("error.message", "Failed to retrieve user data")
            current_span.add_event(
                name="api.error",
                attributes={
                    "error.message": "Failed to retrieve user data",
                    "http.status_code": 500,
                    "service.name": "user-service-python"
                }
            )
        return jsonify(error_message), 500

    # Add user info to the current span
    if current_span:
        current_span.set_attribute("user.id", user["id"])
        current_span.set_attribute("user.name", user["name"])
        current_span.add_event(
            name="user.retrieved",
            attributes={
                "user.id": user["id"],
                "user.name": user["name"]
            }
        )

    return jsonify(user)

if __name__ == "__main__":
    print(f"User service running on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT)
