import fs from 'fs';
import { trace } from '@opentelemetry/api';
import crypto from 'crypto';
import path from 'path';
import fetch from 'node-fetch'

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
        .then(async (res) => {
            const dest = fs.createWriteStream(downloadDestinationPath);
            res.body.pipe(dest);
            return new Promise((resolve, reject) => {
                dest.on('finish', () => resolve(downloadDestinationPath));
                dest.on('error', reject);
            });
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