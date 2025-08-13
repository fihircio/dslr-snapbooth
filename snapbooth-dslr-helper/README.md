# snapbooth-dslr-helper

A Node.js backend for controlling DSLR cameras via USB, providing live view streaming, photo capture, and printing capabilities.

## 🚨 **Important Update: SyphonInject is Broken**

The [SyphonInject project](https://github.com/zakk4223/SyphonInject) **no longer works** on macOS 10.14+ due to Apple's security changes. We now use **HDMI Input Capture** as the primary live view method.

## 🎯 **Live View Options**

### **1. HDMI Input Capture (Recommended)**
- **Latency**: ~50ms
- **Reliability**: Excellent
- **Platform**: All platforms
- **Requirements**: HDMI capture device + FFmpeg

### **2. v002 Camera Live Direct (macOS Only)**
- **Latency**: ~150ms
- **Reliability**: Good
- **Platform**: macOS only
- **Requirements**: v002 Camera Live app

### **3. Enhanced gphoto2 Live View (Fallback)**
- **Latency**: ~300ms
- **Reliability**: Fair
- **Platform**: All platforms
- **Requirements**: gphoto2 library

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+)
- **gphoto2** (`brew install gphoto2` on macOS)
- **FFmpeg** (`brew install ffmpeg`)
- **HDMI Capture Device** (for best performance)

### Installation
```bash
git clone <repository>
cd snapbooth-dslr-helper
npm install
```

### Start the Helper
```bash
# macOS/Linux
sudo ./start-dslr-helper.sh

# Windows
start-dslr-helper-windows.bat

# Or manually
export DSLR_API_TOKEN=your-secret-token
npx nodemon main.js
```

### Test HDMI Devices
```bash
node test-hdmi-devices.js
```

### Test v002 Direct Integration (macOS)
```bash
node test-v002-direct.js
```

## 📡 API Endpoints

### REST API
- `GET /api/status` - Check DSLR connection
- `POST /api/capture` - Capture photo
- `POST /api/print` - Print photo
- `GET /api/settings` - Get camera settings
- `POST /api/settings` - Set camera settings
- `POST /api/burst` - Burst capture
- `POST /api/video/start` - Start video recording
- `POST /api/video/stop` - Stop video recording
- `GET /api/images` - List camera images
- `GET /api/download` - Download camera image

### WebSocket Live View
```javascript
const ws = new WebSocket('ws://localhost:3000');

// Auto mode (recommended)
ws.send(JSON.stringify({ type: 'auto-liveview' }));

// Specific methods
ws.send(JSON.stringify({ type: 'hdmi-liveview' }));
ws.send(JSON.stringify({ type: 'v002-direct-liveview' }));
ws.send(JSON.stringify({ type: 'liveview' }));
```

## 🔧 Configuration

### Environment Variables
- `DSLR_API_TOKEN` - Required for API authentication
- `PORT` - Server port (default: 3000)

### HDMI Capture Settings
- **Device**: Auto-detected or specified
- **Resolution**: 1920x1080 (default)
- **Framerate**: 30fps (default)
- **Quality**: High (CRF 18)

## 📊 Performance Comparison

| Method | Latency | Reliability | Setup | Cost | Platform |
|--------|---------|-------------|-------|------|----------|
| **HDMI Input** | ~50ms | Excellent | Medium | Hardware | All |
| **v002 Direct** | ~150ms | Good | Low | Free | macOS |
| **Enhanced gphoto2** | ~300ms | Fair | Low | Free | All |

## 🛠️ Troubleshooting

### Common Issues
1. **Camera not detected**: Run `./reset-camera.sh`
2. **HDMI device not found**: Run `node test-hdmi-devices.js`
3. **v002 not working**: Download latest from GitHub releases
4. **Permission errors**: Use `sudo` for camera access

### Platform-Specific
- **macOS**: PTPCamera conflicts resolved automatically
- **Linux**: USB permissions may need adjustment
- **Windows**: gphoto2 installation required

## 📚 Documentation

See the `docs/` folder for comprehensive guides:
- [Integration Plan](docs/INTEGRATION_PLAN.md)
- [Photobooth Guide](docs/PHOTOBOOTH_GUIDE.md)
- [Windows Setup](docs/WINDOWS_SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [macOS Setup](docs/README_macOS.md)
- [HDMI Live View](docs/HDMI_LIVEVIEW.md)
- [Updated Live View Guide](docs/UPDATED_LIVEVIEW_GUIDE.md)

## 🎯 **For Canon 600D Users**

**HDMI Input Capture** is the **most reliable** solution for your camera:
- **Lower latency** than gphoto2 live view
- **More stable** than traditional methods
- **Cross-platform** compatibility
- **No dependency** on broken tools

## 🚀 **Next Steps**

1. **Get an HDMI capture device** (Elgato Cam Link 4K recommended)
2. **Test HDMI integration** with your camera
3. **Deploy with confidence** knowing you have reliable live view

## 📄 License

MIT License - see LICENSE file for details.

