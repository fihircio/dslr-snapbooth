#!/bin/bash

echo "🔧 Resetting camera connection..."

# Kill all related processes
echo "Killing PTPCamera and gphoto2 processes..."
sudo killall PTPCamera 2>/dev/null || true
sudo pkill -f gphoto2 2>/dev/null || true
sudo pkill -f "Canon EOS" 2>/dev/null || true

# Wait for processes to fully terminate
sleep 3

# Reset USB permissions (macOS specific)
echo "Resetting USB permissions..."
sudo kextunload -b com.apple.driver.usb.serial 2>/dev/null || true
sudo kextload -b com.apple.driver.usb.serial 2>/dev/null || true

# Wait for USB to reset
sleep 5

# Test camera detection
echo "Testing camera detection..."
if gphoto2 --auto-detect | grep -q "Canon EOS"; then
    echo "✅ Camera is now accessible!"
    echo "You can now start the DSLR helper with: ./start-dslr-helper.sh"
else
    echo "❌ Camera still not accessible"
    echo "Try these steps:"
    echo "1. Disconnect and reconnect your camera"
    echo "2. Make sure camera is in 'PC Connection' mode"
    echo "3. Run this script again"
fi 