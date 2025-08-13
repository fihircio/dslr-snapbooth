import React, { useEffect, useRef, useState } from 'react';

interface HDMILiveViewProps {
  mode?: 'hdmi' | 'gphoto2' | 'auto' | 'v002-direct' | 'uvc';
  width?: number;
  height?: number;
  onError?: (error: string) => void;
  onStatusChange?: (status: any) => void;
}

export function HDMILiveView({ 
  mode = 'auto', 
  width = 640, 
  height = 360,
  onError,
  onStatusChange 
}: HDMILiveViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('HDMI LiveView: WebSocket connected');
          setIsConnected(true);
          setError(null);
          
          // Send the appropriate live view request based on mode
          const message = {
            type: mode === 'hdmi' ? 'hdmi-liveview' : 
                  mode === 'gphoto2' ? 'liveview' : 
                  mode === 'v002-direct' ? 'v002-direct-liveview' :
                  mode === 'uvc' ? 'uvc-liveview' : 'auto-liveview'
          };
          
          ws.send(JSON.stringify(message));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'connected':
                console.log('HDMI LiveView: Connection established', data);
                break;
                
              case 'status':
                console.log('HDMI LiveView: Status update', data.data);
                setStatus(data.data);
                setIsStreaming(data.data.streaming || false);
                onStatusChange?.(data.data);
                break;
                
              case 'frame':
                if (data.data && imgRef.current) {
                  imgRef.current.src = 'data:image/jpeg;base64,' + data.data;
                }
                break;
                
              case 'error':
                console.error('HDMI LiveView: Error from server', data.error);
                setError(data.error);
                onError?.(data.error);
                
                // Check for camera conflict errors
                if (data.error && (
                  data.error.includes('camera') || 
                  data.error.includes('device') || 
                  data.error.includes('conflict') ||
                  data.error.includes('Unknown message type')
                )) {
                  console.log('🚨 Camera conflict detected');
                }
                break;
                
              default:
                console.log('HDMI LiveView: Unknown message type', data.type);
            }
          } catch (e) {
            console.error('HDMI LiveView: Failed to parse message', e);
            setError('Invalid message received');
          }
        };

        ws.onerror = (event) => {
          console.error('HDMI LiveView: WebSocket error', event);
          setError('WebSocket connection failed');
          setIsConnected(false);
          onError?.('WebSocket connection failed');
        };

        ws.onclose = (event) => {
          console.log('HDMI LiveView: WebSocket closed', event.code, event.reason);
          setIsConnected(false);
          setIsStreaming(false);
          setError(null);
        };

      } catch (error) {
        console.error('HDMI LiveView: Failed to create WebSocket', error);
        setError('Failed to connect to server');
        onError?.('Failed to connect to server');
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [mode, onError, onStatusChange]);

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (!isConnected) return 'Connecting...';
    if (!isStreaming) return 'Waiting for stream...';
    return 'Live View Active';
  };

  const getStatusColor = () => {
    if (error) return 'red';
    if (!isConnected) return 'orange';
    if (!isStreaming) return 'yellow';
    return 'green';
  };

  const getMethodDisplayName = () => {
    switch (mode) {
      case 'v002-direct': return 'v002 Camera Live Direct';
      case 'hdmi': return 'HDMI Input';
      case 'uvc': return 'UVC (EOS Webcam Utility)';
      case 'gphoto2': return 'gphoto2 Live View';
      case 'auto': return 'Auto (Smart Fallback)';
      default: return 'Live View';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '10px'
    }}>
      <div style={{
        position: 'relative',
        width: width,
        height: height,
        border: '2px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#000'
      }}>
        <img 
          ref={imgRef} 
          alt={`${getMethodDisplayName()} Live View`} 
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: isStreaming ? 'block' : 'none'
          }} 
        />
        
        {!isStreaming && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            {getStatusText()}
          </div>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        fontSize: '14px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getStatusColor()
        }} />
        <span>{getMethodDisplayName()}: {getStatusText()}</span>
      </div>
      
      {status && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          Method: {status.method || mode} | 
          Device: {status.device || 'Unknown'} | 
          Resolution: {status.resolution || 'Unknown'} | 
          FPS: {status.framerate || 'Unknown'}
        </div>
      )}
    </div>
  );
} 