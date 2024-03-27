// import { HoneycombWebSDK, WebVitalsInstrumentation } from '@honeycombio/opentelemetry-web';
// import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

// const sdk = new HoneycombWebSDK({
//     apiKey: process.env.HONEYCOMB_API_KEY,
//     serviceName: 'web',
//     instrumentations: [getWebAutoInstrumentations(), new WebVitalsInstrumentation()], // add automatic instrumentation
// });
// sdk.start();

// Function to fetch the image binary data from the server
async function fetchPicture() {
    try {
        const response = await fetch('/backend/createPicture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Optionally, you can send data in the request body if needed
            // body: JSON.stringify({ /* any data you want to send */ })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch picture');
        }

        // Convert the binary response to a blob
        const blob = await response.blob();

        // Create a URL for the blob
        const imgUrl = URL.createObjectURL(blob);

        // Set the image source to the URL
        document.getElementById('picture').src = imgUrl;
    } catch (error) {
        console.error('Error fetching picture:', error);
    }
}

document.getElementById('go').addEventListener('click', fetchPicture);