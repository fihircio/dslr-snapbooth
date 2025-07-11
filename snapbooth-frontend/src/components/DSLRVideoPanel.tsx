import React, { useState } from 'react';
import { startDSLRVideo, stopDSLRVideo } from '../services/dslrService';

export function DSLRVideoPanel() {
  const [recording, setRecording] = useState(false);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setVideoFile(null);
    try {
      const result = await startDSLRVideo({});
      if (result.success) {
        setRecording(true);
      } else {
        setError(result.message || 'Failed to start recording');
      }
    } catch {
      setError('Failed to start recording');
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await stopDSLRVideo();
      if (result.success && result.filePath) {
        setRecording(false);
        setVideoFile(result.filePath);
      } else {
        setError(result.message || 'Failed to stop recording');
      }
    } catch {
      setError('Failed to stop recording');
    }
    setLoading(false);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3>Video Recording</h3>
      <div>
        <button onClick={handleStart} disabled={loading || recording}>
          Start Recording
        </button>
        <button onClick={handleStop} disabled={loading || !recording} style={{ marginLeft: 8 }}>
          Stop Recording
        </button>
      </div>
      {recording && <div style={{ color: 'red', marginTop: 8 }}>Recording...</div>}
      {videoFile && (
        <div style={{ marginTop: 8 }}>
          <a href={`/static/${videoFile}`} target="_blank" rel="noopener noreferrer">
            Download/View Video
          </a>
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
