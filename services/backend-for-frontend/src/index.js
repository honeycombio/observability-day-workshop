"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = 3000; // You can change the port number as needed
// Middleware to parse JSON bodies
app.use(express_1.default.json());
app.get("/health", (req, res) => {
    res.send({ message: "I am here", status_code: 0 });
});
// POST endpoint for creating a picture
app.post('/createPicture', (req, res) => {
    // Replace this with your logic to generate or retrieve the image binary data
    const imageBinaryData = generateImageBinary();
    // Set appropriate headers for binary data
    res.setHeader('Content-Type', 'image/jpeg');
    // Set other headers if needed, like Content-Length, Cache-Control, etc.
    // Send the image binary data as response
    res.send(imageBinaryData);
});
// Function to generate image binary data (replace with your logic)
function generateImageBinary() {
    // Replace this with your logic to generate or retrieve the image binary data
    // For demonstration purposes, let's assume we're creating a simple image
    // Here we're creating a small blank JPEG image
    const width = 100;
    const height = 100;
    const channels = 3; // RGB
    const imageData = Buffer.alloc(width * height * channels);
    // Fill the buffer with white color
    imageData.fill(255);
    return imageData;
}
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
