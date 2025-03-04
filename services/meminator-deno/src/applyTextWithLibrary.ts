import { Response } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { Readable } from 'stream';
import sharp from 'sharp';
import fs from 'fs';

const tracer = trace.getTracer('');

export async function applyTextWithLibrary(imageFilepath: string, phrase: string): Promise<Buffer> {
    return tracer.startActiveSpan('HandleImageProcessing', async (span) => {
        try {
            span.setAttributes({ 'app.phrase': phrase });
            span.setAttribute('app.imageFilepath', imageFilepath);
            const inputBuffer: Buffer = await fs.promises.readFile(imageFilepath);

            const { data, info } = await sharp(inputBuffer)
                .resize(800, 800, { fit: 'inside' })
                .toBuffer({ resolveWithObject: true });

            const svgOverlay: Buffer = createSVGTextOverlay(phrase, info.width, info.height);

            const outputBuffer: Buffer = await sharp(data)
                .composite([{ input: svgOverlay, top: 0, left: 0 }])
                .png()
                .toBuffer();
            span.end();
            return outputBuffer
        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Error processing image' });
            span.end();
            throw error;
        }
    });
}

// Function to create SVG text overlay
function createSVGTextOverlay(text: string, width: number, height: number): Buffer {
    const span = tracer.startSpan('createSVGTextOverlay');
    const fontSize = 72;
    const textWidth = width * 0.9; // Target width for the text, 90% of the container width

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <text x="50%" y="25%" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}px" font-weight="bold" style="fill: white; stroke: black; stroke-width: 4;" font-family="Noto" fill="white" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs">${text}</text>
                 </svg>`;
    span.addEvent('SVG created', { 'app.svg.data': svg });
    span.end();
    return Buffer.from(svg);
}

