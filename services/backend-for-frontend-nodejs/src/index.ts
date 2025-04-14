import "./tracing";
import express from "express";
import type { Request, Response } from "express";
import { fetchFromService } from "./o11yday-lib";
import {
  trace,
  SpanStatusCode,
  context,
  SpanContext,
  SpanKind,
} from "@opentelemetry/api";

const app = express();
const PORT = 10115;
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send({ message: "I am here", status_code: 0 });
});

app.post("/createPicture", async (req: Request, res: Response) => {
  // const span = trace.getActiveSpan();
  try {
    const [phraseResponse, imageResponse] = await Promise.all([
      fetchFromService("phrase-picker"),
      fetchFromService("image-picker"),
    ]);
    const phraseText = phraseResponse.ok ? await phraseResponse.text() : "{}";
    const imageText = imageResponse.ok ? await imageResponse.text() : "{}";
    //    span?.setAttributes({ "app.phraseResponse": phraseText, "app.imageResponse": imageText }); // INSTRUMENTATION: add relevant info to span
    const phraseResult = JSON.parse(phraseText);
    const imageResult = JSON.parse(imageText);

    const response = await fetchFromService("meminator", {
      method: "POST",
      body: {
        ...phraseResult,
        ...imageResult,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch picture from meminator: ${response.status} ${response.statusText}`
      );
    }
    if (response.body === null) {
      throw new Error(
        `Failed to fetch picture from meminator: ${response.status} ${response.statusText}`
      );
    }

    res.contentType("image/png");
    // Read the response body as binary data
    const reader = response.body.getReader();
    // Stream the chunks of the picture data to the response as they are received
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      res.write(value);
    }
    res.end();
  } catch (error) {
    // span?.recordException(error as Error);
    // span?.setStatus({ code: SpanStatusCode.ERROR }); // the instrumentation does this on a 500
    console.error("Error creating picture:", error);
    res.status(500).send("This is terrible");
  }
});

const tracer = trace.getTracer("report-rating");

// Rating endpoint to handle user ratings
app.post("/rating", (req: Request, res: Response) => {
  const ratingData = req.body;
  const currentSpan = trace.getActiveSpan();

  // Set rating attributes on current span
  if (currentSpan && ratingData && ratingData.rating) {
    currentSpan.setAttribute("app.rating", ratingData.rating);
    if (ratingData.ratingEmoji) {
      currentSpan.setAttribute("app.rating.emoji", ratingData.ratingEmoji);
    }
  }

  // Create a special span that is attached to the picture-creation trace
  if (!ratingData || !ratingData.pictureSpanContext) {
    res.status(400).json({
      status: "error",
      message: "Missing pictureSpanContext in request body",
    });
  }

  const traceIdHex = ratingData.pictureSpanContext.traceId;
  const spanIdHex = ratingData.pictureSpanContext.spanId;

  const specialContext = trace.setSpanContext(context.active(), {
    traceId: traceIdHex,
    spanId: spanIdHex,
    isRemote: true,
    traceFlags: 1, // Sampled
  });

  // Create a span in the context of the picture's trace
  const specialSpan = tracer.startSpan(
    "user rating",
    {
      attributes: {
        "app.rating": ratingData.rating,
        "app.rating.emoji": ratingData.ratingEmoji,
      },
    },
    specialContext
  );
  specialSpan.end();

  res.json({ status: "success" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
