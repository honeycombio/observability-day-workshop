import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NodeJsClient } from "@smithy/types";
import { Readable } from 'stream';


export async function DownloadFromS3(imageKey: string): Promise<Readable | undefined> {
    const s3 = new S3Client({ region: 'us-east-1' }) as NodeJsClient<S3Client>;
    const params = {
        Bucket: 'random-pictures',
        Key: imageKey
    };
    const command = new GetObjectCommand(params);
    const body = (await s3.send(command)).Body;
    return body;
}
