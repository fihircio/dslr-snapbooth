// stream/hdmi-websocket.js
// HDMI WebSocket handler for multiple clients

const HDMIStreamer = require('./hdmi-streamer');

class HDMIWebSocketHandler {
  constructor(options = {}) {
    this.streamer = new HDMIStreamer(options);
    this.clients = new Set();
    this.frameBuffer = null;
    this.lastFrameTime = 0;
    this.frameRate = options.frameRate || 30;
    this.frameInterval = 1000 / this.frameRate;
  }

  handleConnection(ws) {
    console.log('New HDMI WebSocket client connected');
    this.clients.add(ws);
    
    // Send initial status
    ws.send(JSON.stringify({
      type: 'status',
      data: {
        connected: true,
        streaming: this.streamer.isStreaming,
        device: this.streamer.options.device,
        framerate: this.streamer.options.framerate,
        resolution: this.streamer.options.resolution
      }
    }));

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        this.handleMessage(ws, data);
      } catch (e) {
        console.error('Invalid WebSocket message:', e);
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      console.log('HDMI WebSocket client disconnected');
      this.clients.delete(ws);
      
      // Stop streaming if no clients left
      if (this.clients.size === 0) {
        this.stopStreaming();
      }
    });

    ws.on('error', (error) => {
      console.error('HDMI WebSocket error:', error);
      this.clients.delete(ws);
    });

    // Send initial frame if available
    if (this.frameBuffer) {
      this.sendFrameToClient(ws, this.frameBuffer);
    }
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'hdmi-liveview':
        this.startStreaming();
        break;
        
      case 'stop-liveview':
        this.stopStreaming();
        break;
        
      case 'get-status':
        ws.send(JSON.stringify({
          type: 'status',
          data: this.streamer.getStatus()
        }));
        break;
        
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Unknown message type' 
        }));
    }
  }

  async startStreaming() {
    if (this.streamer.isStreaming) {
      console.log('HDMI streaming already active');
      return;
    }

    try {
      // Set up frame handling
      this.streamer.on('frame', (frameData) => {
        this.handleFrame(frameData);
      });

      this.streamer.on('error', (error) => {
        console.error('HDMI streamer error:', error);
        this.broadcastError('HDMI streaming error: ' + error.message);
      });

      this.streamer.on('stopped', (code) => {
        console.log('HDMI streaming stopped');
        this.broadcastStatus({ streaming: false });
      });

      // Start the stream
      await this.streamer.startStreaming();
      this.broadcastStatus({ streaming: true });
      
    } catch (error) {
      console.error('Failed to start HDMI streaming:', error);
      this.broadcastError('Failed to start HDMI streaming: ' + error.message);
    }
  }

  handleFrame(frameData) {
    const now = Date.now();
    
    // Rate limiting to prevent overwhelming clients
    if (now - this.lastFrameTime < this.frameInterval) {
      return;
    }
    
    this.frameBuffer = frameData;
    this.lastFrameTime = now;
    
    // Send frame to all connected clients
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        this.sendFrameToClient(client, frameData);
      }
    });
  }

  sendFrameToClient(client, frameData) {
    try {
      const base64Frame = frameData.toString('base64');
      client.send(JSON.stringify({
        type: 'frame',
        data: base64Frame,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error sending frame to client:', error);
      // Remove problematic client
      this.clients.delete(client);
    }
  }

  stopStreaming() {
    if (this.streamer.isStreaming) {
      console.log('Stopping HDMI streaming...');
      this.streamer.stopStreaming();
      this.broadcastStatus({ streaming: false });
    }
  }

  broadcastStatus(status) {
    const message = JSON.stringify({
      type: 'status',
      data: { ...this.streamer.getStatus(), ...status }
    });
    
    this.clients.forEach(client => {
      if (client.readyState === 1) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Error broadcasting status:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  broadcastError(error) {
    const message = JSON.stringify({
      type: 'error',
      error: error
    });
    
    this.clients.forEach(client => {
      if (client.readyState === 1) {
        try {
          client.send(message);
        } catch (e) {
          this.clients.delete(client);
        }
      }
    });
  }

  getStatus() {
    return {
      clients: this.clients.size,
      streaming: this.streamer.isStreaming,
      ...this.streamer.getStatus()
    };
  }

  // Clean up all resources
  destroy() {
    this.stopStreaming();
    this.clients.clear();
    this.frameBuffer = null;
  }
}

module.exports = HDMIWebSocketHandler; 