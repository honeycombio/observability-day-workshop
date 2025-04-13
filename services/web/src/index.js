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

    // Get the current trace ID from Honeycomb SDK
    let traceId = "unknown";
    try {
      const spanContext = window.Hny.activeSpanContext();
      if (spanContext) {
        console.log("Span context when hitting Go: ", spanContext);
        traceId = spanContext.traceId || "unknown";
      }

      // add it as a data attribute to the body for the e2e test to access
      document.body.setAttribute("data-trace-id", traceId);
    } catch (error) {
      console.error("Error getting trace ID:", error);
    }

    const response = await fetch("/backend/createPicture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Optionally, you can send data in the request body if needed
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
  console.log("User rating:", rating);

  // Create a span for the rating submission
  window.Hny.inChildSpan("submit-rating", (span) => {
    try {
      span.setAttribute("rating.value", rating);

      // Here you would typically send the rating to the server
      // For now, we'll just log it and show a thank you message
      document.getElementById("feedback").innerHTML = `
      <p>Thanks for your feedback!</p>
      <p>You rated this meme: ${rating === "thumbs-up" ? "👍" : "👎"}</p>
      `;
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("There was an error submitting your rating. Please try again.");
    }
  });
}

// Add event listeners for the rating buttons
document
  .getElementById("thumbs-up")
  .addEventListener("click", () => submitRating("thumbs-up"));
document
  .getElementById("thumbs-down")
  .addEventListener("click", () => submitRating("thumbs-down"));
