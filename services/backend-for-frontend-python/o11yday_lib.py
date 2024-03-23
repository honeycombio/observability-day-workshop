import requests

SERVICES = {
    'meminator': 'http://meminator:10114/applyPhraseToPicture', 
    'phrase-picker': 'http://phrase-picker:10114/phrase',
    'image-picker': 'http://image-picker:10114/imageUrl',
}

def fetch_from_service(service, method='GET', body=None):
    """
    Fetches data from a remote service over HTTP.

    Args:
        service (str): One of the services in SERVICES
        method: 'GET' or 'POST'
    Returns:
        dict: The JSON response from the remote service.
    """
    try:
        url = SERVICES[service] # what happens if it is not there?
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=body)
        else:
            print(f"Method {method} not supported")
        response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
        return response # do not parse the response here
    except requests.RequestException as e:
        print(f"Error fetching data from {url}: {e}")
        return None
