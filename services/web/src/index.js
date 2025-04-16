// import { HoneycombWebSDK, WebVitalsInstrumentation } from '@honeycombio/opentelemetry-web';
// import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

// const sdk = new HoneycombWebSDK({
//     apiKey: process.env.HONEYCOMB_API_KEY,
//     serviceName: 'web',
//     instrumentations: [getWebAutoInstrumentations(), new WebVitalsInstrumentation()], // add automatic instrumentation
// });
// sdk.start();

// Function to extract user data from the user-info div
function getUserData() {
  const userInfoDiv = document.getElementById("user-info");
  if (!userInfoDiv) {
    console.warn("User info div not found");
    return { userId: "unknown", userName: "Anonymous User" };
  }

  const userId = userInfoDiv.getAttribute("data-user-id") || "unknown";
  const userName = userInfoDiv.getAttribute("data-user-name") || "Anonymous User";

  console.log(`Retrieved user data: ID=${userId}, Name=${userName}`);
  return { userId, userName };
}

function getPictureCreationSpanContext() {
  const storedTraceId = document.body.getAttribute("data-trace-id") || "unknown";
  const storedSpanId = document.body.getAttribute("data-span-id") || "unknown";

  // When being clever, make the actions clearer to your future self
  window.Hny.setAttributes({
    "picture.trace_id": storedTraceId,
    "picture.span_id": storedSpanId,
  });

  return {
    traceId: storedTraceId,
    spanId: storedSpanId,
  };
}

function recordPictureCreationSpanContext() {
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
}

// Function to fetch the image binary data from the server
async function fetchPicture() {
  try {
    // Start with the loading image
    document.getElementById("picture").style = "display:none";
    document.getElementById("loading-meme").style = "display:block";
    document.getElementById("message").innerText = "Generating meme...";
    document.getElementById("message").style = "display:block";

    resetFeedback();

    recordPictureCreationSpanContext();

    // Get user data from the user-info div
    const { userId, userName } = getUserData();

    // Call the Python backend-for-frontend service
    // OpenTelemetry will automatically handle trace propagation
    const response = await fetch("/backend/createPicture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Include user data in the request body
      body: JSON.stringify({
        userId: userId,
        userName: userName,
      }),
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
    document.getElementById("message").innerText = "There was an error fetching a picture. Please retry.";
    document.getElementById("message").style = "display:block;";
  }
}

function resetFeedback() {
  // Hide feedback and dimensions when loading a new image
  const feedbackElement = document.getElementById("feedback");
  feedbackElement.style = "display:none";

  // Reset the feedback box to its original state with rating buttons
  feedbackElement.innerHTML = `
        <div class="rating-options">
          <button id="thumbs-up" class="rating-button">
            <span class="emoji">🥰</span>
            <span class="label">Love it!</span>
          </button>
          <button id="thumbs-down" class="rating-button">
            <span class="emoji">😒</span>
            <span class="label">Not great</span>
          </button>
        </div>
      `;

  // Re-attach event listeners to the rating buttons
  setupRatingButtonListeners();
}

// Function to set up rating button event listeners
function setupRatingButtonListeners() {
  document.getElementById("thumbs-up").addEventListener("click", function () {
    submitRating("thumbs-up");
  });

  document.getElementById("thumbs-down").addEventListener("click", function () {
    submitRating("thumbs-down");
  });
}

// Add event listener to the GO button
document.getElementById("go").addEventListener("click", fetchPicture);

// Set up initial rating button listeners
setupRatingButtonListeners();

// Function to handle the rating submission
async function submitRating(rating) {
  console.log("User rating migh work this time:", rating);

  // Get the emoji for the rating
  const ratingEmoji = rating === "thumbs-up" ? "🥰" : "😒";

  // INSTRUMENTATION: Create a span that says what we're doing (more descriptive than 'click')
  // This syntax is specific to Jessitron's wrapper of the Honeycomb Web SDK
  // window.Hny.inChildSpan(
  //   "meminator-web",
  //   "submit-rating",
  //   undefined,
  //   (span) => { // OPEN CREATE OWN SPAN
  // span.setAttribute("rating.value", rating);
  // span.setAttribute("app.rating.emoji", ratingEmoji);

  fetch("/backend/rating", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rating: rating,
      ratingEmoji: ratingEmoji,
      ...getUserData(),
      pictureSpanContext: getPictureCreationSpanContext(),
    }),
  })
    .then((response) => {
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
    });
  //   } // CLOSE CREATE OWN SPAN
  // );
}
