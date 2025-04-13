// import { HoneycombWebSDK, WebVitalsInstrumentation } from '@honeycombio/opentelemetry-web';
// import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

// const sdk = new HoneycombWebSDK({
//     apiKey: process.env.HONEYCOMB_API_KEY,
//     serviceName: 'web',
//     instrumentations: [getWebAutoInstrumentations(), new WebVitalsInstrumentation()], // add automatic instrumentation
// });
// sdk.start();

// Function to fetch the image binary data from the server

async function fetchPicture() {
  try {
    // Start with the loading image
    document.getElementById("picture").style = "display:none";
    document.getElementById("loading-meme").style = "display:block";
    document.getElementById("message").innerText = "Generating meme...";
    document.getElementById("message").style = "display:block";

    // Hide feedback and dimensions when loading a new image
    document.getElementById("feedback").style = "display:none";

    // Hide dimensions display if it exists
    const dimensionsElement = document.getElementById("image-dimensions");
    if (dimensionsElement) {
      dimensionsElement.style = "display:none";
    }

    // Get the current trace ID and span ID from Honeycomb SDK
    let traceId = "unknown";
    let spanId = "unknown";
    try {
      const spanContext = window.Hny.activeSpanContext();
      if (spanContext) {
        console.log("Span context when hitting Go: ", spanContext);
        traceId = spanContext.traceId || "unknown";
        spanId = spanContext.spanId || "unknown";
      }

      // add them as data attributes to the body for later access
      document.body.setAttribute("data-trace-id", traceId);
      document.body.setAttribute("data-span-id", spanId);
      console.log(`Stored trace_id: ${traceId} and span_id: ${spanId} in body attributes`);
    } catch (error) {
      console.error("Error getting trace/span IDs:", error);
    }

    // Call the Python backend-for-frontend service
    // OpenTelemetry will automatically handle trace propagation
    const response = await fetch("/backend/createPicture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // later, send a user ID in the body
      // body: JSON.stringify({ /* any data you want to send */ })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch picture");
    }

    // Convert the binary response to a blob
    const blob = await response.blob();

    // Create a URL for the blob
    const imgUrl = URL.createObjectURL(blob);

    // Set the image source to the URL
    document.getElementById("loading-meme").style = "display:none";
    document.getElementById("message").style = "display:none";
    document.getElementById("picture").src = imgUrl;
    document.getElementById("picture").style = "display:block;";

    // Show the feedback form
    document.getElementById("feedback").style = "display:block";
  } catch (error) {
    console.error("Error fetching picture:", error);
    document.getElementById("loading-meme").style = "display:none";
    document.getElementById("picture").style = "display:none;";
    document.getElementById("feedback").style = "display:none";
    document.getElementById("message").innerText =
      "There was an error fetching a picture. Please retry.";
    document.getElementById("message").style = "display:block;";
  }
}

document.getElementById("go").addEventListener("click", fetchPicture);

// Function to handle the rating submission
async function submitRating(rating) {
  console.log("User rating migh work this time:", rating);

  // Create a span for the rating submission
  window.Hny.inChildSpan("meminator-web", "submit-rating", undefined, (span) => {
      span.setAttribute("rating.value", rating);

      // Get the trace ID and span ID from the body tag that was stored during picture fetch
      const storedTraceId = document.body.getAttribute("data-trace-id") || "unknown";
      const storedSpanId = document.body.getAttribute("data-span-id") || "unknown";

      // Add them as span attributes for better tracing
      span.setAttribute("picture.trace_id", storedTraceId);
      span.setAttribute("picture.span_id", storedSpanId);
      console.log(`Using stored trace_id: ${storedTraceId} and span_id: ${storedSpanId} for rating`);

      // Send the rating to the backend
      // Include the stored trace ID in the request body
      // OpenTelemetry will still handle trace propagation automatically
      fetch("/backend/rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rating: rating,
          pictureTraceId: storedTraceId,
          pictureSpanId: storedSpanId
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to submit rating");
        }
        return response.json();
      })
      .then(() => {
        // Show thank you message
        document.getElementById("feedback").innerHTML = `
        <p>Thanks for your feedback!</p>
        <p>You rated this meme: ${rating === "thumbs-up" ? "👍" : "👎"}</p>
        `;
      })
  });
}

// Add event listeners for the rating buttons
document
  .getElementById("thumbs-up")
  .addEventListener("click", () => submitRating("thumbs-up"));
document
  .getElementById("thumbs-down")
  .addEventListener("click", () => submitRating("thumbs-down"));
