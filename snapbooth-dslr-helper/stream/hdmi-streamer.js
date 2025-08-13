// stream/hdmi-streamer.js
// HDMI input capture and streaming using FFmpeg

const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const os = require('os');

class HDMIStreamer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      framerate: 30,
      resolution: '1920x1080',
      device: 'auto', // or specific device path
      preset: 'ultrafast',
      tune: 'zerolatency',
      crf: 23,
      ...options
    };
    this.ffmpegProcess = null;
    this.isStreaming = false;
    this.platform = os.platform();
  }

  async detectDevice() {
    return new Promise((resolve, reject) => {
      let command, args;
      
      if (this.platform === 'darwin') {
        // macOS
        command = 'ffmpeg';
        args = ['-f', 'avfoundation', '-list_devices', 'true', '-i', ''];
      } else if (this.platform === 'linux') {
        // Linux
        command = 'v4l2-ctl';
        args = ['--list-devices'];
      } else {
        // Windows
        command = 'ffmpeg';
        args = ['-f', 'dshow', '-list_devices', 'true', '-i', 'dummy'];
      }

      const detect = spawn(command, args);

      let output = '';
      detect.stdout.on('data', (data) => {
        output += data.toString();
      });

      detect.stderr.on('data', (data) => {
        output += data.toString();
      });

      detect.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Device detection failed with code ${code}`));
          return;
        }

        // Parse output to find HDMI capture device
        const lines = output.split('\n');
        let hdmiDevice = null;

        if (this.platform === 'darwin') {
          // macOS: Look for capture devices
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('Capture') && !line.includes('Audio')) {
              // Extract device index
              const match = line.match(/\[(\d+):(\d+)\]/);
              if (match) {
                hdmiDevice = `${match[1]}:${match[2]}`;
                break;
              }
            }
          }
        } else if (this.platform === 'linux') {
          // Linux: Look for video devices
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('video') && (line.includes('USB') || line.includes('HDMI'))) {
              const match = line.match(/\/dev\/video\d+/);
              if (match) {
                hdmiDevice = match[0];
                break;
              }
            }
          }
        }

        resolve(hdmiDevice);
      });

      detect.on('error', (error) => {
        reject(error);
      });
    });
  }

  async startStreaming() {
    if (this.isStreaming) {
      console.log('HDMI streaming already active');
      return;
    }

    try {
      // Auto-detect device if not specified
      if (this.options.device === 'auto') {
        this.options.device = await this.detectDevice();
        if (!this.options.device) {
          throw new Error('No HDMI capture device detected');
        }
        console.log(`Using HDMI device: ${this.options.device}`);
      }

      const args = this.buildFFmpegArgs();
      console.log('Starting HDMI stream with args:', args.join(' '));

      this.ffmpegProcess = spawn('ffmpeg', args);
      this.isStreaming = true;

      this.ffmpegProcess.stdout.on('data', (data) => {
        // Emit frame data
        this.emit('frame', data);
      });

      this.ffmpegProcess.stderr.on('data', (data) => {
        const message = data.toString();
        // Only log errors, not info messages
        if (message.includes('Error') || message.includes('error')) {
          console.error('FFmpeg HDMI Error:', message);
        }
      });

      this.ffmpegProcess.on('close', (code) => {
        this.isStreaming = false;
        if (code !== 0) {
          console.error(`HDMI stream stopped with code ${code}`);
        }
        this.emit('stopped', code);
      });

      this.ffmpegProcess.on('error', (error) => {
        console.error('HDMI stream error:', error);
        this.isStreaming = false;
        this.emit('error', error);
      });

      this.emit('started');
      console.log('HDMI streaming started successfully');

    } catch (error) {
      console.error('Failed to start HDMI streaming:', error);
      this.emit('error', error);
      throw error;
    }
  }

  buildFFmpegArgs() {
    const args = [];

    if (this.platform === 'darwin') {
      // macOS
      args.push(
        '-f', 'avfoundation',
        '-framerate', this.options.framerate.toString(),
        '-video_size', this.options.resolution,
        '-i', this.options.device
      );
    } else if (this.platform === 'linux') {
      // Linux
      args.push(
        '-f', 'v4l2',
        '-framerate', this.options.framerate.toString(),
        '-video_size', this.options.resolution,
        '-i', this.options.device
      );
    } else {
      // Windows
      args.push(
        '-f', 'dshow',
        '-framerate', this.options.framerate.toString(),
        '-video_size', this.options.resolution,
        '-i', `video=${this.options.device}`
      );
    }

    // Encoding settings
    args.push(
      '-c:v', 'libx264',
      '-preset', this.options.preset,
      '-tune', this.options.tune,
      '-crf', this.options.crf.toString(),
      '-f', 'mjpeg',
      'pipe:1'
    );

    return args;
  }

  stopStreaming() {
    if (this.ffmpegProcess) {
      console.log('Stopping HDMI streaming...');
      this.ffmpegProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if not stopped
      setTimeout(() => {
        if (this.ffmpegProcess) {
          console.log('Force killing HDMI stream...');
          this.ffmpegProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this.ffmpegProcess = null;
    }
    this.isStreaming = false;
  }

  getStatus() {
    return {
      isStreaming: this.isStreaming,
      device: this.options.device,
      platform: this.platform,
      framerate: this.options.framerate,
      resolution: this.options.resolution
    };
  }
}

module.exports = HDMIStreamer; 