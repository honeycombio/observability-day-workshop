import "./tracing"
import express, { Request, Response } from 'express';
import { trace, context } from '@opentelemetry/api';


// aws s3 ls s3://random-pictures | awk '{print "\"" $NF "\","}'
const IMAGES = [
    "grass-and-desert-guy.png",
    "symmathesy.png",].map((filename) => `https://random-pictures.s3.amazonaws.com/${filename}`);

const app = express();
const PORT = 3000; // You can change the port number as needed

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "I am here, ready to pick an image", status_code: 0 });
});

app.get('/imageUrl', async (req, res) => {
    const imageUrl = choose(IMAGES);
    trace.getActiveSpan()?.setAttributes({ "app.imageUrl": imageUrl });
    res.send({ imageUrl });
});

function choose<T>(array: T[]): T {
    const i = Math.floor(Math.random() * array.length);
    return array[i];
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
