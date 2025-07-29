# DSLR Snapbooth Helper Documentation

This directory contains comprehensive documentation for the DSLR Snapbooth Helper project.

## 📚 Documentation Index

### 🚀 Getting Started
- **[README.md](../README.md)** - Main project README with quick start guide
- **[PHOTOBOOTH_GUIDE.md](./PHOTOBOOTH_GUIDE.md)** - Complete system architecture and setup guide
- **[INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md)** - Integration plan for React + PHP + Node.js system

### 🖥️ Platform-Specific Setup
- **[WINDOWS_SETUP.md](./WINDOWS_SETUP.md)** - Complete Windows setup guide (WSL2, Native Windows, Docker)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide for all platforms
- **[README_macOS.md](./README_macOS.md)** - macOS-specific setup and troubleshooting

### 🐳 Containerization
- **[Dockerfile](../Dockerfile)** - Docker container configuration
- **[docker-compose.yml](../docker-compose.yml)** - Multi-service Docker setup
- **[.dockerignore](../.dockerignore)** - Docker build optimization

### 📋 Scripts
- **[start-dslr-helper.sh](../start-dslr-helper.sh)** - Linux/macOS startup script
- **[start-dslr-helper-windows.bat](../start-dslr-helper-windows.bat)** - Windows startup script
- **[reset-camera.sh](../reset-camera.sh)** - Camera connection reset (macOS)

## 🎯 Quick Navigation

### For New Users
1. Start with **[README.md](../README.md)** for overview
2. Read **[PHOTOBOOTH_GUIDE.md](./PHOTOBOOTH_GUIDE.md)** for system architecture
3. Choose your platform setup guide:
   - **macOS**: [README_macOS.md](./README_macOS.md)
   - **Windows**: [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)
   - **Linux**: [DEPLOYMENT.md](./DEPLOYMENT.md) (Linux section)

### For Developers
1. **[INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md)** - Understand the full system architecture
2. **[PHOTOBOOTH_GUIDE.md](./PHOTOBOOTH_GUIDE.md)** - API usage and troubleshooting
3. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment options

### For Production Deployment
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete production guide
2. **[Dockerfile](../Dockerfile)** - Containerized deployment
3. Platform-specific sections in [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)

## 📖 Documentation Structure

```
docs/
├── README.md                    # This index file
├── PHOTOBOOTH_GUIDE.md         # Complete system guide
├── INTEGRATION_PLAN.md         # Integration architecture
├── WINDOWS_SETUP.md            # Windows deployment
├── DEPLOYMENT.md               # Production deployment
└── README_macOS.md             # macOS specific guide
```

## 🔧 Common Tasks

### Quick Setup
```bash
# Clone and setup
git clone <repository-url>
cd snapbooth-dslr-helper
npm install

# Start development
sudo ./start-dslr-helper.sh  # macOS/Linux
# or
start-dslr-helper-windows.bat  # Windows
```

### Docker Deployment
```bash
# Quick Docker setup
docker-compose up -d
```

### Production Deployment
```bash
# Using PM2
npm install -g pm2
pm2 start main.js --name "dslr-helper"
```

## 🆘 Troubleshooting

### Camera Issues
- **macOS**: Run `sudo ./reset-camera.sh`
- **Windows**: Check [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)
- **Linux**: Check [DEPLOYMENT.md](./DEPLOYMENT.md)

### Service Issues
- Check logs: `tail -f error.log`
- Restart service: `pm2 restart dslr-helper`
- Manual test: `gphoto2 --auto-detect`

### API Issues
- Test endpoint: `curl http://localhost:3000/api/status`
- Check token: Ensure `DSLR_API_TOKEN` is set
- Verify camera: `gphoto2 --auto-detect`

## 📞 Support

For issues and questions:
1. Check the troubleshooting sections in each guide
2. Review the error logs
3. Test manual gphoto2 commands
4. Open an issue on GitHub

## 🔄 Documentation Updates

This documentation is maintained alongside the codebase. When adding new features:
1. Update the relevant platform-specific guide
2. Update the main README.md if needed
3. Update this index if adding new documentation files 