import "./tracing"
import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000; // You can change the port number as needed

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "I am here, ready to pick a phrase", status_code: 0 });
});

app.post('/phrase', async (req, res) => {
    res.send({ phrase: "your mother was a lizard!" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
