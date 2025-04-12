# Meminator Workshop Scripts

This directory contains utility scripts for the Meminator Workshop.

## End-to-End Test Script

The `e2e-test.sh` script performs an end-to-end test of the Meminator application, including verifying that distributed tracing is working correctly in Honeycomb.

### Prerequisites

- Docker must be installed and running
- Node.js must be installed (for Playwright)
- The Meminator application must be built (the script will start it if not already running)

### Usage

```bash
# Set your Honeycomb API key
export HONEYCOMB_API_KEY=your_api_key

# Run the end-to-end test
./scripts/e2e-test.sh
```

### What the Script Does

1. Checks if Docker and Node.js are installed
2. Starts the application if it's not already running
3. Sets up a temporary environment for Playwright
4. Uses a headless browser to:
   - Navigate to the web interface
   - Take a screenshot before clicking the GO button
   - Click the GO button
   - Extract the trace ID from the traceparent header
   - Wait for the meme image to load
   - Take a screenshot after the image loads
   - Verify the image is displayed correctly
5. Validates the distributed trace in Honeycomb:
   - Queries the Honeycomb API for all spans in the trace
   - Verifies that all expected services contributed spans
   - Counts the number of spans per service
   - Fails if any expected service is missing
6. Provides a direct link to the trace in Honeycomb UI

### Troubleshooting

If the script fails, it will provide an error message indicating what went wrong. Common issues include:

- Docker not running
- Node.js not installed or too old (Node.js 14+ is recommended)
- Services not starting correctly
- Honeycomb API key not set or invalid
- Network connectivity issues
- Tracing not configured correctly in the services
- Browser installation issues (the script will attempt to install the required browsers automatically)

Check the error message and logs for more details on how to resolve the issue.
