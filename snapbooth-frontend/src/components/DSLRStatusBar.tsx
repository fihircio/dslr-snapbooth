import React, { useEffect, useState } from 'react';
import { checkDSLRHelperStatus } from '../services/dslrService';

export function DSLRStatusBar() {
  const [status, setStatus] = useState<{ running: boolean; connected: boolean; model?: string }>({ running: false, connected: false });

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      const s = await checkDSLRHelperStatus();
      if (mounted) setStatus(s);
    };
    poll();
    const interval = setInterval(poll, 5000); // poll every 5s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  let message = '';
  let details = '';
  let icon = '';
  let bg = '#ffe0e0';
  let color = 'red';
  if (!status.running) {
    message = 'DSLR Helper not detected';
    details = 'The backend service is not running or unreachable.';
    icon = '❌';
  } else if (status.running && !status.connected) {
    message = 'DSLR Helper running, but no camera detected';
    details = 'The backend is running, but no DSLR camera is connected or powered on.';
    icon = '⚠️';
    bg = '#fffbe0';
    color = '#bfa100';
  } else if (status.running && status.connected) {
    message = `DSLR Helper running (${status.model})`;
    details = 'DSLR features are available.';
    icon = '✅';
    bg = '#e0ffe0';
    color = 'green';
  }

  return (
    <div
      aria-live="polite"
      style={{
        background: bg,
        color,
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span>
        {message}
        <div style={{ fontWeight: 400, fontSize: 14, color: '#333' }}>{details}</div>
      </span>
    </div>
  );
} 