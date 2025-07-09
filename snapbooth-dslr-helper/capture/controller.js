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

module.exports = { detectDSLR, capturePhoto };

