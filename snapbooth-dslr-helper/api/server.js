const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

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

const { startLiveView, stopLiveView } = require('../stream/streamer');

// Placeholder for WebSocket logic
wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'liveview') {
        startLiveView(ws);
      }
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid message' }));
    }
  });
  ws.on('close', () => {
    stopLiveView();
  });
  ws.send('WebSocket connection established');
});

function start(port = 3000) {
  server.listen(port, () => {
    console.log(`snapbooth-dslr-helper API listening on port ${port}`);
  });
}

module.exports = { app, start, wss };
