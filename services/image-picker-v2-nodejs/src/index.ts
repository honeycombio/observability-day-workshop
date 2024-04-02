import express, { Request, Response } from 'express';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { trace } from '@opentelemetry/api';

const app = express();
const PORT = process.env.PORT || 10114; // You can change the port number as needed

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send("OK");
});

app.get('/imageUrl', async (req: Request, res: Response) => {
    const s3Client = new S3Client({ region: 'us-east-1' });
    const input = {
        Bucket: 'random-pictures',
    }
    const command = new ListObjectsV2Command(input);
    const response = await s3Client.send(command);

    const images: string[] = [];
    if (response.Contents) {
        for await (const image of response.Contents) {
            images.push(image.Key as string);
        }
    }

    const randomIndex = Math.floor(Math.random() * images.length);
    trace.getActiveSpan()?.setAttributes({ "app.choiceIndex": randomIndex, "app.numberOfChoices": images.length });
    const randomImage = images[randomIndex];
    trace.getActiveSpan()?.setAttributes({ "app.imageKey": randomImage });

    res.send({ imageKey: randomImage });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
