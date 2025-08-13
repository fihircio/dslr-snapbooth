import React, { useState, useEffect } from 'react';
import { HDMILiveView } from './HDMILiveView';

export function SyphonTestPanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Test WebSocket connection
    const testConnection = () => {
      try {
        const ws = new WebSocket('ws://localhost:3000');
        
        ws.onopen = () => {
          setIsConnected(true);
          setServerStatus('Connected to DSLR Helper');
          
          // Request available methods
          ws.send(JSON.stringify({ type: 'get-methods' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'methods') {
              console.log('Available methods:', data.data);
              if (data.data.syphon) {
                setServerStatus('Syphon support available');
              } else {
                setServerStatus('Syphon not available (macOS only)');
              }
            }
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          setServerStatus('Failed to connect to DSLR Helper');
        };

        ws.onclose = () => {
          setIsConnected(false);
          setServerStatus('Connection closed');
        };

        return () => ws.close();
      } catch (error) {
        setIsConnected(false);
        setServerStatus('Connection error');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      border: '2px solid #007bff', 
      padding: '20px', 
      borderRadius: '8px', 
      maxWidth: '800px',
      margin: '20px auto',
      background: '#f8f9fa'
    }}>
      <h2 style={{ color: '#007bff', marginBottom: '16px' }}>
        🎥 Syphon Live View Test Panel
      </h2>
      
      <div style={{ marginBottom: '16px' }}>
        <strong>Status:</strong> {serverStatus}
        <br />
        <strong>Connection:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>

      <div style={{ 
        background: '#e3f2fd', 
        padding: '12px', 
        borderRadius: '4px', 
        marginBottom: '16px',
        fontSize: '14px'
      }}>
        <strong>📋 Setup Instructions:</strong>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Download <a href="https://github.com/v002/v002-Camera-Live/releases" target="_blank" rel="noopener noreferrer">v002 Camera Live</a></li>
          <li>Connect your Canon DSLR via USB</li>
          <li>Launch v002 Camera Live and start live view</li>
          <li>Install SyphonInject: <code>brew install syphon-inject</code></li>
          <li>Start the DSLR helper: <code>sudo ./start-dslr-helper.sh</code></li>
        </ol>
      </div>

      <div style={{ 
        background: '#fff3cd', 
        padding: '12px', 
        borderRadius: '4px', 
        marginBottom: '16px',
        fontSize: '14px'
      }}>
        <strong>💡 For Canon 600D Users:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Syphon provides much better reliability than gphoto2 live view</li>
          <li>Expected latency: ~120ms (vs ~500ms with gphoto2)</li>
          <li>Direct Canon SDK access via v002 Camera Live</li>
          <li>No HDMI capture device required</li>
        </ul>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '8px' }}>Live View Test</h3>
        <HDMILiveView 
          mode="syphon"
          width={640}
          height={360}
          onError={(error) => {
            console.error('Syphon error:', error);
            setServerStatus(`Error: ${error}`);
          }}
          onStatusChange={(status) => {
            console.log('Syphon status:', status);
            if (status?.method) {
              setServerStatus(`Active: ${status.method} (${status.latency || 'Unknown'} latency)`);
            }
          }}
        />
      </div>

      <div style={{ 
        background: '#d4edda', 
        padding: '12px', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>✅ Success Indicators:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Live view image appears in the frame above</li>
          <li>Status shows "Active: syphon" with latency info</li>
          <li>No error messages in the status</li>
          <li>Smooth, responsive video feed</li>
        </ul>
      </div>

      <div style={{ 
        background: '#f8d7da', 
        padding: '12px', 
        borderRadius: '4px',
        marginTop: '16px',
        fontSize: '14px'
      }}>
        <strong>❌ Troubleshooting:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li><strong>No connection:</strong> Check if DSLR helper is running</li>
          <li><strong>No Syphon servers:</strong> Make sure v002 Camera Live is running</li>
          <li><strong>Camera not detected:</strong> Check USB connection and camera mode</li>
          <li><strong>Permission errors:</strong> Run <code>sudo ./reset-camera.sh</code></li>
        </ul>
      </div>
    </div>
  );
} 