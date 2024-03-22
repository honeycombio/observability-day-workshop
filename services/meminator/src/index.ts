import "./tracing"
import express, { Request, Response } from 'express';
import path from 'path';
import { trace, SpanStatusCode } from '@opentelemetry/api';
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

const DEFAULT_PHRASE = "lizardlips";

app.post('/applyPhraseToPicture', async (req, res) => {
    try {
        const input = req.body;
        trace.getActiveSpan()?.setAttributes({ "app.input": JSON.stringify(input) });
        let inputPhrase = input.phrase;
        if (!inputPhrase) {
            trace.getActiveSpan()?.setAttributes({
                "warn.message": "No phrase provided",
                "app.default.phrase": DEFAULT_PHRASE,
                "app.body": JSON.stringify(req.body)
            });
            inputPhrase = DEFAULT_PHRASE;
        }
        const phrase = inputPhrase.toLocaleUpperCase();

        const inputImagePath = '../tmp/BusinessWitch.png';
        const outputImagePath = `/tmp/${generateRandomFilename('png')}`;
        trace.getActiveSpan()?.setAttributes({
            "app.phrase": phrase, "app.inputPhrase": inputPhrase,
            "app.dirname": __dirname, "app.inputImagePath": inputImagePath, "app.outputImagePath": outputImagePath
        });
        const imagePath = path.join(__dirname, inputImagePath);

        const args = [imagePath,
            '-gravity', 'North',
            '-pointsize', '48',
            '-fill', 'white',
            '-undercolor', '#00000080',
            '-font', 'Angkor-Regular',
            '-annotate', '0', `${phrase}`,
            outputImagePath];

        await spawnProcess('convert', args);
        res.sendFile(outputImagePath);
    }
    catch (error) {
        trace.getActiveSpan()?.recordException(error as Error);
        trace.getActiveSpan()?.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
        console.error('Error creating picture:', error);
        res.status(500).send('Internal Server Error');
    }
})

import crypto from 'crypto';

function generateRandomFilename(extension: string): string {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${randomBytes}.${extension}`;
}

function spawnProcess(commandName: string, args: string[]): Promise<void> {
    return trace.getTracer('meminator').startActiveSpan(commandName, {
        attributes: {
            "app.command.name": commandName,
            "app.command.args": args.join(' ')
        }
    }, (span) => {
        return new Promise<void>((resolve, reject) => {
            const process = spawn(commandName, args);
            let stderrOutput = '';
            process.stderr.on('data', (data) => {
                stderrOutput += data;
            });

            let stdout = '';
            process.stdout.on('data', (data) => {
                stdout += data;
            });

            process.on('error', (error) => {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                span.end();
                reject(error);
            });

            process.on('close', (code) => {
                span.setAttributes({
                    'app.command.exitCode': code || 0,
                    'app.command.stderr': stderrOutput,
                    'app.command.stdout': stdout
                });
                if (code !== 0) {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: "Process exited with " + code });
                    span.end();
                    reject(new Error(`Process exited with non-zero code: ${code}`));
                } else {
                    span.end();
                    resolve();
                }
            });
        });
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
