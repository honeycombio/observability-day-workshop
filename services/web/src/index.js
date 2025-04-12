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
      // Access the current active span from the global Honeycomb SDK
      if (window.Hny) {
        // Try different methods to get the trace context
        console.log("Honeycomb SDK available");

        // Method 1: Try to use inSpan to get the current span
        if (typeof window.Hny.inSpan === "function") {
          window.Hny.inSpan({ name: "get-trace-id" }, (span) => {
            // Log the span object to see what's available
            console.log("Current span:", span);

            // Try to extract the trace ID from the span
            if (span && span.spanContext) {
              traceId = span.spanContext.traceId || "unknown";
              console.log("Extracted trace ID from span:", traceId);
            }
          });
        }

        // Method 2: Try to access the active span directly
        if (window.Hny._tracer && window.Hny._tracer.getCurrentSpan) {
          const currentSpan = window.Hny._tracer.getCurrentSpan();
          console.log("Current span from _tracer:", currentSpan);

          if (currentSpan && currentSpan.spanContext) {
            traceId = currentSpan.spanContext.traceId || "unknown";
            console.log("Extracted trace ID from _tracer:", traceId);
          }
        }

        // Store the trace ID if we found one
        if (traceId !== "unknown") {
          // Store the trace ID in localStorage for the e2e test to access
          localStorage.setItem("currentTraceId", traceId);

          // Also add it as a data attribute to the body for easier access
          document.body.setAttribute("data-trace-id", traceId);
        } else {
          console.warn("Could not extract trace ID from Honeycomb SDK");
        }
      } else {
        console.warn("Honeycomb SDK not available");
      }
    } catch (error) {
      console.error("Error accessing trace context:", error);
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
  } catch (error) {
    console.error("Error fetching picture:", error);
    document.getElementById("loading-meme").style = "display:none";
    document.getElementById("picture").style = "display:none;";
    document.getElementById("message").innerText =
      "There was an error fetching a picture. Please retry.";
    document.getElementById("message").style = "display:block;";
  }
}

document.getElementById("go").addEventListener("click", fetchPicture);
