#!/bin/bash

# Script to run the load generator

set -e

# Change to the scripts directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run this script."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Display configuration
echo "Starting load generator with configuration:"
echo "BASE_URL=${BASE_URL:-http://localhost:10114}"
echo "ITERATIONS=${ITERATIONS:-10}"
echo "MIN_DELAY=${MIN_DELAY:-2000}ms"
echo "MAX_DELAY=${MAX_DELAY:-5000}ms"
echo "HEADLESS=${HEADLESS:-true}"
echo "TIMEOUT=${TIMEOUT:-15000}ms"

# Run the load generator
echo "Starting load generator..."
node loadgen.js

echo "Load generator completed."
