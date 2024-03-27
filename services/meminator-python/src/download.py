
import os
import uuid
import requests
# from opentelemetry import trace

def download_image(url):
    # Send a GET request to the URL
    response = requests.get(url)

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Open the file in binary mode and write the image content
        filename = generate_random_filename(url)
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Image downloaded successfully and saved as {filename}")
        return filename
    else:
        # trace.get_current_span().set_attribute("app.meminate.download.error", response.status_code) #INSTRUMENTATION: add important errors
        return os.path.abspath('tmp/BusinessWitch.png')

def generate_random_filename(input_filename):
    # Extract the extension from the input filename
    extension = get_file_extension(input_filename)
    
    # Generate a UUID and convert it to a string
    random_uuid = uuid.uuid4()
    # Convert UUID to string and remove dashes
    random_filename = str(random_uuid).replace("-", "")
    
    # Append the extension to the random filename
    random_filename_with_extension = random_filename + extension
    
    random_filepath = os.path.join("/tmp", random_filename_with_extension)
    
    return random_filepath

def get_file_extension(url):
    # Split the URL by "." and get the last part
    parts = url.split(".")
    if len(parts) > 1:
        return "." + parts[-1]
    else:
        return ""