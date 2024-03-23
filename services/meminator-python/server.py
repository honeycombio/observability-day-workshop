import os
import subprocess
import uuid
from flask import Flask, jsonify, send_file

IMAGE_MAX_WIDTH_PX=1000
IMAGE_MAX_HEIGHT_PX=1000

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
    output_image_path = generate_random_filename(input_image_path)

    command = ['convert',
        '-resize', f'{IMAGE_MAX_WIDTH_PX}x{IMAGE_MAX_HEIGHT_PX}>',
        '-gravity', 'North',
        '-pointsize', '48',
        '-fill', 'white',
        '-undercolor', '#00000080',
        '-font', 'Angkor-Regular',
        '-annotate', '0', text, output_image_path]
    # Execute ImageMagick command to apply text to the image
    result = subprocess.run(command)

    if result.returncode == 0:
        print("Subprocess completed successfully.")
    else:
        print("Subprocess failed with return code:", result.returncode)
        # Access stderr output
        print("Error output:", result.stderr)

    # Serve the modified image
    return send_file(
        output_image_path,
        mimetype='image/png'
    )

def generate_random_filename(input_filename):
    # Extract the extension from the input filename
    _, extension = os.path.splitext(input_filename)
    
    # Generate a UUID and convert it to a string
    random_uuid = uuid.uuid4()
    # Convert UUID to string and remove dashes
    random_filename = str(random_uuid).replace("-", "")
    
    # Append the extension to the random filename
    random_filename_with_extension = random_filename + extension
    
    random_filepath = os.path.join("/tmp", random_filename_with_extension)
    
    return random_filepath


if __name__ == '__main__':
    app.run(debug=True, port=10114)
