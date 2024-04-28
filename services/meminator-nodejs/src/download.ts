import fs from 'fs';
import { trace } from '@opentelemetry/api';
import crypto from 'crypto';
import path from 'path';

const DEFAULT_IMAGE_PATH = '../tmp/BusinessWitch.png';

/**
 * Download an image. If it fails, return a default one that lives on the filesystem
 * @param inputImageUrl 
 * @param inputImagePath 
 * @param req 
 * @returns 
 */
export async function download(inputImageUrl: string): Promise<string> {
    // const span = trace.getActiveSpan();
    if (!inputImageUrl) {
       throw new Error('No input image URL provided');
    }
    const downloadDestinationPath = `/tmp/${generateRandomFilename(path.extname(inputImageUrl))}`;

    await fetch(inputImageUrl)
        .then(async (download) => {
            const dest = fs.createWriteStream(downloadDestinationPath);
            // ugh this is SO MESSY
            // node-fetch@2 makes this into a simpler pipe (see commit 8cd897a56c745)
            // but then there's no instrumentation argh
            if (download.body === null) {
                throw new Error(`Failed to fetch picture from meminator: ${download.status} ${download.statusText}`);
            }
            const reader = download.body.getReader();
            // Stream the chunks of the picture data to the response as they are received
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                dest.write(value);
            }
        })
        .catch((err: Error) => {
            // span?.recordException(err); // INSTRUMENTATION: record error conditions
            // span?.setAttributes({
            //     "warn.message": "Image failed to download: " + err.message,
            //     "app.inputImageUrl": inputImageUrl,
            //     "app.default.imagePath": DEFAULT_IMAGE_PATH,
            // });
            return path.join(__dirname, DEFAULT_IMAGE_PATH);
        });

    // span?.setAttributes({
    //     "app.download.inputImageUrl": inputImageUrl,
    //     "app.download.downloadDestinationPath": downloadDestinationPath,
    // });
    return downloadDestinationPath;
}

export function generateRandomFilename(extension: string): string {
    const dotExtension = extension.startsWith('.') ? extension : `.${extension}`;
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${randomBytes}${dotExtension}`;
}