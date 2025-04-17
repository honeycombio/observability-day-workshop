import requests
from opentelemetry import trace

SERVICES = {
    'meminator': 'http://meminator:10116/applyPhraseToPicture',
    'phrase-picker': 'http://phrase-picker:10117/phrase',
    'image-picker': 'http://image-picker:10118/imageUrl',
    'user-service': 'http://user-service:10119/current-user',
}

def fetch_from_service(service, method='GET', body=None, timeout=5):
    """
    Fetches data from a remote service over HTTP.

    Args:
        service (str): One of the services in SERVICES
        method: 'GET' or 'POST'
        body: JSON body for POST requests
        timeout: Timeout in seconds for the HTTP request (default: 5)
    Returns:
        dict: The JSON response from the remote service.
    """
    try:
        url = SERVICES[service] # what happens if it is not there?
        if method == 'GET':
            response = requests.get(url, timeout=timeout)
        elif method == 'POST':
            response = requests.post(url, json=body, timeout=timeout)
        else:
            print(f"Method {method} not supported")
        response.raise_for_status()
        return response # do not parse the response here
    except requests.Timeout as e:
        trace.get_current_span().set_attribute("error", True)
        trace.get_current_span().set_attribute("error.type", "timeout")
        trace.record_exception(e, { "http.url": url, "http.timeout": timeout })
        print(f"Timeout error fetching data from {url} (exceeded {timeout}s): {e}")
        return None
    except requests.RequestException as e:
        trace.get_current_span().set_attribute("error", True)
        trace.get_current_span().set_attribute("error.type", "request_exception")
        trace.record_exception(e, { "http.url": url })
        print(f"Error fetching data from {url}: {e}")
        return None
