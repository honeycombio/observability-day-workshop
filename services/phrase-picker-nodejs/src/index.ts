import "./tracing"
import express, { Request, Response } from 'express';
import { trace, context } from '@opentelemetry/api';

const PHRASES = [
    "you're muted",
    "not dead yet",
    "Let them.",
    "Boiling Loves Company!",
    "Must we?",
    "SRE not-sorry",
    "Honeycomb at home",
    "There is no cloud",
    "This is fine",
    "It's a trap!",
    "Not Today",
    "You had one job",
    "bruh",
    "have you tried restarting?",
    "try again after coffee",
    "deploy != release"
]

const app = express();
const PORT = 10114; // You can change the port number as needed

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "I am here, ready to pick a phrase", status_code: 0 });
});

app.get('/phrase', async (req, res) => {
    const phrase = choose(PHRASES);
    trace.getActiveSpan()?.setAttributes({ "app.phrase": phrase });
    res.send({ phrase });
});

function choose<T>(array: T[]): T {
    const i = Math.floor(Math.random() * array.length);
    return array[i];
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
