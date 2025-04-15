from flask import Flask, jsonify
from opentelemetry import trace
import random
import os
import sqlite3

from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor

# Call instrument() to wrap all database connections
SQLite3Instrumentor().instrument()

app = Flask(__name__)

# Use environment variable for port with a different default for local development
PORT = int(os.environ.get("PORT", 3000))  # Docker uses 10119, local dev uses 3000

# Path to the SQLite database
db_path = os.path.join(os.path.dirname(__file__), "../shared-data/users.db")

# Initialize database connection with read-only mode
def get_db_connection():
    try:
        # Open the database in read-only mode using URI parameters
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        print(f"Connected to the SQLite database at {db_path} in read-only mode")
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database at {db_path}: {e}")
        return None

# Fallback array of users in case the database is not available
fallback_users = [
    {
        "id": "1",
        "name": "Lisa Gherardini",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/250px-Mona_Lisa-restored.jpg",
    },
    {
        "id": "2",
        "name": "Girl with Pearl Earring",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Girl_with_a_Pearl_Earring.jpg/250px-Girl_with_a_Pearl_Earring.jpg",
    },
    {
        "id": "3",
        "name": "Vincent van Gogh",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg/250px-Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg",
    },
    {
        "id": "4",
        "name": "Rembrandt",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Rembrandt_Harmensz._van_Rijn_135.jpg/162px-Rembrandt_Harmensz._van_Rijn_135.jpg",
    },
    {
        "id": "5",
        "name": "Albrecht Dürer",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/D%C3%BCrer_Alte_Pinakothek.jpg/142px-D%C3%BCrer_Alte_Pinakothek.jpg",
    },
    {
        "id": "6",
        "name": "Judith Leyster",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Self-portrait_by_Judith_Leyster.jpg/175px-Self-portrait_by_Judith_Leyster.jpg",
    },
    {
        "id": "7",
        "name": "Elisabeth Vigée-Lebrun",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Self-portrait_with_Her_Daughter_by_Elisabeth-Louise_Vig%C3%A9e_Le_Brun.jpg/148px-Self-portrait_with_Her_Daughter_by_Elisabeth-Louise_Vig%C3%A9e_Le_Brun.jpg",
    },
    {
        "id": "8",
        "name": "Artemisia Gentileschi",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Self-portrait_as_the_Allegory_of_Painting_%28La_Pittura%29_-_Artemisia_Gentileschi.jpg/148px-Self-portrait_as_the_Allegory_of_Painting_%28La_Pittura%29_-_Artemisia_Gentileschi.jpg",
    },
    {
        "id": "9",
        "name": "Nobleman in Blue",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Man_with_Blue_Sleeve_2.jpg/250px-Man_with_Blue_Sleeve_2.jpg",
    },
    {
        "id": "10",
        "name": "American Gothic Couple",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Grant_DeVolson_Wood_-_American_Gothic.jpg/250px-Grant_DeVolson_Wood_-_American_Gothic.jpg",
    },
    {
        "id": "11",
        "name": "Pope Innocent X",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PopeInnocentX.jpg/250px-PopeInnocentX.jpg",
    },
    {
        "id": "12",
        "name": "Madame Récamier",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Jacques-Louis_David_016.jpg/330px-Jacques-Louis_David_016.jpg",
    },
    {
        "id": "13",
        "name": "Adele Bloch-Bauer",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Gustav_Klimt%2C_1907%2C_Adele_Bloch-Bauer_I%2C_Neue_Galerie_New_York.jpg/250px-Gustav_Klimt%2C_1907%2C_Adele_Bloch-Bauer_I%2C_Neue_Galerie_New_York.jpg",
    },
    {
        "id": "14",
        "name": "Madame X",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Sargent_MadameX.jpeg/105px-Sargent_MadameX.jpeg",
    },
    {
        "id": "15",
        "name": "Dr. Gachet",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Portrait_of_Dr._Gachet.jpg/250px-Portrait_of_Dr._Gachet.jpg",
    },
    {
        "id": "16",
        "name": "Giovanna Tornabuoni",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Ghirlandaio-Giovanna_Tornabuoni_cropped.jpg/120px-Ghirlandaio-Giovanna_Tornabuoni_cropped.jpg",
    },
    {
        "id": "17",
        "name": "Baldassare Castiglione",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Baldassare_Castiglione%2C_by_Raffaello_Sanzio%2C_from_C2RMF_retouched.jpg/161px-Baldassare_Castiglione%2C_by_Raffaello_Sanzio%2C_from_C2RMF_retouched.jpg",
    },
    {
        "id": "18",
        "name": "The Laughing Cavalier",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Frans_Hals_%E2%80%93_The_Laughing_Cavalier.jpg/164px-Frans_Hals_%E2%80%93_The_Laughing_Cavalier.jpg",
    },
    {
        "id": "19",
        "name": "Susanna Fourment",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Le_Chapeau_de_Paille_by_Peter_Paul_Rubens.jpg/250px-Le_Chapeau_de_Paille_by_Peter_Paul_Rubens.jpg",
    },
    {
        "id": "20",
        "name": "Charles I of England",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Charles_I_of_England.jpg/153px-Charles_I_of_England.jpg",
    },
    {
        "id": "21",
        "name": "Doge Leonardo Loredan",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Giovanni_Bellini%2C_portrait_of_Doge_Leonardo_Loredan.jpg/142px-Giovanni_Bellini%2C_portrait_of_Doge_Leonardo_Loredan.jpg",
    },
    {
        "id": "22",
        "name": "Eleonora di Toledo",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Bronzino_-_Eleonora_di_Toledo_col_figlio_Giovanni_-_Google_Art_Project.jpg/250px-Bronzino_-_Eleonora_di_Toledo_col_figlio_Giovanni_-_Google_Art_Project.jpg",
    },
    {
        "id": "23",
        "name": "Mary Tudor",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Anthonis_Mor_001.jpg/250px-Anthonis_Mor_001.jpg",
    },
    {
        "id": "24",
        "name": "Elizabeth I",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Elizabeth_I_%28Armada_Portrait%29.jpg/250px-Elizabeth_I_%28Armada_Portrait%29.jpg",
    },
    {
        "id": "25",
        "name": "Louis XIV of France",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Louis_XIV_of_France.jpg/141px-Louis_XIV_of_France.jpg",
    },
    {
        "id": "26",
        "name": "The Beautiful Strasbourg Woman",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Largilli%C3%A8re_-_Die_sch%C3%B6ne_Stra%C3%9Fburgerin.jpg/250px-Largilli%C3%A8re_-_Die_sch%C3%B6ne_Stra%C3%9Fburgerin.jpg",
    },
    {
        "id": "27",
        "name": "Lady with the Veil",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Alexander_Roslin_-_The_Lady_with_the_Veil_%28the_Artist%27s_Wife%29_-_Google_Art_Project.jpg/250px-Alexander_Roslin_-_The_Lady_with_the_Veil_%28the_Artist%27s_Wife%29_-_Google_Art_Project.jpg",
    },
    {
        "id": "28",
        "name": "Blue Boy",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/The_Blue_Boy.jpg/135px-The_Blue_Boy.jpg",
    },
    {
        "id": "29",
        "name": "Lady Caroline Scott",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Lady_Caroline_Scott_-_Sir_Joshua_Reynolds.png/157px-Lady_Caroline_Scott_-_Sir_Joshua_Reynolds.png",
    },
    {
        "id": "30",
        "name": "Manuel Osorio Manrique",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Manuel_Osorio_Manrique_de_Zu%C3%B1iga_%281784%E2%80%931792%29_MET_DP287624.jpg/147px-Manuel_Osorio_Manrique_de_Zu%C3%B1iga_%281784%E2%80%931792%29_MET_DP287624.jpg",
    },
    {
        "id": "31",
        "name": "Pinkie",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Thomas_Lawrence_Pinkie.jpg/250px-Thomas_Lawrence_Pinkie.jpg",
    },
    {
        "id": "32",
        "name": "George Washington",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Gilbert_Stuart%2C_George_Washington_%28Lansdowne_portrait%2C_1796%29.jpg/124px-Gilbert_Stuart%2C_George_Washington_%28Lansdowne_portrait%2C_1796%29.jpg",
    },
    {
        "id": "33",
        "name": "Maja Vestida",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Goya_Maja_ubrana2.jpg/300px-Goya_Maja_ubrana2.jpg",
    },
    {
        "id": "34",
        "name": "Napoleon Bonaparte",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project.jpg/120px-Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project.jpg",
    },
    {
        "id": "35",
        "name": "Eugène Delacroix",
        "avatarUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/F%C3%A9lix_Nadar_1820-1910_portraits_Eug%C3%A8ne_Delacroix_restored.jpg/250px-F%C3%A9lix_Nadar_1820-1910_portraits_Eug%C3%A8ne_Delacroix_restored.jpg",
    },
]

# Helper function to get a random user from the database
def get_random_user():
    current_span = trace.get_current_span()
    conn = get_db_connection()
    if conn is None:
        # Return None to indicate failure instead of falling back
        if current_span:
            current_span.add_event(
                name="database.connection.error",
                attributes={"error.message": "Failed to connect to database"}
            )
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
