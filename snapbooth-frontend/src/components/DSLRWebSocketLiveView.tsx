import React, { useEffect, useRef } from 'react';

export function DSLRWebSocketLiveView() {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    ws.onopen = () => ws.send(JSON.stringify({ type: 'liveview' }));
    ws.onmessage = (msg) => {
      let data;
      try {
        data = JSON.parse(msg.data);
      } catch {
        return;
      }
      if (data.type === 'frame' && data.data && imgRef.current) {
        imgRef.current.src = 'data:image/jpeg;base64,' + data.data;
      }
    };
    return () => ws.close();
  }, []);

  return <img ref={imgRef} alt="DSLR Live View" style={{ width: 640, border: '1px solid #ccc' }} />;
} 