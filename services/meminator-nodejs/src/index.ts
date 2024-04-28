import "./tracing"
import express, { Request, Response } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { download } from "./download";
import { applyTextWithImagemagick } from "./applyTextWithImagemagick";
import { applyTextWithLibrary } from "./applyTextWithLibrary";
import { FeatureFlags } from "./featureFlags";
import path from 'path';

const app = express();
const PORT = 10114;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send("OK");
});

app.post('/applyPhraseToPicture', async (req, res) => {
    const span = trace.getActiveSpan();
    try {
        const input = req.body;
        let { phrase: inputPhrase, imageUrl } = input;
        span?.setAttributes({ // INSTRUMENTATION: record important things
            "app.meminator.phrase": inputPhrase, "app.meminator.imageUrl": imageUrl,
            "app.meminator.imageExtension": imageUrl ? path.extname(imageUrl) : "none"
        });
        const phrase = inputPhrase.toLocaleUpperCase();

        // download the image, defaulting to a local image
        const inputImagePath = await download(imageUrl);

        if (new FeatureFlags().useLibrary()) {
            const outputImagePath = await applyTextWithImagemagick(phrase, inputImagePath);
            res.sendFile(outputImagePath);
        } else {
            const outputBuffer = await applyTextWithLibrary(inputImagePath, phrase);
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(outputBuffer);
        }
    }
    catch (error) {
        span?.recordException(error as Error); // INSTRUMENTATION: record exceptions. This will someday happen automatically in express instrumentation
        span?.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
        console.error('Error creating picture:', error);
        res.status(500).send('Internal Server Error');
    }
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
