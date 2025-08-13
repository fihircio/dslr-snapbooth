const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// Token-based authentication middleware
// Set your token in the environment: export DSLR_API_TOKEN=yourtoken
app.use('/api', (req, res, next) => {
  const requiredToken = process.env.DSLR_API_TOKEN;
  if (!requiredToken) return res.status(500).json({ error: 'API token not set on server' });
  const token = req.headers['x-dslr-token'];
  if (token !== requiredToken) {
    return res.status(401).json({ error: 'Invalid or missing API token' });
  }
  next();
});

const statusRoute = require('./routes/status');
app.use('/api', statusRoute); // /api/status

const captureRoute = require('./routes/capture');
app.use('/api', captureRoute); // /api/capture

const printRoute = require('./routes/print');
app.use('/api', printRoute); // /api/print

const settingsRoute = require('./routes/settings');
app.use('/api', settingsRoute); // /api/settings

const burstRoute = require('./routes/burst');
app.use('/api', burstRoute); // /api/burst

const videoRoute = require('./routes/video');
app.use('/api', videoRoute); // /api/video/start, /api/video/stop

const imagesRoute = require('./routes/images');
app.use('/api', imagesRoute); // /api/images, /api/download

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Import all streaming methods
const { startLiveView, stopLiveView } = require('../stream/streamer');
const HDMIWebSocketHandler = require('../stream/hdmi-websocket');
const SyphonStreamer = require('../stream/syphon-streamer');
const V002DirectStreamer = require('../stream/v002-direct-streamer');
const UVCStreamer = require('../stream/uvc-streamer');

// Initialize streamers
const hdmiHandler = new HDMIWebSocketHandler({
  framerate: 30,
  resolution: '1920x1080',
  device: 'auto'
});

const syphonStreamer = new SyphonStreamer({
  serverName: 'v002 Camera Live',
  framerate: 30
});

const v002DirectStreamer = new V002DirectStreamer({
  v002AppPath: '/Applications/v002 Camera Live.app',
  outputDir: './static/v002_output',
  framerate: 30
});

const uvcStreamer = new UVCStreamer({
  deviceName: 'EOS Webcam Utility',
  framerate: 30,
  resolution: '1280x720'
});

// Smart live view selection with fallback
async function startSmartLiveView(ws, mode = 'auto') {
  const platform = os.platform();
  let activeMethod = null;

  try {
    // Priority 1: HDMI Input (most reliable)
    if ((mode === 'hdmi' || mode === 'auto')) {
      try {
        console.log('Attempting HDMI live view...');
        hdmiHandler.handleConnection(ws);
        activeMethod = 'hdmi';
        console.log('✅ HDMI live view started successfully');
        return 'hdmi';
        
      } catch (error) {
        console.log('❌ HDMI failed:', error.message);
        // Continue to next method
      }
    }

    // Priority 2: UVC (EOS Webcam Utility / virtual camera)
    if ((mode === 'uvc' || mode === 'auto')) {
      try {
        console.log('Attempting UVC live view...');
        await uvcStreamer.startStreaming();
        uvcStreamer.on('frame', (frameData) => {
          const base64Frame = frameData.toString('base64');
          ws.send(JSON.stringify({ type: 'frame', data: base64Frame, method: 'uvc', timestamp: Date.now() }));
        });
        uvcStreamer.on('error', (error) => {
          console.error('UVC error:', error);
          ws.send(JSON.stringify({ type: 'error', error: 'UVC streaming error: ' + error.message, method: 'uvc' }));
        });
        activeMethod = 'uvc';
        console.log('✅ UVC live view started successfully');
        ws.send(JSON.stringify({ type: 'status', data: { method: 'uvc', streaming: true, platform, latency: '~120ms', note: 'EOS Webcam Utility / virtual camera' } }));
        return 'uvc';
      } catch (error) {
        console.log('❌ UVC failed:', error.message);
      }
    }

    // Priority 3: v002 Direct (macOS only)
    if ((mode === 'v002-direct' || mode === 'auto') && platform === 'darwin') {
      try {
        console.log('Attempting v002 direct live view...');
        
        // Check if v002 Camera Live is running
        const isV002Running = await v002DirectStreamer.checkV002Availability();
        if (!isV002Running) {
          throw new Error('v002 Camera Live is not running. Please start it first.');
        }
        
        // Start v002 direct streaming
        await v002DirectStreamer.startStreaming();
        
        // Set up v002 direct frame handling
        v002DirectStreamer.on('frame', (frameData) => {
          const base64Frame = frameData.toString('base64');
          ws.send(JSON.stringify({
            type: 'frame',
            data: base64Frame,
            method: 'v002-direct',
            timestamp: Date.now()
          }));
        });

        v002DirectStreamer.on('error', (error) => {
          console.error('v002 Direct error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'v002 Direct streaming error: ' + error.message,
            method: 'v002-direct'
          }));
        });

        activeMethod = 'v002-direct';
        console.log('✅ v002 direct live view started successfully');
        
        ws.send(JSON.stringify({
          type: 'status',
          data: {
            method: 'v002-direct',
            streaming: true,
            platform: platform,
            latency: '~150ms',
            note: 'Direct v002 Camera Live integration'
          }
        }));
        
        return 'v002-direct';
        
      } catch (error) {
        console.log('❌ v002 direct failed:', error.message);
        // Continue to next method
      }
    }

    // Priority 4: Syphon (macOS only) - DEPRECATED
    if ((mode === 'syphon' || mode === 'auto') && platform === 'darwin') {
      try {
        console.log('Attempting Syphon live view...');
        await syphonStreamer.startStreaming();
        
        // Set up Syphon frame handling
        syphonStreamer.on('frame', (frameData) => {
          const base64Frame = frameData.toString('base64');
          ws.send(JSON.stringify({
            type: 'frame',
            data: base64Frame,
            method: 'syphon',
            timestamp: Date.now()
          }));
        });

        syphonStreamer.on('error', (error) => {
          console.error('Syphon error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Syphon streaming error: ' + error.message,
            method: 'syphon'
          }));
        });

        activeMethod = 'syphon';
        console.log('✅ Syphon live view started successfully');
        
        ws.send(JSON.stringify({
          type: 'status',
          data: {
            method: 'syphon',
            streaming: true,
            platform: platform,
            latency: '~120ms'
          }
        }));
        
        return 'syphon';
        
      } catch (error) {
        console.log('❌ Syphon failed:', error.message);
        // Continue to next method
      }
    }

    // Priority 5: gphoto2 Live View (fallback)
    if (mode === 'gphoto2' || mode === 'auto') {
      console.log('Attempting gphoto2 live view...');
      startLiveView(ws);
      activeMethod = 'gphoto2';
      console.log('✅ gphoto2 live view started (fallback)');
      
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          method: 'gphoto2',
          streaming: true,
          platform: platform,
          latency: '~300ms',
          note: 'Fallback method - may be unreliable on Canon 600D'
        }
      }));
      
      return 'gphoto2';
    }

    throw new Error('No live view method available');

  } catch (error) {
    console.error('All live view methods failed:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'All live view methods failed: ' + error.message
    }));
    return null;
  }
}

// WebSocket connection handler with smart fallback
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      
      switch (data.type) {
        case 'liveview':
          // Use gphoto2 live view (legacy)
          console.log('Starting gphoto2 live view');
          startLiveView(ws);
          break;
          
        case 'hdmi-liveview':
          // Use HDMI live view
          console.log('Starting HDMI live view');
          hdmiHandler.handleConnection(ws);
          break;
          
        case 'v002-direct-liveview':
          // Use v002 direct live view (macOS only)
          console.log('Starting v002 direct live view');
          if (os.platform() === 'darwin') {
            startSmartLiveView(ws, 'v002-direct');
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'v002 direct is only available on macOS'
            }));
          }
          break;

        case 'uvc-liveview':
          console.log('Starting UVC live view');
          startSmartLiveView(ws, 'uvc');
          break;
          
        case 'syphon-liveview':
          // Use Syphon live view (macOS only)
          console.log('Starting Syphon live view');
          if (os.platform() === 'darwin') {
            startSmartLiveView(ws, 'syphon');
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Syphon is only available on macOS'
            }));
          }
          break;
          
        case 'auto-liveview':
          // Smart fallback: Syphon → HDMI → gphoto2
          console.log('Starting auto live view (smart fallback)');
          startSmartLiveView(ws, 'auto');
          break;
          
        case 'get-methods':
          // Return available live view methods
           const methods = {
            gphoto2: true,
            hdmi: true,
            'v002-direct': os.platform() === 'darwin',
             syphon: os.platform() === 'darwin',
             uvc: true,
            auto: true
          };
          ws.send(JSON.stringify({
            type: 'methods',
            data: methods
          }));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
          ws.send(JSON.stringify({ 
            type: 'error', 
            error: `Unknown message type: ${data.type}` 
          }));
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Invalid message format' 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    stopLiveView(); // Stop gphoto2 live view
    // HDMI and Syphon handlers manage their own connections
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Send initial connection message with available methods
  ws.send(JSON.stringify({ 
    type: 'connected',
    message: 'WebSocket connection established',
    features: {
      gphoto2: true,
      hdmi: true,
      'v002-direct': os.platform() === 'darwin',
      syphon: os.platform() === 'darwin',
      auto: true
    },
    platform: os.platform()
  }));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  hdmiHandler.destroy();
  syphonStreamer.stopStreaming();
  v002DirectStreamer.stopStreaming();
      uvcStreamer.stopStreaming();
  wss.close();
  process.exit(0);
});

function start(port = 3000) {
  server.listen(port, () => {
    console.log(`snapbooth-dslr-helper API listening on port ${port}`);
    console.log('Available live view methods:');
    console.log('  - hdmi: Use HDMI input capture (cross-platform, recommended)');
    console.log('  - uvc: EOS Webcam Utility / virtual camera (no PTPCamera kill)');
    console.log('  - v002-direct: Enhanced gphoto2 wrapper (better reliability)');
    console.log('  - gphoto2: Use camera live view (fallback)');
    console.log('  - auto: Smart fallback (HDMI → UVC → v002-direct → syphon → gphoto2)');
    
    if (os.platform() === 'darwin') {
      console.log('\n💡 For Canon 600D users: HDMI input is most reliable!');
      console.log('ℹ️  UVC/v002 modes do not require killing PTPCamera');
    }
  });
}

module.exports = { app, start, wss, hdmiHandler, syphonStreamer };
