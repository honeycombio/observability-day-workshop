#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the service locally on port 3000
echo "Starting user-service on http://localhost:3000"
node index.js
