// capture/controller.js
// Handles DSLR detection and photo capture using gphoto2

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function detectDSLR() {
  return new Promise((resolve) => {
    exec('gphoto2 --auto-detect', (error, stdout, stderr) => {
      if (error || stderr) {
        return resolve({ connected: false, model: null });
      }
      // Parse output for camera model
      const lines = stdout.split('\n').filter(Boolean);
      if (lines.length > 2) {
        // Skip header lines
        const modelLine = lines[2].trim();
        return resolve({ connected: true, model: modelLine });
      }
      resolve({ connected: false, model: null });
    });
  });
}

async function capturePhoto(options = {}) {
  const outputDir = path.join(__dirname, '../static');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filename = options.filename || `capture_${Date.now()}.jpg`;
  const filePath = path.join(outputDir, filename);

  // Build gphoto2 command
  let cmd = '';
  if (options.resolution) {
    cmd += `gphoto2 --set-config imageformat=${options.resolution} && `;
  }
  if (options.focus) {
    cmd += `gphoto2 --set-config focusmode=${options.focus} && `;
  }
  cmd += `gphoto2 --capture-image-and-download --filename=${filePath}`;

  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error || stderr) {
        return resolve({ success: false, filePath: null, base64: null });
      }
      resolve({ success: true, filePath, base64: null });
    });
  });
}

// Get all camera settings and their current values
async function getCameraSettings() {
  return new Promise((resolve) => {
    // List all configurable settings
    // This will return a long string; parse as needed in the route
    require('child_process').exec('gphoto2 --list-config', (err, stdout, stderr) => {
      if (err || stderr) return resolve({ success: false, error: stderr || err.message });
      const settings = stdout.split('\n').filter(Boolean);
      // For each setting, get its current value
      const promises = settings.map((setting) => new Promise((res) => {
        require('child_process').exec(`gphoto2 --get-config ${setting}`, (e, out, se) => {
          if (e || se) return res(null);
          // Parse out value
          const match = out.match(/Current:\s*(.*)/);
          res({ setting, value: match ? match[1] : null });
        });
      }));
      Promise.all(promises).then((results) => {
        resolve({ success: true, settings: results.filter(Boolean) });
      });
    });
  });
}

// Set a camera setting
async function setCameraSettings(settings = {}) {
  // settings: { iso: '...', aperture: '...', ... }
  const cmds = Object.entries(settings).map(([key, value]) => `gphoto2 --set-config ${key}=${value}`);
  return new Promise((resolve) => {
    require('child_process').exec(cmds.join(' && '), (err, stdout, stderr) => {
      if (err || stderr) return resolve({ success: false, error: stderr || err.message });
      resolve({ success: true });
    });
  });
}

// Burst/multi-shot capture
async function burstCapture({ count = 3, interval = 500, filename = 'burst' } = {}) {
  const outputDir = path.join(__dirname, '../static');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const shots = [];
  for (let i = 0; i < count; i++) {
    const shotName = `${filename}_${Date.now()}_${i + 1}.jpg`;
    const filePath = path.join(outputDir, shotName);
    // Capture image
    try {
      await new Promise((resolve, reject) => {
        exec(`gphoto2 --capture-image-and-download --filename=${filePath}`, (error, stdout, stderr) => {
          if (error || stderr) return reject(stderr || error.message);
          resolve();
        });
      });
      shots.push(filePath);
    } catch (e) {
      return { success: false, error: e, shots };
    }
    // Wait interval before next shot (except after last)
    if (i < count - 1) await new Promise(res => setTimeout(res, interval));
  }
  return { success: true, shots };
}

let videoProcess = null;
let videoFilePath = null;

// Start video recording
async function startVideoRecording({ filename = 'video_capture.mp4' } = {}) {
  const outputDir = path.join(__dirname, '../static');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  videoFilePath = path.join(outputDir, filename);
  return new Promise((resolve, reject) => {
    // Start gphoto2 --capture-movie (may require camera support)
    const { spawn } = require('child_process');
    videoProcess = spawn('gphoto2', ['--capture-movie', `--stdout`]);
    const fsStream = fs.createWriteStream(videoFilePath);
    videoProcess.stdout.pipe(fsStream);
    videoProcess.stderr.on('data', (data) => {
      // Optionally log errors
    });
    videoProcess.on('spawn', () => {
      resolve({ success: true, filePath: videoFilePath });
    });
    videoProcess.on('error', (err) => {
      videoProcess = null;
      reject({ success: false, error: err.message });
    });
  });
}

// Stop video recording
async function stopVideoRecording() {
  return new Promise((resolve) => {
    if (videoProcess) {
      videoProcess.kill('SIGINT');
      videoProcess = null;
      resolve({ success: true, filePath: videoFilePath });
    } else {
      resolve({ success: false, error: 'No video recording in progress' });
    }
  });
}

// List images on the camera
async function listCameraImages() {
  return new Promise((resolve) => {
    require('child_process').exec('gphoto2 --list-files', (err, stdout, stderr) => {
      if (err || stderr) return resolve({ success: false, error: stderr || err.message });
      // Parse output for file numbers and names
      const files = [];
      const lines = stdout.split('\n');
      for (const line of lines) {
        const match = line.match(/#(\d+)\s+(.+\.(jpg|jpeg|png|cr2|nef|arw|raw|mp4|mov))/i);
        if (match) {
          files.push({ number: match[1], name: match[2] });
        }
      }
      resolve({ success: true, files });
    });
  });
}

// Download a specific image from the camera
async function downloadCameraImage({ number, name }) {
  const outputDir = path.join(__dirname, '../static');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, name);
  return new Promise((resolve) => {
    require('child_process').exec(`gphoto2 --get-file ${number} --filename=${filePath}`, (err, stdout, stderr) => {
      if (err || stderr) return resolve({ success: false, error: stderr || err.message });
      resolve({ success: true, filePath });
    });
  });
}

module.exports = { detectDSLR, capturePhoto, getCameraSettings, setCameraSettings, burstCapture, startVideoRecording, stopVideoRecording, listCameraImages, downloadCameraImage };

