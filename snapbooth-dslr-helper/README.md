# DSLR Snapbooth Helper

A Node.js backend service that provides REST API and WebSocket endpoints for controlling DSLR cameras via gphoto2. Designed to work with the snapbooth-frontend React application.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.17.0+ (v20+ recommended)
- **gphoto2**: Camera control library
- **DSLR Camera**: Connected via USB

### Installation

#### macOS
```bash
# Install dependencies
brew install gphoto2 node

# Clone and setup
git clone <repository-url>
cd snapbooth-dslr-helper
npm install

# Reset camera connection (if needed)
sudo ./reset-camera.sh

# Start the service
sudo ./start-dslr-helper.sh
```

#### Linux
```bash
# Install dependencies
sudo apt update
sudo apt install gphoto2 libgphoto2-dev nodejs npm

# Clone and setup
git clone <repository-url>
cd snapbooth-dslr-helper
npm install

# Start the service
sudo ./start-dslr-helper.sh
```

#### Windows
See [docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md) for complete Windows setup guide.

### Configuration
```bash
# Set your API token
export DSLR_API_TOKEN=your_secure_token_here

# Or create .env file
echo "DSLR_API_TOKEN=your_secure_token_here" > .env
```

## 📚 Documentation

For comprehensive documentation, see the [docs/](docs/) folder:

- **[docs/README.md](docs/README.md)** - Documentation index and navigation
- **[docs/PHOTOBOOTH_GUIDE.md](docs/PHOTOBOOTH_GUIDE.md)** - Complete system architecture and setup
- **[docs/INTEGRATION_PLAN.md](docs/INTEGRATION_PLAN.md)** - Integration with React + PHP system
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide
- **[docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md)** - Windows setup and troubleshooting

## 🎯 Features

- ✅ **Photo Capture**: Single shot and burst capture
- ✅ **Live View**: WebSocket streaming of camera preview
- ✅ **Camera Settings**: Get and set camera configurations
- ✅ **Image Gallery**: List and download images from camera
- ✅ **Video Recording**: Start/stop video recording
- ✅ **Print Support**: Print captured photos
- ✅ **Cross-Platform**: macOS, Linux, Windows (WSL2/Docker)
- ✅ **macOS Compatibility**: Handles PTPCamera conflicts automatically

## 🔧 API Endpoints

### Authentication
All endpoints require the `X-DSLR-Token` header:
```
X-DSLR-Token: your_secure_token_here
```

### Quick Test
```bash
# Test camera status
curl -H "X-DSLR-Token: yourtoken" http://localhost:3000/api/status

# Test photo capture
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -H "X-DSLR-Token: yourtoken" \
  -d '{"filename": "test.jpg"}'
```

For complete API documentation, see [docs/PHOTOBOOTH_GUIDE.md](docs/PHOTOBOOTH_GUIDE.md).

## 🐳 Docker Deployment

```bash
# Quick Docker setup
docker-compose up -d

# Or build manually
docker build -t dslr-helper .
docker run -p 3000:3000 --device=/dev/bus/usb dslr-helper
```

## 🆘 Troubleshooting

### Common Issues

#### Camera Not Detected
```bash
# Test manual detection
gphoto2 --auto-detect

# Reset camera connection (macOS)
sudo ./reset-camera.sh
```

#### Service Won't Start
```bash
# Check logs
tail -f error.log

# Test manual start
node main.js
```

#### Permission Issues
```bash
# Run with sudo (Linux/macOS)
sudo ./start-dslr-helper.sh

# Or add user to video group (Linux)
sudo usermod -a -G video $USER
```

For detailed troubleshooting, see the platform-specific guides in [docs/](docs/).

## 🚀 Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start main.js --name "dslr-helper"
pm2 save
pm2 startup
```

### Using Docker
```bash
docker-compose -f docker-compose.yml up -d
```

For complete production setup, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 🔗 Integration

This helper is designed to work with:
- **snapbooth-frontend**: React application for UI
- **PHP Backend**: For uploads, gallery, and sharing features

For integration details, see [docs/INTEGRATION_PLAN.md](docs/INTEGRATION_PLAN.md).

## 📄 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting sections in [docs/](docs/)
- Review the error logs
- Test manual gphoto2 commands
- Open an issue on GitHub

