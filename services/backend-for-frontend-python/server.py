from flask import Flask, jsonify, Response
from o11yday_lib import fetch_from_service

app = Flask(__name__)
# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here", "status_code": 0})

@app.route('/createPicture', methods=['POST'])
def create_picture():
        # Fetch data from phrase-picker and image-picker services asynchronously
        phrase_response = fetch_from_service('phrase-picker')
        image_response = fetch_from_service('image-picker')

        phrase_result = phrase_response.json() if phrase_response and phrase_response.ok else {"phrase": "This is sparta"}
        image_result = image_response.json() if phrase_response and image_response.ok else {"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg"}

        # Make a request to the meminator service
        body = {**phrase_result, **image_result}
        meminator_response = fetch_from_service('meminator', method="POST", body=body)

        # Check if the response was successful
        if not meminator_response.ok or meminator_response.content is None:
            raise Exception(f"Failed to fetch picture from meminator: {meminator_response.status_code} {meminator_response.reason}")

        # Return the picture data

        flask_response = Response(meminator_response.content, status=meminator_response.status_code, content_type=meminator_response.headers.get('content-type'))

        return flask_response

if __name__ == '__main__':
    app.run(debug=True, port=10114)
