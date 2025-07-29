# Windows Setup Guide for DSLR Snapbooth Helper

This guide covers setting up the DSLR Snapbooth Helper on Windows systems.

## Option 1: WSL2 (Recommended)

WSL2 provides the best compatibility with gphoto2 and Linux tools.

### 1. Install WSL2

```powershell
# Open PowerShell as Administrator and run:
wsl --install
```

This will install Ubuntu by default. Restart your computer when prompted.

### 2. Install Ubuntu Dependencies

Open Ubuntu terminal and run:

```bash
# Update package list
sudo apt update

# Install gphoto2 and dependencies
sudo apt install gphoto2 libgphoto2-dev

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install npm if not included
sudo apt install npm
```

### 3. Clone and Setup Project

```bash
# Navigate to your project directory
cd /mnt/c/Users/YourUsername/path/to/dslr-snapbooth

# Install dependencies
npm install

# Set environment variable
export DSLR_API_TOKEN=your_secure_token_here
```

### 4. Test Camera Connection

```bash
# Test gphoto2 detection
gphoto2 --auto-detect

# Test manual capture
gphoto2 --capture-image-and-download --filename=test.jpg
```

### 5. Start the Helper

```bash
# Use the Linux startup script
sudo ./start-dslr-helper.sh
```

## Option 2: Native Windows (Advanced)

Native Windows setup requires additional tools and may have limited camera support.

### 1. Install Required Software

#### Install Node.js
Download and install from: https://nodejs.org/

#### Install gphoto2 for Windows
1. Download gphoto2 Windows binaries from: https://github.com/gphoto/libgphoto2/releases
2. Extract to a directory (e.g., `C:\gphoto2`)
3. Add to PATH: `C:\gphoto2\bin`

#### Alternative: Use Chocolatey
```powershell
# Install Chocolatey first, then:
choco install gphoto2
```

### 2. Install Camera Drivers

1. **Canon EOS Utility**: Install from Canon website
2. **Windows Camera Drivers**: Ensure your camera is recognized
3. **USB Drivers**: Install any camera-specific USB drivers

### 3. Setup Project

```cmd
# Navigate to project directory
cd C:\path\to\dslr-snapbooth\snapbooth-dslr-helper

# Install dependencies
npm install

# Set environment variable
set DSLR_API_TOKEN=your_secure_token_here
```

### 4. Test Camera Connection

```cmd
# Test gphoto2 detection
gphoto2 --auto-detect

# Test manual capture
gphoto2 --capture-image-and-download --filename=test.jpg
```

### 5. Start the Helper

```cmd
# Use the Windows batch script
start-dslr-helper-windows.bat

# Or run directly
npx nodemon main.js
```

## Option 3: Docker (Alternative)

Use Docker to run the helper in a Linux container.

### 1. Install Docker Desktop

Download and install from: https://www.docker.com/products/docker-desktop/

### 2. Create Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
FROM ubuntu:20.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    gphoto2 \
    libgphoto2-dev \
    nodejs \
    npm \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create static directory
RUN mkdir -p static

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "main.js"]
```

### 3. Build and Run

```cmd
# Build the image
docker build -t dslr-helper .

# Run the container
docker run -p 3000:3000 \
  -e DSLR_API_TOKEN=your_token \
  --device=/dev/bus/usb \
  dslr-helper
```

## Troubleshooting Windows Issues

### WSL2 Issues

#### Camera Not Detected in WSL2
```bash
# Check if camera is accessible
lsusb

# If camera shows up, try:
sudo gphoto2 --auto-detect
```

#### USB Device Access
```bash
# Add user to video group
sudo usermod -a -G video $USER

# Or run with sudo
sudo ./start-dslr-helper.sh
```

### Native Windows Issues

#### "gphoto2 not found" Error
1. Ensure gphoto2 is in your PATH
2. Try running from the gphoto2 installation directory
3. Check if antivirus is blocking the executable

#### Camera Permission Denied
1. Run Command Prompt as Administrator
2. Check Windows Camera privacy settings
3. Ensure no other apps are using the camera

#### USB Device Issues
1. Update camera drivers
2. Try different USB ports
3. Check Device Manager for camera recognition

### General Windows Issues

#### Node.js Version Issues
```cmd
# Check Node.js version
node --version

# Should be 18.17.0+ or 20+
# If not, update from https://nodejs.org/
```

#### Port Already in Use
```cmd
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <process_id> /F
```

## Windows-Specific Features

### PowerShell Scripts

Create `start-dslr-helper.ps1` for PowerShell:

```powershell
# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Please install from https://nodejs.org/"
    exit 1
}

# Set environment variable
if (!$env:DSLR_API_TOKEN) {
    $env:DSLR_API_TOKEN = "yourtoken"
    Write-Host "Using default API token. Set DSLR_API_TOKEN for production."
}

# Create static directory
if (!(Test-Path "static")) {
    New-Item -ItemType Directory -Path "static"
}

# Start the server
Write-Host "Starting DSLR Helper server..."
npx nodemon main.js
```

### Windows Service

Create a Windows service for production:

```cmd
# Install node-windows
npm install -g node-windows

# Create service script
node-windows install --name "DSLR Helper" --description "DSLR Snapbooth Helper Service" --script main.js
```

## Performance Optimization

### WSL2 Performance
```bash
# Create .wslconfig in Windows user directory
# C:\Users\YourUsername\.wslconfig
[wsl2]
memory=4GB
processors=4
swap=2GB
```

### Native Windows Performance
- Use SSD for better I/O performance
- Allocate sufficient RAM to Node.js
- Consider using PM2 for process management

## Security Considerations

### Windows Firewall
```cmd
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="DSLR Helper" dir=in action=allow protocol=TCP localport=3000
```

### Environment Variables
```cmd
# Set secure token
setx DSLR_API_TOKEN "your_secure_token_here"
```

## Testing on Windows

### Manual Testing
```cmd
# Test API endpoints
curl -X POST http://localhost:3000/api/capture ^
  -H "Content-Type: application/json" ^
  -H "X-DSLR-Token: yourtoken" ^
  -d "{\"filename\": \"test.jpg\"}"
```

### Frontend Integration
The React frontend works the same on Windows. Just ensure the backend is running and accessible.

## Production Deployment

### Windows Server
1. Install Windows Server 2019+
2. Follow native Windows setup
3. Use Windows Task Scheduler for auto-start
4. Configure Windows Firewall

### WSL2 Production
1. Use WSL2 with Ubuntu Server
2. Follow Linux production deployment
3. Use systemd for service management

## Support

For Windows-specific issues:
- Check Windows Event Viewer for errors
- Test with different USB ports
- Verify camera compatibility with gphoto2
- Check Windows Camera privacy settings 