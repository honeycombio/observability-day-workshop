# Meminator Workshop Scripts

This directory contains utility scripts for the Meminator Workshop.

## End-to-End Test Script

The `e2e-test.sh` script performs an end-to-end test of the Meminator application, including verifying that distributed tracing is working correctly in Honeycomb.

### Prerequisites

- Docker must be installed and running
- The Meminator application must be built (the script will start it if not already running)
- `curl` and `jq` must be installed
- A Honeycomb API key must be set in the `HONEYCOMB_API_KEY` environment variable

### Usage

```bash
# Set your Honeycomb API key
export HONEYCOMB_API_KEY=your_api_key

# Run the end-to-end test
./scripts/e2e-test.sh
```

### What the Script Does

1. Checks if Docker is running
2. Starts the application if it's not already running
3. Makes a request to the web service to verify it's responding
4. Generates a meme by calling the backend-for-frontend service
5. Waits for traces to be sent to Honeycomb
6. Queries the Honeycomb API to find recent traces
7. Verifies that all services (backend-for-frontend, meminator, phrase-picker, image-picker) contributed spans to the trace
8. Provides a link to view the trace in the Honeycomb UI

### Troubleshooting

If the script fails, it will provide an error message indicating what went wrong. Common issues include:

- Docker not running
- Services not starting correctly
- Honeycomb API key not set or invalid
- Network connectivity issues
- Tracing not configured correctly in the services

Check the error message and logs for more details on how to resolve the issue.
