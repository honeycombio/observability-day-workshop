from flask import Flask, jsonify
import random

app = Flask(__name__)

PHRASES = [
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
]

# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here, ready to pick a phrase", "status_code": 0})

# Route for getting a random phrase
@app.route('/phrase')
def get_phrase():
    phrase = choose(PHRASES)
    # You can implement tracing logic here if needed
    return jsonify({"phrase": phrase})

# Helper function to choose a random item from a list
def choose(array):
    return random.choice(array)

if __name__ == '__main__':
    app.run(debug=True, port=10114)
