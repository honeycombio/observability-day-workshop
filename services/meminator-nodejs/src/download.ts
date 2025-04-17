import fs from "fs";
import { trace } from "@opentelemetry/api";
import crypto from "crypto";
import path from "path";

const DEFAULT_IMAGE_PATH = "../tmp/BusinessWitch.png";

/**
 * Download an image with a 5-second timeout. If it fails or times out, return a default image
 * that lives on the filesystem.
 * @param inputImageUrl URL of the image to download
 * @returns Path to the downloaded image or the default image if download fails
 */
export async function download(inputImageUrl: string): Promise<string> {
  const span = trace.getActiveSpan();
  if (!inputImageUrl) {
    throw new Error("No input image URL provided");
  }
  const downloadDestinationPath = `/tmp/${generateRandomFilename(path.extname(inputImageUrl))}`;

  // Set a timeout of 5 seconds for the fetch operation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  await fetch(inputImageUrl, {
    signal: controller.signal,
  })
    .then(async (download) => {
      // Clear the timeout since the request completed successfully
      clearTimeout(timeoutId);

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
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Determine if this was a timeout error
      const isTimeout = err.name === "AbortError";

      span?.recordException(err); // INSTRUMENTATION: record error conditions
      span?.setAttributes({
        error: true,
        "error.type": isTimeout ? "timeout" : "download_error",
        "warn.message": isTimeout ? "Image download timed out after 5 seconds" : "Image failed to download: " + err.message,
        "app.inputImageUrl": inputImageUrl,
        "app.default.imagePath": DEFAULT_IMAGE_PATH,
      });
      return path.join(__dirname, DEFAULT_IMAGE_PATH);
    });

  span?.setAttributes({
    "app.download.inputImageUrl": inputImageUrl,
    "app.download.downloadDestinationPath": downloadDestinationPath,
  });
  return downloadDestinationPath;
}

export function generateRandomFilename(extension: string): string {
  const dotExtension = extension.startsWith(".") ? extension : `.${extension}`;
  const randomBytes = crypto.randomBytes(16).toString("hex");
  return `${randomBytes}${dotExtension}`;
}
