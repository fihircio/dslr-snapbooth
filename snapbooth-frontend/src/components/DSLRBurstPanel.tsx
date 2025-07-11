import React, { useState } from 'react';
import { burstDSLRPhotos } from '../services/dslrService';

export function DSLRBurstPanel() {
  const [count, setCount] = useState(3);
  const [intervalMs, setIntervalMs] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const handleBurst = async () => {
    setLoading(true);
    setError(null);
    setImages([]);
    try {
      const result = await burstDSLRPhotos({ count, intervalMs });
      if (result.success && Array.isArray(result.images)) {
        setImages(result.images);
      } else {
        setError(result.message || 'Burst capture failed');
      }
    } catch (err) {
      setError('Burst capture failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3>Burst / Multi-Shot Capture</h3>
      <div style={{ marginBottom: 8 }}>
        <label>
          Count:
          <input type="number" min={1} max={20} value={count} onChange={e => setCount(Number(e.target.value))} disabled={loading} style={{ width: 60, marginLeft: 8 }} />
        </label>
        <label style={{ marginLeft: 16 }}>
          Interval (ms):
          <input type="number" min={0} max={5000} value={intervalMs} onChange={e => setIntervalMs(Number(e.target.value))} disabled={loading} style={{ width: 80, marginLeft: 8 }} />
        </label>
        <button onClick={handleBurst} disabled={loading} style={{ marginLeft: 16 }}>
          {loading ? 'Capturing...' : 'Start Burst'}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {images.length > 0 && (
        <div>
          <div>Burst Images:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {images.map((img, idx) => (
              <img key={idx} src={`/static/${img}`} alt={`Burst ${idx + 1}`} style={{ maxWidth: 120, border: '1px solid #aaa' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 