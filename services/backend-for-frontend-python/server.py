from flask import Flask, jsonify, Response, request, render_template_string
from internal_library import fetch_from_service
from opentelemetry import trace

print("I am the backend-for-frontend, in python!")

app = Flask(__name__)

# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here", "status_code": 0})

@app.route('/createPicture', methods=['POST'])
def create_picture():
    current_span = trace.get_current_span() # INSTRUMENTATION: pull the current span out of thin air
    input = request.json
    current_span.set_attribute("user.id", input["userId"])
    current_span.set_attribute("user.name", input["userName"])

    phrase_response = fetch_from_service('phrase-picker')
    image_response = fetch_from_service('image-picker')

    phrase_result = phrase_response.json() if phrase_response and phrase_response.ok else {"phrase": "This is sparta"}
    image_result = image_response.json() if image_response and image_response.ok else {"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg"}
    current_span.set_attribute("app.phrase", phrase_result['phrase']) # INSTRUMENTATION: add the mose important attributes from the trace
    current_span.set_attribute("app.image_url", image_result['imageUrl'])

    body = {**phrase_result, **image_result}
    meminator_response = fetch_from_service('meminator', method="POST", body=body)

    if meminator_response.content is None:
        current_span.set_attribute("error", True)
        current_span.set_attribute("error.message", "Failed to fetch picture from meminator")
        return Response("Failed to fetch picture from meminator", status=500)

    flask_response = Response(meminator_response.content, status=meminator_response.status_code, content_type=meminator_response.headers.get('content-type'))

    return flask_response

special_tracer = trace.get_tracer("report-rating")

@app.route('/rating', methods=['POST'])
def submit_rating():
    rating_data = request.json
    current_span = trace.get_current_span()

    # Set rating attributes on current span
    if current_span and rating_data and 'rating' in rating_data:
        current_span.set_attribute("app.rating", rating_data['rating'])
        if 'ratingEmoji' in rating_data:
            current_span.set_attribute("app.rating.emoji", rating_data['ratingEmoji'])

    # Watch out, this part is clever.
    # Create a special span that is attached to the picture-creation trace.
    if not rating_data or 'pictureSpanContext' not in rating_data:
        return jsonify({"status": "warning", "message": "Missing pictureSpanContext in request body"})

    trace_id_int = int(rating_data['pictureSpanContext']['traceId'], 16)
    span_id_int = int(rating_data['pictureSpanContext']['spanId'], 16)
    special_context = trace.set_span_in_context(
            trace.NonRecordingSpan(
                trace.SpanContext(
                    # trace an span ids are encoded in hex, so must be converted
                    trace_id=trace_id_int,
                    span_id=span_id_int,
                    is_remote=True,
                    trace_flags=trace.TraceFlags(trace.TraceFlags.SAMPLED),
                    trace_state=trace.TraceState(),
                )
            ))
    specialSpan = special_tracer.start_span("user rating", context=special_context) # TODO: add a span link to the current span
    specialSpan.set_attribute("app.rating", rating_data['rating'])
    if 'ratingEmoji' in rating_data:
        specialSpan.set_attribute("app.rating.emoji", rating_data['ratingEmoji'])
    specialSpan.end()

    return jsonify({"status": "success"})

# Default user data in case the service is unavailable
default_user = {
    "id": "0",
    "name": "Anonymous User",
    "avatarUrl": "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
}

@app.route('/user-info', methods=['GET'])
def user_info():

    # Fetch user data from user-service
    user_response = fetch_from_service('user-service')

    # Parse the user data from the response
    user_data = user_response.json() if user_response and user_response.ok else default_user

    # INSTRUMENTATION: add what matters to the current span
    # current_span = trace.get_current_span()
    # current_span.set_attribute("app.fallback_activated", not(user_response and user_response.ok))
    # current_span.set_attribute("user.id", user_data.get("id", "missing"))
    # current_span.set_attribute("user.name", user_data.get("name", "missing"))

    # HTML template for the user info
    user_info_template = '''
    <div class="user-info" id="user-info" data-user-id="{{ user_id }}" data-user-name="{{ user_name }}">
      <a href="https://commons.wikimedia.org/wiki/Famous_portraits">
        <img id="user-avatar" src="{{ avatar_url }}" alt="User Avatar" class="user-avatar">
      </a>
      <span id="user-name" class="user-name">{{ user_name }}</span>
    </div>
    '''

    # Return the rendered template with user data
    return render_template_string(
        user_info_template,
        user_id=user_data.get("id", default_user["id"]),
        user_name=user_data.get("name", default_user["name"]),
        avatar_url=user_data.get("avatarUrl", default_user["avatarUrl"])
    )

if __name__ == '__main__':
    app.run(debug=True, port=10115)
