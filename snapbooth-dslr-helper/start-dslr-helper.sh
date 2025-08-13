#!/bin/bash

# Select how live view will be sourced: gphoto2 | hdmi | v002-direct | uvc | syphon | auto
LIVEVIEW_MODE="${LIVEVIEW_MODE:-auto}"
echo "LIVEVIEW_MODE=${LIVEVIEW_MODE}"

# Only kill PTPCamera/gphoto2 when using the gphoto2 path
if [ "$LIVEVIEW_MODE" = "gphoto2" ]; then
    echo "Killing PTPCamera processes for gphoto2 mode..."
    sudo killall PTPCamera 2>/dev/null || true
    sleep 2

    echo "Killing any existing gphoto2 processes..."
    sudo pkill -f gphoto2 2>/dev/null || true
    sleep 1

    echo "Checking camera accessibility via gphoto2..."
    if gphoto2 --auto-detect | grep -q "Canon EOS"; then
        echo "✅ Camera detected and accessible via gphoto2"
    else
        echo "⚠️  Camera not detected via gphoto2"
        echo "Trying to reset USB permissions..."
        sudo killall PTPCamera 2>/dev/null || true
        sleep 3
    fi
else
    echo "Non-gphoto2 mode (${LIVEVIEW_MODE}) → skipping PTPCamera/gphoto2 kill"
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

