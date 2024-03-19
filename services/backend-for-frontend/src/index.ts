import "./tracing"
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { trace } from '@opentelemetry/api';

const app = express();
const PORT = 3000; // You can change the port number as needed

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "I am here", status_code: 0 });
});

app.get('/createPicture', (req, res) => {
    trace.getActiveSpan()?.setAttributes({ "app.dirname": __dirname, "app.filePath": 'tmp/BusinessWitch.png' });
    const imagePath = path.join(__dirname, 'tmp/BusinessWitch.png'); // Path to your .png file
    // Check if the file exists
    if (fs.existsSync(imagePath)) {
        // Read the file and send it as the response
        fs.readFile(imagePath, (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                trace.getActiveSpan()?.recordException(err); // TODO: add during the workshop
                res.status(500).send('Internal Server Error');
            } else {
                // Set the appropriate content type for a .png file
                res.contentType('image/png');
                res.send(data);
            }
        });
    } else {
        // If the file does not exist, send a 404 Not Found response
        console.log("404")
        res.status(404).send('File not found');
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
