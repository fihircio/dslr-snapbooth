// stream/uvc-streamer.js
// UVC virtual camera capture (e.g., EOS Webcam Utility) using FFmpeg

const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const os = require('os');

class UVCStreamer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      framerate: 30,
      resolution: '1280x720',
      deviceName: 'EOS Webcam Utility',
      device: 'auto',
      preset: 'ultrafast',
      tune: 'zerolatency',
      crf: 23,
      ...options
    };
    this.ffmpegProcess = null;
    this.isStreaming = false;
    this.platform = os.platform();
  }

  async detectDeviceByName() {
    return new Promise((resolve, reject) => {
      let command, args;

      if (this.platform === 'darwin') {
        command = 'ffmpeg';
        args = ['-f', 'avfoundation', '-list_devices', 'true', '-i', ''];
      } else if (this.platform === 'linux') {
        command = 'v4l2-ctl';
        args = ['--list-devices'];
      } else {
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
        if (code !== 0 && this.platform !== 'darwin' && this.platform !== 'win32') {
          // ffmpeg exits with 1 on list in macOS/Windows; v4l2-ctl should exit 0
          return reject(new Error(`Device detection failed with code ${code}`));
        }

        const lines = output.split('\n');
        const name = this.options.deviceName;

        if (this.platform === 'darwin') {
          // Look for a line containing the device name and extract the preceding [index]
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(name.toLowerCase())) {
              const match = lines[i].match(/\[(\d+)\]/);
              if (match) {
                // Use video index with no audio: index:None
                return resolve(`${match[1]}:none`);
              }
            }
          }
        } else if (this.platform === 'linux') {
          // Find /dev/videoX belonging to the device name
          let currentName = null;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.startsWith('\t') && line.trim()) {
              currentName = line.trim();
            }
            if (currentName && currentName.toLowerCase().includes(name.toLowerCase())) {
              const match = lines[i + 1] && lines[i + 1].match(/\s*(\/dev\/video\d+)/);
              if (match) return resolve(match[1]);
            }
          }
        } else {
          // Windows dshow: use exact device name
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(name.toLowerCase())) {
              return resolve(name);
            }
          }
        }

        resolve(null);
      });

      detect.on('error', (error) => {
        reject(error);
      });
    });
  }

  async startStreaming() {
    if (this.isStreaming) {
      console.log('UVC streaming already active');
      return;
    }

    try {
      if (this.options.device === 'auto') {
        this.options.device = await this.detectDeviceByName();
        if (!this.options.device) {
          throw new Error(`UVC device not found: ${this.options.deviceName}`);
        }
        console.log(`Using UVC device: ${this.options.device} (${this.options.deviceName})`);
      }

      const args = this.buildFFmpegArgs();
      console.log('Starting UVC stream with args:', args.join(' '));

      this.ffmpegProcess = spawn('ffmpeg', args);
      this.isStreaming = true;

      this.ffmpegProcess.stdout.on('data', (data) => {
        this.emit('frame', data);
      });

      this.ffmpegProcess.stderr.on('data', (data) => {
        const message = data.toString();
        if (message.includes('Error') || message.includes('error')) {
          console.error('FFmpeg UVC Error:', message);
        }
      });

      this.ffmpegProcess.on('close', (code) => {
        this.isStreaming = false;
        if (code !== 0) {
          console.error(`UVC stream stopped with code ${code}`);
        }
        this.emit('stopped', code);
      });

      this.ffmpegProcess.on('error', (error) => {
        console.error('UVC stream error:', error);
        this.isStreaming = false;
        this.emit('error', error);
      });

      this.emit('started');
      console.log('UVC streaming started successfully');

    } catch (error) {
      console.error('Failed to start UVC streaming:', error);
      this.emit('error', error);
      throw error;
    }
  }

  buildFFmpegArgs() {
    const args = [];

    if (this.platform === 'darwin') {
      args.push(
        '-f', 'avfoundation',
        '-framerate', this.options.framerate.toString(),
        '-video_size', this.options.resolution,
        '-i', this.options.device
      );
    } else if (this.platform === 'linux') {
      args.push(
        '-f', 'v4l2',
        '-framerate', this.options.framerate.toString(),
        '-video_size', this.options.resolution,
        '-i', this.options.device
      );
    } else {
      // Windows dshow
      args.push(
        '-f', 'dshow',
        '-framerate', this.options.framerate.toString(),
        '-video_size', this.options.resolution,
        '-i', `video=${this.options.device}`
      );
    }

    // Encode to MJPEG for lightweight transport over WebSocket
    args.push(
      '-f', 'mjpeg',
      'pipe:1'
    );

    return args;
  }

  stopStreaming() {
    if (this.ffmpegProcess) {
      console.log('Stopping UVC streaming...');
      this.ffmpegProcess.kill('SIGTERM');
      setTimeout(() => {
        if (this.ffmpegProcess) {
          console.log('Force killing UVC stream...');
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
      deviceName: this.options.deviceName,
      platform: this.platform,
      framerate: this.options.framerate,
      resolution: this.options.resolution
    };
  }
}

module.exports = UVCStreamer;


