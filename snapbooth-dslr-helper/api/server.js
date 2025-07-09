const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const statusRoute = require('./routes/status');
app.use('/api', statusRoute); // /api/status

const captureRoute = require('./routes/capture');
app.use('/api', captureRoute); // /api/capture

const printRoute = require('./routes/print');
app.use('/api', printRoute); // /api/print

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
