from flask import Flask, jsonify, Response, request
from o11yday_lib import fetch_from_service
from opentelemetry import trace
from opentelemetry.trace import SpanKind

print("I am the backend-for-frontend!")

app = Flask(__name__)

# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here", "status_code": 0})

@app.route('/createPicture', methods=['POST'])
def create_picture():
        # current_span = trace.get_current_span() # INSTRUMENTATION: pull the current span out of thin air
        phrase_response = fetch_from_service('phrase-picker')
        image_response = fetch_from_service('image-picker')

        phrase_result = phrase_response.json() if phrase_response and phrase_response.ok else {"phrase": "This is sparta"}
        image_result = image_response.json() if image_response and image_response.ok else {"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg"}
        # current_span.set_attribute("app.phrase", phrase_result['phrase']) # INSTRUMENTATION: add the mose important attributes from the trace
        # current_span.set_attribute("app.image_url", image_result['imageUrl'])

        body = {**phrase_result, **image_result}
        meminator_response = fetch_from_service('meminator', method="POST", body=body)

        if not meminator_response.ok or meminator_response.content is None:
            raise Exception(f"Failed to fetch picture from meminator: {meminator_response.status_code} {meminator_response.reason}")

        flask_response = Response(meminator_response.content, status=meminator_response.status_code, content_type=meminator_response.headers.get('content-type'))

        return flask_response

@app.route('/rating', methods=['POST'])
def submit_rating():
    rating_data = request.json
    current_span = trace.get_current_span()

    # Set rating attribute on current span
    if current_span and rating_data and 'rating' in rating_data:
        current_span.set_attribute("app.rating", rating_data['rating'])

    # Check if we have picture trace and span IDs
    if rating_data and 'pictureTraceId' in rating_data and 'pictureSpanId' in rating_data:
        try:
            # Get the tracer
            tracer = trace.get_tracer(__name__)

            # Log the received trace and span IDs
            picture_trace_id = rating_data['pictureTraceId']
            picture_span_id = rating_data['pictureSpanId']
            print(f"Received picture trace_id: {picture_trace_id} and span_id: {picture_span_id}")

            # Create a span in the context of the picture's trace
            # Note: In a real implementation, we would use the trace context to create a span
            # in the same trace as the picture. However, for this example, we'll create a span
            # in the current trace and link it to the picture's trace via attributes.
            with tracer.start_as_current_span(
                "rating-received",
                kind=SpanKind.SERVER
            ) as rating_span:
                # Add attributes to link this span to the picture's trace
                rating_span.set_attribute("picture.trace_id", picture_trace_id)
                rating_span.set_attribute("picture.span_id", picture_span_id)
                rating_span.set_attribute("rating.value", rating_data['rating'])
                rating_span.set_attribute("rating.source", "backend-for-frontend-python")

                # Log that we created a span
                print(f"Created rating span with picture trace_id: {picture_trace_id} and span_id: {picture_span_id}")
        except Exception as e:
            print(f"Error creating span in picture trace context: {e}")

    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=10115)
