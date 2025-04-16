#!/bin/bash

# Script to run the load generator
# Usage: ./run-loadgen.sh [number_of_instances]

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

# Get the number of instances to run (default: 1)
NUM_INSTANCES=${1:-1}

# Validate that NUM_INSTANCES is a positive integer
if ! [[ "$NUM_INSTANCES" =~ ^[0-9]+$ ]] || [ "$NUM_INSTANCES" -lt 1 ]; then
    echo "Error: Number of instances must be a positive integer."
    echo "Usage: ./run-loadgen.sh [number_of_instances]"
    exit 1
fi

# Create a directory for log files if it doesn't exist
LOG_DIR="loadgen_logs"
mkdir -p "$LOG_DIR"

# Display configuration
echo "Starting $NUM_INSTANCES load generator instance(s) with configuration:"
echo "BASE_URL=${BASE_URL:-http://localhost:10114}"
echo "ITERATIONS=${ITERATIONS:-∞ (infinite)}"
echo "MIN_DELAY=${MIN_DELAY:-2000}ms"
echo "MAX_DELAY=${MAX_DELAY:-5000}ms"
echo "HEADLESS=${HEADLESS:-true}"
echo "TIMEOUT=${TIMEOUT:-15000}ms"

# Function to run a single instance of the load generator
run_instance() {
    local instance_num=$1
    local log_file="$LOG_DIR/loadgen_${instance_num}.log"

    echo "Starting load generator instance #$instance_num (log: $log_file)"

    # Run the load generator with a unique log file and instance ID
    LOG_FILE="$log_file" INSTANCE_ID="$instance_num" node loadgen.js &

    # Store the PID
    echo $! >> "$LOG_DIR/pids.txt"
}

# Clear any existing PID file
rm -f "$LOG_DIR/pids.txt"

# Start the specified number of instances
for i in $(seq 1 $NUM_INSTANCES); do
    run_instance $i
done

echo "Started $NUM_INSTANCES load generator instance(s)"
echo "Log files are in the $LOG_DIR directory"
echo "To stop all instances, press Ctrl+C"

# Function to clean up when the script is terminated
cleanup() {
    echo "\nStopping all load generator instances..."
    if [ -f "$LOG_DIR/pids.txt" ]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                echo "Stopped instance with PID $pid"
            fi
        done < "$LOG_DIR/pids.txt"
        rm "$LOG_DIR/pids.txt"
    fi
    echo "All instances stopped"
    exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
