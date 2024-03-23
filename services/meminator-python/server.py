from flask import Flask, jsonify

app = Flask(__name__)
# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here", "status_code": 0})

@app.route('/applyPhraseToPicture', methods=['POST'])
def meminate():
    return

if __name__ == '__main__':
    app.run(debug=True, port=10114)
