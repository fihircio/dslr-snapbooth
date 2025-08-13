// stream/syphon-streamer.js
// Syphon-based live view streaming for macOS

const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const os = require('os');

class SyphonStreamer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      serverName: 'v002 Camera Live', // Default Syphon server name
      framerate: 30,
      resolution: '1920x1080',
      ...options
    };
    this.process = null;
    this.isStreaming = false;
    this.platform = os.platform();
  }

  async listSyphonServers() {
    if (this.platform !== 'darwin') {
      throw new Error('Syphon is only available on macOS');
    }

    return new Promise((resolve, reject) => {
      // Use SyphonInject to list available servers
      const syphon = spawn('SyphonInject', ['--list']);
      
      let output = '';
      syphon.stdout.on('data', (data) => {
        output += data.toString();
      });

      syphon.stderr.on('data', (data) => {
        output += data.toString();
      });

      syphon.on('close', (code) => {
        if (code === 0) {
          const servers = output.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
          resolve(servers);
        } else {
          reject(new Error(`SyphonInject exited with code ${code}`));
        }
      });

      syphon.on('error', (error) => {
        reject(error);
      });
    });
  }

  async startStreaming() {
    if (this.isStreaming) {
      console.log('Syphon streaming already active');
      return;
    }

    if (this.platform !== 'darwin') {
      throw new Error('Syphon streaming is only available on macOS');
    }

    try {
      // List available Syphon servers
      const servers = await this.listSyphonServers();
      console.log('Available Syphon servers:', servers);

      if (servers.length === 0) {
        throw new Error('No Syphon servers found. Make sure v002 Camera Live is running.');
      }

      // Find the camera live server
      const cameraServer = servers.find(server => 
        server.includes('Camera Live') || 
        server.includes('v002') ||
        server.includes('Canon')
      ) || servers[0];

      console.log(`Using Syphon server: ${cameraServer}`);

      // Use SyphonInject to capture frames
      const args = [
        '--server', cameraServer,
        '--output', 'pipe:1',
        '--format', 'mjpeg',
        '--framerate', this.options.framerate.toString()
      ];

      console.log('Starting Syphon stream with args:', args.join(' '));

      this.process = spawn('SyphonInject', args);
      this.isStreaming = true;

      this.process.stdout.on('data', (data) => {
        // Emit frame data
        this.emit('frame', data);
      });

      this.process.stderr.on('data', (data) => {
        const message = data.toString();
        if (message.includes('Error') || message.includes('error')) {
          console.error('Syphon Error:', message);
        }
      });

      this.process.on('close', (code) => {
        this.isStreaming = false;
        if (code !== 0) {
          console.error(`Syphon stream stopped with code ${code}`);
        }
        this.emit('stopped', code);
      });

      this.process.on('error', (error) => {
        console.error('Syphon stream error:', error);
        this.isStreaming = false;
        this.emit('error', error);
      });

      this.emit('started');
      console.log('Syphon streaming started successfully');

    } catch (error) {
      console.error('Failed to start Syphon streaming:', error);
      this.emit('error', error);
      throw error;
    }
  }

  stopStreaming() {
    if (this.process) {
      console.log('Stopping Syphon streaming...');
      this.process.kill('SIGTERM');
      
      // Force kill after 5 seconds if not stopped
      setTimeout(() => {
        if (this.process) {
          console.log('Force killing Syphon stream...');
          this.process.kill('SIGKILL');
        }
      }, 5000);
      
      this.process = null;
    }
    this.isStreaming = false;
  }

  getStatus() {
    return {
      isStreaming: this.isStreaming,
      platform: this.platform,
      serverName: this.options.serverName,
      framerate: this.options.framerate,
      resolution: this.options.resolution
    };
  }
}

module.exports = SyphonStreamer; 