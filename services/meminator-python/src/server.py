import os
import subprocess
from flask import Flask, jsonify, send_file, request
from opentelemetry import trace

from download import generate_random_filename, download_image
from custom_span_processor import CustomSpanProcessor

# tracer_provider = trace.get_tracer_provider() 
# Gets the current global tracer provider. This is the central configuration point for OpenTelemetry SDK.
# Acts as an entry point to attach processors or configure exporters.
# More: https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/pyproject.toml
# INSTRUMENTATION: 
# Adds the custom span processor to the provider.
# This enables automatic enrichment of every span with free space metrics.
# Useful for capturing host-level context without setting up infrastructure-level metrics collection.
# tracer_provider.add_span_processor(CustomSpanProcessor()) 


# Acquire a tracer
tracer = trace.get_tracer("meminator-tracer")

IMAGE_MAX_WIDTH_PX=1000
IMAGE_MAX_HEIGHT_PX=1000

print("I am the meminator, in python! I put phrases on images")

app = Flask(__name__)
@app.route('/health')
def health():
    result = {"message": "I am here", "status_code": 0}
    return jsonify(result)

@app.route('/applyPhraseToPicture', methods=['POST', 'GET'])
def apply_phrase_to_picture():
    input = request.json or { "phrase": "We practice error hiding"}
    # INSTRUMENTATION:
    # Retrieves the currently active span from the request context.
    # Allows attaching custom metadata to this span related to request inputs.
    # request_span = trace.get_current_span()

    phrase = input.get("phrase", "words go here").upper()
    # INSTRUMENTATION: add important bits
    # Adds the phrase being applied to the image as an attribute on the active span.
    # request_span.set_attribute("app.phrase", phrase) 

    imageUrl = input.get("imageUrl", "http://missing.booo/no-url-here.png")
    # Records the input image URL, allowing trace-based debugging if something fails later in the pipeline.
    # request_span.set_attribute("app.imageUrl", imageUrl)

    # Get the absolute path to the PNG file
    input_image_path = download_image(imageUrl)

    # Check whether the file exists
    if not os.path.exists(input_image_path):
        return 'downloaded image file not found', 500
    
    # Define the output image path
    output_image_path = generate_random_filename(input_image_path)

    command = ['convert', 
            input_image_path,
            '-resize', f'{IMAGE_MAX_WIDTH_PX}x{IMAGE_MAX_HEIGHT_PX}>',
            '-gravity', 'North',
            '-pointsize', '48',
            '-fill', 'white',
            '-undercolor', '#00000080',
            '-font', 'Angkor-Regular',
            '-annotate', '0', phrase, 
            output_image_path]
    
    #  Execute ImageMagick command to apply text to the image 
    # INSTRUMENTATION: 
    # Creates a new span for this subprocess operation.
    # Useful for measuring performance and failure scenarios of the image transformation step.
    # with tracer.start_as_current_span("spawn process") as subprocess_span:

    # Logs the full shell command that was run as context for the span.
    # subprocess_span.set_attribute("app.subprocess.command", " ".join(command))
    result = subprocess.run(command, capture_output=True, text=True)

    # Records whether the subprocess succeeded (0) or failed (non-zero).
    # subprocess_span.set_attribute("app.subprocess.returncode", result.returncode)

    # Records the standard output and error from the subprocess.
    # subprocess_span.set_attribute("app.subprocess.stdout", result.stdout)
    # subprocess_span.set_attribute("app.subprocess.stderr", result.stderr)
    if result.returncode != 0:
        raise Exception("Subprocess failed with return code:", result.returncode)
        
    # Serve the modified image
    return send_file(
        output_image_path,
        mimetype='image/png'
    )

if __name__ == '__main__':
    app.run(debug=True, port=10116)
