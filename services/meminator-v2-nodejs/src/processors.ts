import { Response } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { Readable } from 'stream';
import sharp from 'sharp';

const tracer = trace.getTracer('');

export async function HandleImageProcessing(inputImageStream: Readable, res: Response, phrase: string): Promise<void> {
    tracer.startActiveSpan('HandleImageProcessing', async (span) => {
        try {
            span.setAttributes({ 'app.phrase': phrase });
            const inputBuffer: Buffer = await streamToBuffer(inputImageStream);

            const { data, info } = await sharp(inputBuffer)
                .resize(800, 800, { fit: 'inside' })
                .toBuffer({ resolveWithObject: true });

            const svgOverlay: Buffer = createSVGTextOverlay(phrase, info.width, info.height);
            
            const outputBuffer: Buffer = await sharp(data)
                .composite([{ input: svgOverlay, top: 0, left: 0 }])
                .png()
                .toBuffer();

            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(outputBuffer);
        } catch (error) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Error processing image' });
            res.writeHead(500).end('Internal Server Error');
        }
    span.end();
    });
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            tracer.startActiveSpan('streamToBuffer', async (span) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk as Buffer);
                span.addEvent('Data received');
            });
            stream.on('end', () => {
                resolve(Buffer.concat(chunks));
                span.end();
            });
            stream.on('error', (err) => {
                span.setStatus({ code: SpanStatusCode.ERROR, message: 'Error streaming to buffer' });
                reject(err);
                span.end();
            });
        });
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

