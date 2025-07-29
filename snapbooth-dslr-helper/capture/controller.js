// capture/controller.js
// Handles DSLR detection and photo capture using gphoto2

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Helper function to kill PTPCamera and wait
async function killPTPCamera() {
  try {
    await execAsync('sudo killall PTPCamera');
    // Wait a moment for the process to fully terminate
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.log('PTPCamera not running or already killed');
  }
}

// Helper function to check if camera is accessible
async function checkCameraAccess() {
  try {
    const { stdout } = await execAsync('gphoto2 --auto-detect');
    return stdout.includes('Canon EOS');
  } catch {
    return false;
  }
}

// Enhanced capture function with retry logic
async function capturePhoto({ filename = 'dslr_photo.jpg', resolution, focus } = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalFilename = filename.replace('.jpg', `_${timestamp}.jpg`);
  const filePath = path.join(__dirname, '../static', finalFilename);

  try {
    // Step 1: Kill PTPCamera first
    await killPTPCamera();
    
    // Step 2: Wait and check camera access
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Try to detect camera
    const { stdout: detectOutput } = await execAsync('gphoto2 --auto-detect');
    if (!detectOutput.includes('Canon EOS')) {
      throw new Error('Camera not detected after PTPCamera cleanup');
    }

    // Step 4: Build gphoto2 command with options
    let cmd = 'gphoto2 --capture-image-and-download';
    if (filename) {
      cmd += ` --filename=${filePath}`;
    }
    if (resolution) {
      cmd += ` --set-config capturetarget=1`; // Set to memory card
    }

    // Step 5: Execute capture with sudo for better permissions
    const { stdout, stderr } = await execAsync(`sudo ${cmd}`);
    
    if (stderr && stderr.includes('ERROR')) {
      throw new Error(`Capture failed: ${stderr}`);
    }

    // Step 6: Verify file was created
    try {
      await fs.access(filePath);
    } catch {
      throw new Error('Captured file not found');
    }

    // Step 7: Read file as base64 for frontend
    const imageBuffer = await fs.readFile(filePath);
    const base64 = imageBuffer.toString('base64');

    return {
      success: true,
      filePath: finalFilename,
      base64,
      message: 'Photo captured successfully'
    };

  } catch (error) {
    console.error('Capture error:', error.message);
    
    // Log the error with timestamp
    const errorLog = `[${new Date().toISOString()}] ${error.message}\n`;
    await fs.appendFile(path.join(__dirname, '../error.log'), errorLog);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to capture photo. Check error.log for details.'
    };
  }
}

// Enhanced burst capture with better error handling
async function burstCapture({ count = 3, interval = 500, filename = 'burst' } = {}) {
  const images = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Kill PTPCamera before burst
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (let i = 0; i < count; i++) {
      const burstFilename = `${filename}_${i + 1}_${timestamp}.jpg`;
      const result = await capturePhoto({ filename: burstFilename });
      
      if (result.success) {
        images.push(result.filePath);
      } else {
        console.error(`Burst capture ${i + 1} failed:`, result.error);
      }
      
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    return {
      success: images.length > 0,
      images,
      message: `Captured ${images.length}/${count} images`
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      images: []
    };
  }
}

// Enhanced DSLR detection
async function detectDSLR() {
  try {
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { stdout } = await execAsync('gphoto2 --auto-detect');
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      if (line.includes('Canon EOS')) {
        const parts = line.trim().split(/\s+/);
        const model = parts.slice(0, -1).join(' '); // Everything except the port
        return {
          connected: true,
          model,
          port: parts[parts.length - 1]
        };
      }
    }
    
    return { connected: false, model: null };
    
  } catch (error) {
    console.error('DSLR detection error:', error.message);
    return { connected: false, model: null };
  }
}

// Enhanced settings functions
async function getCameraSettings() {
  try {
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { stdout } = await execAsync('gphoto2 --list-config');
    const settings = {};
    
    stdout.split('\n').forEach(line => {
      if (line.includes('/')) {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          settings[key] = value;
        }
      }
    });
    
    return { success: true, settings };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setCameraSettings(settings) {
  try {
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (const [key, value] of Object.entries(settings)) {
      await execAsync(`gphoto2 --set-config ${key}=${value}`);
    }
    
    return { success: true, message: 'Settings updated' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Enhanced image listing
async function listCameraImages() {
  try {
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { stdout } = await execAsync('gphoto2 --list-files');
    const images = [];
    
    stdout.split('\n').forEach(line => {
      if (line.includes('.JPG') || line.includes('.jpg')) {
        const match = line.match(/(\d+)\s+(.+\.(?:JPG|jpg))/);
        if (match) {
          images.push(match[2]);
        }
      }
    });
    
    return { success: true, images };
    
  } catch (error) {
    return { success: false, error: error.message, images: [] };
  }
}

// Enhanced image download
async function downloadCameraImage({ number, name }) {
  try {
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const downloadPath = path.join(__dirname, '../static', name);
    await execAsync(`gphoto2 --get-file ${number} --filename=${downloadPath}`);
    
    return { success: true, filePath: downloadPath };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Video recording functions
async function startVideoRecording({ filename = 'video.mov' } = {}) {
  try {
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start video recording
    await execAsync('gphoto2 --set-config capturemode=1'); // Set to movie mode
    await execAsync('gphoto2 --trigger-capture');
    
    return { success: true, message: 'Video recording started' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function stopVideoRecording() {
  try {
    await killPTPCamera();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Stop recording and download
    await execAsync('gphoto2 --trigger-capture');
    const { stdout } = await execAsync('gphoto2 --list-files');
    
    // Find the latest video file
    const lines = stdout.split('\n');
    let videoFile = null;
    
    for (const line of lines) {
      if (line.includes('.MOV') || line.includes('.mov')) {
        const match = line.match(/(\d+)\s+(.+\.(?:MOV|mov))/);
        if (match) {
          videoFile = match[2];
          break;
        }
      }
    }
    
    if (videoFile) {
      const downloadPath = path.join(__dirname, '../static', videoFile);
      await execAsync(`gphoto2 --get-file ${videoFile} --filename=${downloadPath}`);
      return { success: true, filePath: videoFile };
    }
    
    return { success: false, error: 'No video file found' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  capturePhoto,
  burstCapture,
  detectDSLR,
  getCameraSettings,
  setCameraSettings,
  listCameraImages,
  downloadCameraImage,
  startVideoRecording,
  stopVideoRecording
};

