import { Application } from "@oak/oak/application";
import { Router } from "@oak/oak/router";
import "./tracing.ts";
import { fetchFromService } from "./o11yday-lib.ts";
// import { trace, SpanStatusCode } from "@opentelemetry/api";

const router = new Router();
router.get("/health", (ctx) => {
  ctx.response.body = { message: "I am here", status_code: 0 };
});

router.post("/createPicture", async (ctx) => {
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

    ctx.response.headers.set("Content-Type", "image/png");
    // Read the response body as binary data
    const reader = response.body.getReader();
    // Stream the chunks of the picture data to the response as they are received
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      ctx.response.body = value;
    }
  } catch (error) {
    // span?.recordException(error as Error);
    // span?.setStatus({ code: SpanStatusCode.ERROR }); // the instrumentation does this on a 500
    console.error("Error creating picture:", error);
    ctx.response.status = 500;
    ctx.response.body = "This is terrible";
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());
app.listen({ port: 10115 });