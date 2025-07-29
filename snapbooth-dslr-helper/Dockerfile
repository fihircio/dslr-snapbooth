FROM ubuntu:20.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gphoto2 \
    libgphoto2-dev \
    curl \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create static directory for captured photos
RUN mkdir -p static

# Create non-root user for security
RUN useradd -r -s /bin/false dslruser \
    && chown -R dslruser:dslruser /app

# Switch to non-root user
USER dslruser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/status || exit 1

# Start the application
CMD ["node", "main.js"] 