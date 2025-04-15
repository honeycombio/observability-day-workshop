#!/bin/bash

# Restore dependencies
echo "Restoring dependencies..."
dotnet restore

# Run the service locally on port 3000
echo "Starting user-service on http://localhost:3000"
dotnet run
