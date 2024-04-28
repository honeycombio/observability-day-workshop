import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NodeJsClient } from "@smithy/types";
import { Readable } from 'stream';

const BUCKET_NAME = process.env.BUCKET_NAME || 'random-pictures';

export async function DownloadFromS3(imageKey: string): Promise<Readable | undefined> {
    const s3 = new S3Client({ region: 'us-east-1' }) as NodeJsClient<S3Client>;
    const params = {
        Bucket: BUCKET_NAME,
        Key: imageKey
    };
    const command = new GetObjectCommand(params);
    const body = (await s3.send(command)).Body;
    return body;
}
