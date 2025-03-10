import express, { Request, Response } from "express";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { trace } from "@opentelemetry/api";

const app = express();
const PORT = process.env.PORT || 10118;

const BUCKET_NAME = process.env.BUCKET_NAME || "random-pictures";

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

app.get("/imageUrl", async (req: Request, res: Response) => {
  const s3Client = new S3Client({
    region: "us-east-1",
  });
  const input = {
    Bucket: BUCKET_NAME,
  };
  const command = new ListObjectsV2Command(input);
  const response = await s3Client.send(command);

  const images: string[] = [];
  if (response.Contents) {
    for await (const image of response.Contents) {
      images.push(image.Key as string);
    }
  }

  const randomImage = choose(images);
  trace.getActiveSpan()?.setAttributes({ "app.imageKey": randomImage });

  res.send({ imageKey: randomImage });
});

function choose<T>(array: T[]): T {
  const i = Math.floor(Math.random() * array.length);
  trace.getActiveSpan()?.setAttributes({
    "app.choiceIndex": i,
    "app.numberOfChoices": array.length,
  }); // INSTRUMENTATION: add relevant info
  return array[i];
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
