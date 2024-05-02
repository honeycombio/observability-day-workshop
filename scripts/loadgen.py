import requests
import time
import random

# Set your endpoint URL
url = "http://localhost:8080/createPicture"

while True:
    try:
        # Send a GET request (modify to POST if necessary)
        response = requests.get(url)
        # Print the status code
        print(f"Response status: {response.status_code}")
    except Exception as e:
        # Print any error message
        print(f"Error occurred: {e}")
    
    # Wait for a random time between 1 and 2 seconds
    time.sleep(random.uniform(1, 2))
