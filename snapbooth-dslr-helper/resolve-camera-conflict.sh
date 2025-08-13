#!/bin/bash

echo "🔧 Resolving camera conflicts..."
echo "=================================="

# Kill all camera-related processes
echo "📱 Killing camera processes..."
sudo killall "v002 Camera Live" 2>/dev/null || true
sudo killall PTPCamera 2>/dev/null || true
sudo pkill -f gphoto2 2>/dev/null || true
sudo pkill -f "Canon EOS" 2>/dev/null || true

# Wait for processes to fully terminate
echo "⏳ Waiting for processes to terminate..."
sleep 3

# Reset USB permissions (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔄 Resetting USB permissions..."
    sudo kextunload -b com.apple.driver.usb.serial 2>/dev/null || true
    sudo kextload -b com.apple.driver.usb.serial 2>/dev/null || true
    sleep 2
fi

# Test camera detection
echo "📷 Testing camera detection..."
gphoto2 --auto-detect

if [ $? -eq 0 ]; then
    echo "✅ Camera is now accessible"
    echo ""
    echo "💡 Recommendations:"
    echo "1. Close v002 Camera Live completely"
    echo "2. Wait 10 seconds"
    echo "3. Start our DSLR helper: sudo ./start-dslr-helper.sh"
    echo "4. Test live view in the frontend"
    echo ""
    echo "⚠️  Note: Don't run v002 Camera Live and our helper simultaneously"
else
    echo "❌ Camera still not accessible"
    echo "💡 Try disconnecting and reconnecting the USB cable"
fi 