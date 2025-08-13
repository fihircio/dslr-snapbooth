# Syphon Live View Integration Guide

## Overview
This guide covers integrating [v002 Camera Live](https://github.com/v002/v002-Camera-Live) approach for reliable live view using Syphon on macOS. This method provides much better reliability than gphoto2 live view, especially for Canon cameras like the 600D.

## 🎯 Why Syphon Integration?

### Advantages over gphoto2 Live View
- **Reliability**: Direct Canon SDK access via v002 Camera Live
- **Low Latency**: ~120ms (3-4 frames at 30fps)
- **Stability**: No camera communication issues
- **Quality**: Full resolution live view frames
- **Compatibility**: Works with Canon DSLRs that have unreliable gphoto2 live view

### Advantages over HDMI Input
- **No Hardware Required**: Uses existing USB connection
- **Lower Cost**: No HDMI capture device needed
- **Simpler Setup**: Just software installation
- **Direct Access**: Uses camera's native live view

## 🔧 Prerequisites

### Software Requirements
- **macOS**: Syphon is macOS-only
- **v002 Camera Live**: Download from [releases](https://github.com/v002/v002-Camera-Live/releases)
- **SyphonInject**: For capturing Syphon streams
- **Node.js**: For our backend integration

### Hardware Requirements
- **Canon DSLR**: Connected via USB
- **USB Cable**: Direct connection (no hub)

## 📦 Installation

### 1. Install v002 Camera Live
```bash
# Download from GitHub releases
# https://github.com/v002/v002-Camera-Live/releases
# Extract and move to Applications folder
```

### 2. Install SyphonInject
```bash
# Install via Homebrew
brew install syphon-inject

# Or download from Syphon website
# http://syphon.v002.info
```

### 3. Install Syphon Framework
```bash
# Install Syphon framework
brew install syphon

# Or download from Syphon website
# http://syphon.v002.info
```

## 🚀 Setup Process

### Step 1: Test v002 Camera Live
1. **Connect your Canon DSLR** via USB
2. **Launch v002 Camera Live** from Applications
3. **Verify connection**: Camera should appear in the app
4. **Start live view**: Click "Start" in the app
5. **Check Syphon output**: Use SyphonInject to verify

### Step 2: Test Syphon Integration
```bash
# List available Syphon servers
SyphonInject --list

# Test capture from v002 Camera Live
SyphonInject --server "v002 Camera Live" --output test.mov --duration 5
```

### Step 3: Integrate with Our Backend
The system will automatically detect and use Syphon when available.

## 🔄 Integration with Our System

### Updated Live View Priority
Our system now supports multiple live view methods with smart fallback:

1. **Syphon** (macOS only, highest priority)
2. **HDMI Input** (cross-platform, recommended)
3. **gphoto2 Live View** (fallback, unreliable on 600D)

### WebSocket Usage
```javascript
// Try Syphon first (macOS), then HDMI, then gphoto2
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => ws.send(JSON.stringify({ type: 'auto-liveview' }));
```

## 🛠️ Implementation Details

### Syphon Streamer Module
```javascript
// stream/syphon-streamer.js
const SyphonStreamer = require('./syphon-streamer');

const syphonStreamer = new SyphonStreamer({
  serverName: 'v002 Camera Live',
  framerate: 30
});

// Start streaming
await syphonStreamer.startStreaming();
```

### Updated Server Integration
```javascript
// api/server.js
const SyphonStreamer = require('../stream/syphon-streamer');
const HDMIStreamer = require('../stream/hdmi-streamer');

// Priority-based live view selection
async function startLiveView(ws, mode = 'auto') {
  if (mode === 'syphon' || (mode === 'auto' && os.platform() === 'darwin')) {
    try {
      await syphonStreamer.startStreaming();
      return 'syphon';
    } catch (error) {
      console.log('Syphon failed, trying HDMI...');
    }
  }
  
  if (mode === 'hdmi' || mode === 'auto') {
    try {
      await hdmiStreamer.startStreaming();
      return 'hdmi';
    } catch (error) {
      console.log('HDMI failed, trying gphoto2...');
    }
  }
  
  // Fallback to gphoto2
  startGphoto2LiveView(ws);
  return 'gphoto2';
}
```

## 📊 Performance Comparison

| Method | Latency | Reliability | Setup Complexity | Cost |
|--------|---------|-------------|------------------|------|
| **Syphon** | ~120ms | Excellent | Low | Free |
| **HDMI Input** | ~50ms | Excellent | Medium | Hardware cost |
| **gphoto2 Live View** | ~500ms | Poor (600D) | Low | Free |

## 🆘 Troubleshooting

### v002 Camera Live Issues
```bash
# Check if camera is detected
gphoto2 --auto-detect

# Reset camera connection (macOS)
sudo ./reset-camera.sh

# Ensure EOS Utility is not running
pkill -f "EOS Utility"
```

### Syphon Issues
```bash
# List available Syphon servers
SyphonInject --list

# Test Syphon capture
SyphonInject --server "v002 Camera Live" --output test.mov --duration 3

# Check Syphon framework
brew list | grep syphon
```

### Common Problems
1. **Camera not detected**: Check USB connection, try different cable
2. **No Syphon servers**: Ensure v002 Camera Live is running
3. **Permission issues**: Grant camera access in System Preferences
4. **High latency**: Check USB bandwidth, avoid hubs

## 🔧 Advanced Configuration

### Custom Syphon Server
```javascript
const syphonStreamer = new SyphonStreamer({
  serverName: 'Custom Camera Server',
  framerate: 60,
  resolution: '1920x1080'
});
```

### Multiple Camera Support
```javascript
// Support multiple v002 Camera Live instances
const servers = await syphonStreamer.listSyphonServers();
const cameraServer = servers.find(server => 
  server.includes('Canon') || server.includes('Camera')
);
```

## 📱 Frontend Integration

### React Component
```typescript
// components/SyphonLiveView.tsx
import React, { useEffect, useRef, useState } from 'react';

export function SyphonLiveView() {
  const [mode, setMode] = useState<'auto' | 'syphon' | 'hdmi' | 'gphoto2'>('auto');
  
  return (
    <div>
      <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
        <option value="auto">Auto (Syphon → HDMI → gphoto2)</option>
        <option value="syphon">Syphon Only (macOS)</option>
        <option value="hdmi">HDMI Only</option>
        <option value="gphoto2">gphoto2 Only</option>
      </select>
      
      <HDMILiveView mode={mode} />
    </div>
  );
}
```

## 🎯 Best Practices

### For Canon 600D Users
1. **Use Syphon** as primary method (macOS)
2. **HDMI Input** as backup (cross-platform)
3. **Avoid gphoto2 live view** (unreliable on 600D)

### For Production
1. **Test all methods** before deployment
2. **Implement fallback logic** automatically
3. **Monitor performance** and switch methods if needed
4. **Provide user feedback** about which method is active

## 🚀 Next Steps

1. **Install v002 Camera Live** and test with your Canon 600D
2. **Verify Syphon integration** works on your system
3. **Test the updated backend** with Syphon support
4. **Update your frontend** to use the new live view options
5. **Deploy with confidence** knowing you have reliable live view

This Syphon integration provides the best of both worlds: the reliability of direct camera access with the flexibility of our existing system architecture! 