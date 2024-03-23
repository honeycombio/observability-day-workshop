import os
import subprocess
from flask import Flask, jsonify, send_file

app = Flask(__name__)
# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here", "status_code": 0})

@app.route('/applyPhraseToPicture', methods=['POST', 'GET'])
def meminate():

    # Get the absolute path to the PNG file
    input_image_path = os.path.abspath('tmp/BusinessWitch.png')

    # Check if the file exists
    if not os.path.exists(input_image_path):
        return 'Backup image file not found', 500
    
    # Define the text to apply
    text = "I got you"

    # Define the output image path
    output_image_path = os.path.abspath('tmp/BW_with_text.png')

    command = ['convert', input_image_path, '-fill', 'white', '-pointsize', '36', '-gravity', 'center', '-annotate', '0', text, output_image_path]
    # Execute ImageMagick command to apply text to the image
    subprocess.run(command)

    # Serve the modified image
    return send_file(
        output_image_path,
        mimetype='image/png'
    )


    # Serve the PNG file
    return send_file(
        input_image_path,
        mimetype='image/png'
    )

if __name__ == '__main__':
    app.run(debug=True, port=10114)
