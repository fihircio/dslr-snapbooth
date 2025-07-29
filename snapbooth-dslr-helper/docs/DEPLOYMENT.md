# Deployment Guide for DSLR Snapbooth Helper

This guide covers deploying the DSLR Snapbooth Helper across different platforms and environments.

## Quick Start Options

### 1. Local Development (All Platforms)
```bash
# Clone and setup
git clone <repository-url>
cd snapbooth-dslr-helper
npm install

# Start development server
sudo ./start-dslr-helper.sh  # macOS/Linux
# or
start-dslr-helper-windows.bat  # Windows
```

### 2. Docker Deployment (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t dslr-helper .
docker run -p 3000:3000 --device=/dev/bus/usb dslr-helper
```

### 3. Production Deployment
```bash
# Using PM2 (Linux/macOS)
npm install -g pm2
pm2 start main.js --name "dslr-helper"

# Using systemd (Linux)
sudo systemctl enable dslr-helper
sudo systemctl start dslr-helper
```

## Platform-Specific Deployment

### macOS Deployment

#### Development
```bash
# Install dependencies
brew install gphoto2 node

# Setup project
cd snapbooth-dslr-helper
npm install

# Reset camera connection (if needed)
sudo ./reset-camera.sh

# Start development
sudo ./start-dslr-helper.sh
```

#### Production
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'dslr-helper',
    script: 'main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      DSLR_API_TOKEN: 'your_secure_token'
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Linux Deployment

#### Ubuntu/Debian
```bash
# Install system dependencies
sudo apt update
sudo apt install gphoto2 libgphoto2-dev nodejs npm

# Setup project
cd snapbooth-dslr-helper
npm install

# Create systemd service
sudo tee /etc/systemd/system/dslr-helper.service << EOF
[Unit]
Description=DSLR Snapbooth Helper
After=network.target

[Service]
Type=simple
User=dslr
WorkingDirectory=/opt/dslr-helper
ExecStart=/usr/bin/node main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=DSLR_API_TOKEN=your_secure_token

[Install]
WantedBy=multi-user.target
EOF

# Create user and setup
sudo useradd -r -s /bin/false dslr
sudo mkdir -p /opt/dslr-helper
sudo cp -r . /opt/dslr-helper/
sudo chown -R dslr:dslr /opt/dslr-helper

# Enable and start service
sudo systemctl enable dslr-helper
sudo systemctl start dslr-helper
```

#### CentOS/RHEL
```bash
# Install dependencies
sudo yum install epel-release
sudo yum install gphoto2 libgphoto2-devel nodejs npm

# Follow Ubuntu setup above
```

### Windows Deployment

#### WSL2 (Recommended)
```bash
# Install WSL2 and Ubuntu
wsl --install

# Follow Linux deployment instructions
# Use the Ubuntu terminal for all commands
```

#### Native Windows
```cmd
# Install Node.js from https://nodejs.org/
# Install gphoto2 Windows binaries

# Setup project
cd C:\path\to\dslr-snapbooth\snapbooth-dslr-helper
npm install

# Create Windows service
npm install -g node-windows
node-windows install --name "DSLR Helper" --description "DSLR Snapbooth Helper Service" --script main.js
```

## Docker Deployment

### Single Container
```bash
# Build image
docker build -t dslr-helper .

# Run container
docker run -d \
  --name dslr-helper \
  -p 3000:3000 \
  -e DSLR_API_TOKEN=your_token \
  -v $(pwd)/static:/app/static \
  --device=/dev/bus/usb \
  dslr-helper
```

### Docker Compose
```bash
# Create .env file
echo "DSLR_API_TOKEN=your_secure_token" > .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f dslr-helper
```

### Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml dslr-stack

# Scale service
docker service scale dslr-stack_dslr-helper=2
```

## Cloud Deployment

### AWS EC2
```bash
# Launch Ubuntu instance
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone <repository-url>
cd snapbooth-dslr-helper
docker-compose up -d
```

### Google Cloud Platform
```bash
# Create Compute Engine instance
gcloud compute instances create dslr-helper \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2004-lts

# SSH and deploy
gcloud compute ssh dslr-helper
# Follow Linux deployment instructions
```

### Azure
```bash
# Create VM
az vm create \
  --resource-group dslr-rg \
  --name dslr-helper \
  --image UbuntuLTS \
  --size Standard_B2s

# Deploy via SSH
az vm run-command invoke \
  --resource-group dslr-rg \
  --name dslr-helper \
  --command-id RunShellScript \
  --scripts "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
```

## Environment Configuration

### Environment Variables
```bash
# Required
DSLR_API_TOKEN=your_secure_token

# Optional
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
```

### Configuration Files
```bash
# Create .env file
cat > .env << EOF
DSLR_API_TOKEN=your_secure_token_here
NODE_ENV=production
PORT=3000
EOF
```

## Security Considerations

### API Token Security
```bash
# Generate secure token
openssl rand -base64 32

# Set environment variable
export DSLR_API_TOKEN=$(openssl rand -base64 32)
```

### Firewall Configuration
```bash
# Linux (ufw)
sudo ufw allow 3000/tcp

# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/node

# Windows
netsh advfirewall firewall add rule name="DSLR Helper" dir=in action=allow protocol=TCP localport=3000
```

### SSL/TLS Setup
```bash
# Install nginx
sudo apt install nginx

# Configure reverse proxy
sudo tee /etc/nginx/sites-available/dslr-helper << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/dslr-helper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring and Logging

### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs dslr-helper

# Restart service
pm2 restart dslr-helper
```

### Docker Monitoring
```bash
# View container logs
docker logs -f dslr-helper

# Monitor resource usage
docker stats dslr-helper

# Health check
docker inspect dslr-helper | grep Health -A 10
```

### System Monitoring
```bash
# Check service status
sudo systemctl status dslr-helper

# View system logs
sudo journalctl -u dslr-helper -f

# Monitor resource usage
htop
```

## Backup and Recovery

### Data Backup
```bash
# Backup static directory
tar -czf dslr-backup-$(date +%Y%m%d).tar.gz static/

# Backup configuration
cp .env .env.backup
cp ecosystem.config.js ecosystem.config.js.backup
```

### Docker Backup
```bash
# Backup volumes
docker run --rm -v dslr-helper_static:/data -v $(pwd):/backup alpine tar czf /backup/static-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v dslr-helper_static:/data -v $(pwd):/backup alpine tar xzf /backup/static-backup.tar.gz -C /data
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
sudo journalctl -u dslr-helper -n 50

# Check permissions
ls -la /opt/dslr-helper/

# Test manual start
cd /opt/dslr-helper && node main.js
```

#### Camera Not Detected
```bash
# Check USB devices
lsusb

# Test gphoto2 manually
gphoto2 --auto-detect

# Check camera permissions
sudo usermod -a -G video $USER
```

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
echo "PORT=3001" >> .env
```

### Performance Issues

#### High Memory Usage
```bash
# Monitor memory
free -h

# Restart service
pm2 restart dslr-helper

# Or increase memory limit
pm2 restart dslr-helper --max-memory-restart 2G
```

#### Slow Response Times
```bash
# Check CPU usage
top

# Monitor network
netstat -i

# Check disk I/O
iotop
```

## Scaling

### Horizontal Scaling
```bash
# Scale with PM2
pm2 scale dslr-helper 3

# Scale with Docker
docker service scale dslr-stack_dslr-helper=3

# Load balancer configuration
# Use nginx or haproxy for load balancing
```

### Vertical Scaling
```bash
# Increase memory limit
pm2 restart dslr-helper --max-memory-restart 4G

# Use larger instance types in cloud
# AWS: t3.medium -> t3.large
# GCP: e2-medium -> e2-standard-2
```

## Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Update Docker image
docker pull dslr-helper:latest

# Restart services
pm2 restart all
# or
docker-compose restart
```

### Log Rotation
```bash
# Configure logrotate
sudo tee /etc/logrotate.d/dslr-helper << EOF
/opt/dslr-helper/error.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 dslr dslr
}
EOF
```

## Support

For deployment issues:
- Check service logs
- Verify environment variables
- Test manual startup
- Review firewall configuration
- Contact support team 