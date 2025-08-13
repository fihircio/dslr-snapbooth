# HDMI Live View Implementation Guide

## Overview
This guide covers implementing HDMI input capture for live view as a reliable alternative to gphoto2 live view, especially for cameras like the Canon 600D where gphoto2 live view is unreliable.

## 🎯 Why HDMI Input?

### Problems with gphoto2 Live View
- **Unreliable on Canon 600D**: Often fails or produces poor quality
- **High latency**: 500ms+ frame intervals
- **Limited compatibility**: Not all cameras support it well
- **Resource intensive**: Heavy CPU usage

### Benefits of HDMI Input
- **Reliable**: Direct HDMI signal capture
- **Low latency**: Real-time or near real-time
- **High quality**: Full resolution output
- **Universal**: Works with any camera with HDMI output
- **Stable**: No camera communication issues

## 🔧 Hardware Requirements

### HDMI Capture Devices
1. **USB HDMI Capture Cards** (Recommended)
   - **Elgato Cam Link 4K**: Professional quality, low latency
   - **AverMedia Live Gamer Mini**: Good quality, affordable
   - **Magewell USB Capture**: Enterprise-grade
   - **Generic USB 2.0/3.0**: Budget option

2. **PCIe Capture Cards**
   - **Blackmagic DeckLink**: Professional broadcast quality
   - **AverMedia Live Gamer 4K**: Gaming/streaming focused

### System Requirements
- **USB 3.0+ port** for USB capture devices
- **PCIe slot** for PCIe cards
- **Sufficient CPU**: For real-time encoding
- **Good USB bandwidth**: For USB capture devices

## 🛠️ Software Solutions

### 1. FFmpeg-based Solution (Recommended)

#### Installation
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

#### Basic HDMI Capture
```bash
# List available devices
ffmpeg -f avfoundation -list_devices true -i ""

# Capture HDMI input (macOS)
ffmpeg -f avfoundation -framerate 30 -video_size 1920x1080 -i "1:0" -c:v libx264 -preset ultrafast -tune zerolatency -f mjpeg pipe:1

# Capture HDMI input (Linux)
ffmpeg -f v4l2 -framerate 30 -video_size 1920x1080 -i /dev/video0 -c:v libx264 -preset ultrafast -tune zerolatency -f mjpeg pipe:1

# Capture HDMI input (Windows)
ffmpeg -f dshow -framerate 30 -video_size 1920x1080 -i "video=Your Capture Device" -c:v libx264 -preset ultrafast -tune zerolatency -f mjpeg pipe:1
```

### 2. Node.js Implementation

#### New HDMI Streamer Module
```javascript
// stream/hdmi-streamer.js
const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class HDMIStreamer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      framerate: 30,
      resolution: '1920x1080',
      device: 'auto', // or specific device path
      ...options
    };
    this.ffmpegProcess = null;
    this.isStreaming = false;
  }

  detectDevice() {
    return new Promise((resolve, reject) => {
      const detect = spawn('ffmpeg', [
        '-f', 'avfoundation',
        '-list_devices', 'true',
        '-i', ''
      ]);

      let output = '';
      detect.stdout.on('data', (data) => {
        output += data.toString();
      });

      detect.stderr.on('data', (data) => {
        output += data.toString();
      });

      detect.on('close', (code) => {
        // Parse output to find HDMI capture device
        const lines = output.split('\n');
        const hdmiDevice = lines.find(line => 
          line.includes('HDMI') || line.includes('Capture') || line.includes('USB')
        );
        resolve(hdmiDevice ? hdmiDevice.trim() : null);
      });
    });
  }

  startStreaming() {
    if (this.isStreaming) return;

    const args = [
      '-f', 'avfoundation',
      '-framerate', this.options.framerate.toString(),
      '-video_size', this.options.resolution,
      '-i', this.options.device,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-f', 'mjpeg',
      'pipe:1'
    ];

    this.ffmpegProcess = spawn('ffmpeg', args);
    this.isStreaming = true;

    this.ffmpegProcess.stdout.on('data', (data) => {
      // Emit frame data
      this.emit('frame', data);
    });

    this.ffmpegProcess.stderr.on('data', (data) => {
      console.log('FFmpeg:', data.toString());
    });

    this.ffmpegProcess.on('close', (code) => {
      this.isStreaming = false;
      this.emit('stopped');
    });

    this.emit('started');
  }

  stopStreaming() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
    }
    this.isStreaming = false;
  }
}

module.exports = HDMIStreamer;
```

#### Updated WebSocket Handler
```javascript
// stream/hdmi-websocket.js
const HDMIStreamer = require('./hdmi-streamer');

class HDMIWebSocketHandler {
  constructor() {
    this.streamer = new HDMIStreamer();
    this.clients = new Set();
    this.frameBuffer = null;
  }

  handleConnection(ws) {
    this.clients.add(ws);
    
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'hdmi-liveview') {
          this.startStreaming();
        }
      } catch (e) {
        ws.send(JSON.stringify({ error: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      if (this.clients.size === 0) {
        this.stopStreaming();
      }
    });

    // Send initial frame if available
    if (this.frameBuffer) {
      ws.send(JSON.stringify({
        type: 'frame',
        data: this.frameBuffer.toString('base64')
      }));
    }
  }

  startStreaming() {
    if (this.streamer.isStreaming) return;

    this.streamer.on('frame', (frameData) => {
      this.frameBuffer = frameData;
      const base64Frame = frameData.toString('base64');
      
      // Send to all connected clients
      this.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: 'frame',
            data: base64Frame
          }));
        }
      });
    });

    this.streamer.startStreaming();
  }

  stopStreaming() {
    this.streamer.stopStreaming();
  }
}

module.exports = HDMIWebSocketHandler;
```

### 3. Alternative: V4L2 (Linux)

#### V4L2 Setup
```bash
# Install v4l2 utilities
sudo apt install v4l-utils

# List video devices
v4l2-ctl --list-devices

# Check device capabilities
v4l2-ctl -d /dev/video0 --list-formats-ext

# Set resolution and framerate
v4l2-ctl -d /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=YUYV
v4l2-ctl -d /dev/video0 --set-parm=30
```

#### Node.js V4L2 Implementation
```javascript
// stream/v4l2-streamer.js
const fs = require('fs');
const { spawn } = require('child_process');

class V4L2Streamer {
  constructor(device = '/dev/video0') {
    this.device = device;
    this.process = null;
  }

  startStreaming() {
    const args = [
      '-f', 'v4l2',
      '-framerate', '30',
      '-video_size', '1920x1080',
      '-i', this.device,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-f', 'mjpeg',
      'pipe:1'
    ];

    this.process = spawn('ffmpeg', args);
    return this.process;
  }
}
```

## 🔄 Integration with Existing System

### Updated Server Configuration
```javascript
// api/server.js
const HDMIWebSocketHandler = require('../stream/hdmi-websocket');

const hdmiHandler = new HDMIWebSocketHandler();

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'liveview') {
        // Use gphoto2 live view (fallback)
        startLiveView(ws);
      } else if (data.type === 'hdmi-liveview') {
        // Use HDMI live view (preferred)
        hdmiHandler.handleConnection(ws);
      }
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid message' }));
    }
  });
});
```

### Frontend Component Update
```typescript
// components/HDMILiveView.tsx
import React, { useEffect, useRef, useState } from 'react';

export function HDMILiveView() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      // Try HDMI first, fallback to gphoto2
      ws.send(JSON.stringify({ type: 'hdmi-liveview' }));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === 'frame' && data.data && imgRef.current) {
          imgRef.current.src = 'data:image/jpeg;base64,' + data.data;
        } else if (data.error) {
          setError(data.error);
        }
      } catch (e) {
        setError('Invalid message received');
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <img 
        ref={imgRef} 
        alt="HDMI Live View" 
        style={{ 
          width: 640, 
          height: 360,
          border: '1px solid #ccc',
          backgroundColor: '#000'
        }} 
      />
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!isConnected && <div>Connecting...</div>}
    </div>
  );
}
```

## 📋 Setup Checklist

### Hardware Setup
- [ ] Connect HDMI capture device to computer
- [ ] Connect camera HDMI output to capture device
- [ ] Ensure camera is set to HDMI output mode
- [ ] Test HDMI signal on camera display

### Software Setup
- [ ] Install FFmpeg
- [ ] Test device detection
- [ ] Verify capture device permissions
- [ ] Test basic capture command

### Integration
- [ ] Add HDMI streamer module
- [ ] Update WebSocket handler
- [ ] Add frontend component
- [ ] Test end-to-end functionality

## 🆘 Troubleshooting

### Common Issues

#### No HDMI Signal
```bash
# Check if device is detected
ffmpeg -f avfoundation -list_devices true -i ""

# Test basic capture
ffmpeg -f avfoundation -i "1:0" -t 5 test_output.mp4
```

#### Permission Issues (Linux)
```bash
# Add user to video group
sudo usermod -a -G video $USER

# Check device permissions
ls -la /dev/video*
```

#### High Latency
- Use `ultrafast` preset
- Reduce resolution if needed
- Check USB bandwidth
- Use USB 3.0+ ports

#### Poor Quality
- Increase bitrate
- Use better capture device
- Check HDMI cable quality
- Verify camera HDMI settings

## 🚀 Performance Optimization

### Recommended Settings
```javascript
const hdmiStreamer = new HDMIStreamer({
  framerate: 30,
  resolution: '1920x1080',
  preset: 'ultrafast',
  tune: 'zerolatency',
  crf: 23 // Quality vs file size
});
```

### Hardware Recommendations
- **USB 3.0+ capture device**
- **Good quality HDMI cable**
- **Sufficient CPU** (Intel i5+ or equivalent)
- **USB 3.0+ ports**

## 📊 Comparison: gphoto2 vs HDMI

| Feature | gphoto2 Live View | HDMI Input |
|---------|------------------|------------|
| Reliability | Poor (600D) | Excellent |
| Latency | High (500ms+) | Low (<100ms) |
| Quality | Variable | Consistent |
| Setup | Simple | Moderate |
| Cost | Free | Hardware cost |
| Compatibility | Camera-specific | Universal |

## 🎯 Next Steps

1. **Choose capture device** based on budget and requirements
2. **Implement HDMI streamer** module
3. **Update WebSocket handler** to support both methods
4. **Add frontend component** with fallback logic
5. **Test thoroughly** with your Canon 600D
6. **Optimize performance** based on your hardware

This HDMI approach will give you much more reliable and responsive live view compared to gphoto2! 