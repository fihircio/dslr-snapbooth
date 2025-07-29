// stream/streamer.js
// Handles live view streaming from DSLR

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

let liveViewInterval = null;

function startLiveView(ws) {
  // Poll every 500ms for a new frame
  liveViewInterval = setInterval(() => {
    const framePath = path.join(__dirname, '../static/liveview.jpg');
    // gphoto2 --capture-movie-frame --filename=framePath
    exec(`gphoto2 --capture-movie-frame --filename=${framePath}`, (error, stdout, stderr) => {
      if (!error && fs.existsSync(framePath)) {
        const img = fs.readFileSync(framePath);
        const base64 = img.toString('base64');
        ws.send(JSON.stringify({ type: 'frame', data: base64 }));
        fs.unlinkSync(framePath); // Clean up
      } else {
        // If gphoto2 not available, send a dummy frame
        ws.send(JSON.stringify({ type: 'frame', data: null, error: 'No frame' }));
      }
    });
  }, 500);
}

function stopLiveView() {
  if (liveViewInterval) {
    clearInterval(liveViewInterval);
    liveViewInterval = null;
  }
}

module.exports = { startLiveView, stopLiveView };

