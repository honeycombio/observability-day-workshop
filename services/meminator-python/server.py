import os
from flask import Flask, jsonify, send_file

app = Flask(__name__)
# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here", "status_code": 0})

@app.route('/applyPhraseToPicture', methods=['POST', 'GET'])
def meminate():

    # Get the absolute path to the PNG file
    image_path = os.path.abspath('tmp/BusinessWitch.png')

    # Check if the file exists
    if not os.path.exists(image_path):
        return 'Backup image file not found', 500

    # Serve the PNG file
    return send_file(
        image_path,
        mimetype='image/png'
    )

if __name__ == '__main__':
    app.run(debug=True, port=10114)
