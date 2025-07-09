import React, { useState, useEffect } from 'react';
import { getDSLRStatus, captureDSLRPhoto, printDSLRPhoto } from '../services/dslrService';
import { DSLRWebSocketLiveView } from './DSLRWebSocketLiveView';
import { uploadPhotoToPHP } from '../services/uploadService';

export function DSLRPanel() {
  const [status, setStatus] = useState<{ connected: boolean, model: string | null } | null>(null);
  const [captureResult, setCaptureResult] = useState<{ success: boolean, filePath: string | null, base64: string | null } | null>(null);
  const [filename, setFilename] = useState('dslr_photo.jpg');
  const [resolution, setResolution] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [printMsg, setPrintMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    getDSLRStatus().then(setStatus);
  }, []);

  const handleCapture = async () => {
    setLoading(true);
    setCaptureResult(null);
    setUploadMsg('');
    const result = await captureDSLRPhoto({ filename, resolution, focus });
    setCaptureResult(result);
    setLoading(false);
    // Auto-upload to PHP backend if capture succeeded and filePath exists
    if (result.success && result.filePath) {
      try {
        // Fetch the image as a blob
        const imgRes = await fetch(`/static/${result.filePath}`);
        const blob = await imgRes.blob();
        const file = new File([blob], filename, { type: blob.type });
        setUploadMsg('Uploading to gallery...');
        const uploadRes = await uploadPhotoToPHP(file);
        setUploadMsg(uploadRes.success ? 'Uploaded to gallery!' : `Upload failed: ${uploadRes.message}`);
      } catch (e) {
        setUploadMsg('Upload failed: ' + (e as Error).message);
      }
    }
  };

  const handlePrint = async () => {
    if (captureResult?.filePath) {
      setPrintMsg('Printing...');
      const result = await printDSLRPhoto(captureResult.filePath);
      setPrintMsg(result.success ? 'Print sent!' : `Print failed: ${result.message}`);
    }
  };

  return (
    <div style={{ border: '1px solid #aaa', padding: 16, borderRadius: 8, maxWidth: 700 }}>
      <h2>DSLR Control Panel</h2>
      <div>Status: {status ? (status.connected ? `Connected (${status.model})` : 'Not Connected') : 'Loading...'}</div>
      <div style={{ margin: '12px 0' }}>
        <label>
          Filename: <input value={filename} onChange={e => setFilename(e.target.value)} />
        </label>
        <label style={{ marginLeft: 8 }}>
          Resolution: <input value={resolution} onChange={e => setResolution(e.target.value)} placeholder="e.g. 1920x1080" />
        </label>
        <label style={{ marginLeft: 8 }}>
          Focus: <input value={focus} onChange={e => setFocus(e.target.value)} placeholder="auto/manual" />
        </label>
        <button onClick={handleCapture} disabled={loading || !status?.connected} style={{ marginLeft: 8 }}>
          {loading ? 'Capturing...' : 'Capture Photo'}
        </button>
      </div>
      <div style={{ margin: '12px 0' }}>
        <DSLRWebSocketLiveView />
      </div>
      {captureResult && captureResult.filePath && (
        <div style={{ margin: '12px 0' }}>
          <div>Last Capture:</div>
          <img src={captureResult.base64 ? `data:image/jpeg;base64,${captureResult.base64}` : `/static/${captureResult.filePath}`} alt="Last Capture" style={{ maxWidth: 320, border: '1px solid #ccc' }} />
          <div>
            <button onClick={handlePrint} style={{ marginTop: 8 }}>Print This Photo</button>
            {printMsg && <span style={{ marginLeft: 8 }}>{printMsg}</span>}
          </div>
        </div>
      )}
      {uploadMsg && <div style={{ color: uploadMsg.includes('fail') ? 'red' : 'green', margin: '8px 0' }}>{uploadMsg}</div>}
    </div>
  );
} 