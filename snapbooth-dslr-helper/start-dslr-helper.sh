#!/bin/bash

# Kill any existing PTPCamera processes that might interfere with gphoto2
echo "Killing PTPCamera processes..."
sudo killall PTPCamera 2>/dev/null || true
sleep 2

# Kill any existing gphoto2 processes
echo "Killing any existing gphoto2 processes..."
sudo pkill -f gphoto2 2>/dev/null || true
sleep 1

# Check if camera is accessible
echo "Checking camera accessibility..."
if gphoto2 --auto-detect | grep -q "Canon EOS"; then
    echo "✅ Camera detected and accessible"
else
    echo "⚠️  Camera not detected or not accessible"
    echo "Trying to reset USB permissions..."
    sudo killall PTPCamera 2>/dev/null || true
    sleep 3
fi

# Ensure static directory exists
mkdir -p static

# Set environment variable for API token if not already set
if [ -z "$DSLR_API_TOKEN" ]; then
    export DSLR_API_TOKEN=yourtoken
    echo "Using default API token. Set DSLR_API_TOKEN environment variable for production."
fi

# Start the Node.js server
echo "Starting DSLR Helper server..."
npx nodemon main.js

