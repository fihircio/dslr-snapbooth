// print/printer.js
// Handles printing of captured images

const { exec } = require('child_process');
const path = require('path');

async function printPhoto(filePath) {
  // Only allow jpg, jpeg, png
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return { success: false, message: 'Unsupported file type' };
  }
  return new Promise((resolve) => {
    exec(`lp "${filePath}"`, (error, stdout, stderr) => {
      if (error || stderr) {
        return resolve({ success: false, message: stderr || error.message });
      }
      resolve({ success: true, message: stdout.trim() });
    });
  });
}

module.exports = { printPhoto };

