import { Hono } from "@hono/hono";
import { stream } from '@hono/hono/streaming'
import { fetchFromService } from "./o11yday-lib.ts";
import { trace, SpanStatusCode } from "@opentelemetry/api";

const app = new Hono();
console.log(Deno.env.get("OTEL_DENO"))

app.get("/health", (c) => {
  return c.json({ message: "I am here", status_code: 200 });
});

app.get("/", (c) => {
  const span = trace.getActiveSpan();
  span?.setAttributes({ "app.phraseResponse": "phraseText", "app.imageResponse": "imageText" }); // INSTRUMENTATION: add relevant info to span
  return c.json({ message: "I am here", status_code: 200 });
});

app.post("/createPicture", async (c) => {
  const span = trace.getActiveSpan();
  try {
    const [phraseResponse, imageResponse] = await Promise.all([
      fetchFromService("phrase-picker"),
      fetchFromService("image-picker"),
    ]);
    const phraseText = phraseResponse.ok ? await phraseResponse.text() : "{}";
    const imageText = imageResponse.ok ? await imageResponse.text() : "{}";
    span?.setAttributes({ "app.phraseResponse": phraseText, "app.imageResponse": imageText }); // INSTRUMENTATION: add relevant info to span
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

    c.header("Content-Type", "image/png");

    return stream(c, async (stream) => {
      const reader = response?.body;
      await stream.pipe(reader!)
    })

  } catch (error) {
    span?.recordException(error as Error);
    span?.setStatus({ code: SpanStatusCode.ERROR }); // the instrumentation does this on a 500
    console.error("Error creating picture:", error);
    return c.text('This is terrible', 500)
  }
});

Deno.serve({ port: 10115 }, app.fetch);
