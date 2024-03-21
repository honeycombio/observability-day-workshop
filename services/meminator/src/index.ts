import "./tracing"
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { trace } from '@opentelemetry/api';
import { spawn } from 'child_process';

const app = express();
const PORT = 3000; // You can change the port number as needed

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "I am here, ready to meminate", status_code: 0 });
});

// const magickProcess = spawn('convert', [inputImagePath, '-gravity', 'center', '-pointsize', '36', '-fill', 'white', '-annotate', '0', phrase, outputImagePath]);
// convert tmp/BusinessWitch.png -gravity center -pointsize 36 -fill white -annotate 0 "Business Witch" output.png

/*
convert tmp/BusinessWitch.png -fill white -undercolor '#00000080' -gravity North -font "Times-Roman" -weight bold -annotate +0+10 "DO THE THING" \
    output_image.jpg
    */

console.log("I am a booger");

app.get('/applyPhraseToPicture', (req, res) => {
    const inputImagePath = '../tmp/BusinessWitch.png';
    const outputImagePath = `/tmp/${generateRandomFilename('png')}`;
    trace.getActiveSpan()?.setAttributes({ "app.dirname2": __dirname, "app.inputImagePath": inputImagePath, "app.outputImagePath": outputImagePath });
    const imagePath = path.join(__dirname, inputImagePath); // Path to your .png file
    // Check if the file exists
    const phrase = 'Hello, World!'.toLocaleUpperCase();

    trace.getTracer('meminator').startActiveSpan('convert', (span) => {

        // Spawn ImageMagick process to add text to the image
        const magickProcess = spawn('convert', [imagePath,
            '-gravitypoo', 'North',
            '-pointsize', '48',
            '-fill', 'white',
            '-undercolor', '#00000080',
            '-weight', 'bold',
            '-font', '"Times-Roman"',
            '-annotate', '0', phrase,
            outputImagePath]);

        // Handle ImageMagick process events
        magickProcess.on('error', (error) => {
            console.error('Error running ImageMagick:', error);
            trace.getActiveSpan()?.recordException(error);
            span.end();
            res.status(500).send('Failed to even try');
        });

        let stderrOutput = '';
        magickProcess.stderr.on('data', (data) => {
            stderrOutput += data; // Append the data chunk to the stderrOutput string
        });

        let stdout = '';
        magickProcess.stdout.on('data', (data) => {
            stdout += data;
        });

        magickProcess.on('close', (code) => {
            trace.getActiveSpan()?.setAttributes({ 'app.doesThisWork': 'sort of' });
            span.setAttribute('app.howAboutThis', 'yes');
            span.setAttributes({ 'app.imagemagick.stderr': stderrOutput, 'app.imagemagick.stdout': stdout, 'app.imagemagick.exitCode': code || 0 });
            if (code !== 0) {
                console.error('ImageMagick process exited with non-zero code:', code);
                span.end();
                res.status(503).send('image creation faillllled');
            } else {
                // Send the resulting image as the response
                res.contentType('image/png');
                span.end();
                res.sendFile(outputImagePath);
            }
        });

    });
})

import crypto from 'crypto';

function generateRandomFilename(extension: string): string {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${randomBytes}.${extension}`;
}


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
