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
    const pictureElement = document.getElementById("picture");
    pictureElement.src = imgUrl;
    pictureElement.style = "display:block;";

    // Add event listener to get image dimensions after it loads
    pictureElement.onload = function () {
      const width = this.naturalWidth;
      const height = this.naturalHeight;
      console.log(`Image dimensions: ${width}x${height}`);

      // Create or update dimensions display
      let dimensionsElement = document.getElementById("image-dimensions");
      if (!dimensionsElement) {
        dimensionsElement = document.createElement("div");
        dimensionsElement.id = "image-dimensions";
        dimensionsElement.style =
          "margin-top: 10px; font-size: 0.9rem; color: #aaa;";
        pictureElement.parentNode.insertBefore(
          dimensionsElement,
          document.getElementById("feedback")
        );
      }
      dimensionsElement.textContent = `Image dimensions: ${width}x${height} pixels`;
    };

    // Show the feedback form
    document.getElementById("feedback").style = "display:block";
  } catch (error) {
    console.error("Error fetching picture:", error);
    document.getElementById("loading-meme").style = "display:none";
    document.getElementById("picture").style = "display:none;";
    document.getElementById("feedback").style = "display:none";

    // Hide dimensions display if it exists
    const dimensionsElement = document.getElementById("image-dimensions");
    if (dimensionsElement) {
      dimensionsElement.style = "display:none;";
    }

    document.getElementById("message").innerText =
      "There was an error fetching a picture. Please retry.";
    document.getElementById("message").style = "display:block;";
  }
}

document.getElementById("go").addEventListener("click", fetchPicture);

// Function to handle the rating submission
async function submitRating(rating) {
  console.log("User rating:", rating);

  try {
    // Create a span for the rating submission
    const span = window.Hny.startSpan("submit-rating");
    span.setAttribute("rating.value", rating);

    // Here you would typically send the rating to the server
    // For now, we'll just log it and show a thank you message
    document.getElementById("feedback").innerHTML = `
      <p>Thanks for your feedback!</p>
      <p>You rated this meme: ${rating === "thumbs-up" ? "👍" : "👎"}</p>
    `;

    span.end();
  } catch (error) {
    console.error("Error submitting rating:", error);
    alert("There was an error submitting your rating. Please try again.");
  }
}

// Add event listeners for the rating buttons
document
  .getElementById("thumbs-up")
  .addEventListener("click", () => submitRating("thumbs-up"));
document
  .getElementById("thumbs-down")
  .addEventListener("click", () => submitRating("thumbs-down"));
