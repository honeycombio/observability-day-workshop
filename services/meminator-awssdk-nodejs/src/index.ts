import express, { Request, Response } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';

import {HandleImageProcessing} from './imageProcessing';
import { DownloadFromS3 } from './downloader';

const app = express();
const PORT = process.env.PORT || 10116;

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send("OK");
});

app.post('/applyPhraseToPicture', async (req, res) => {
    const span = trace.getActiveSpan();
    const input = req.body;
    let { phrase: inputPhrase, imageKey } = input;
    span?.setAttributes({ 'app.phrase': inputPhrase, 'app.imageKey': imageKey });
    const phrase = inputPhrase.toLocaleUpperCase();

    const inputImageStream = await DownloadFromS3(imageKey);
    span?.addEvent('Downloaded image from S3');
    if (!inputImageStream) {
        span?.setStatus({ code: SpanStatusCode.ERROR, message: 'Failed to download image from S3' });
        throw new Error('Failed to download image from S3.');
    }
    await HandleImageProcessing(inputImageStream, res, phrase)
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});