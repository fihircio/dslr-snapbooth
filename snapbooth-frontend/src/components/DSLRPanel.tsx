import React, { useState, useEffect } from 'react';
import { getDSLRStatus, captureDSLRPhoto, printDSLRPhoto, checkDSLRHelperStatus } from '../services/dslrService';
import { DSLRWebSocketLiveView } from './DSLRWebSocketLiveView';
import { uploadPhotoToPHP } from '../services/uploadService';
import { DSLRSettingsPanel } from './DSLRSettingsPanel';
import { DSLRBurstPanel } from './DSLRBurstPanel';
import { DSLRVideoPanel } from './DSLRVideoPanel';
import { DSLRStatusBar } from './DSLRStatusBar';
import { DSLRGalleryPanel } from './DSLRGalleryPanel';

export function DSLRPanel() {
  const [status, setStatus] = useState<{ connected: boolean, model: string | null } | null>(null);
  const [captureResult, setCaptureResult] = useState<{ success: boolean, filePath: string | null, base64: string | null, message?: string, error?: string } | null>(null);
  const [filename, setFilename] = useState('dslr_photo.jpg');
  const [resolution, setResolution] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [printMsg, setPrintMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [helperDetected, setHelperDetected] = useState(false);

  useEffect(() => {
    getDSLRStatus().then(setStatus);
    // Poll for helper detection
    let mounted = true;
    const poll = async () => {
      const s = await checkDSLRHelperStatus();
      if (mounted) setHelperDetected(s.running);
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleCapture = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ' ') return;
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

  const handlePrint = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    if (captureResult?.filePath) {
      setPrintMsg('Printing...');
      const result = await printDSLRPhoto(captureResult.filePath);
      setPrintMsg(result.success ? 'Print sent!' : `Print failed: ${result.message}`);
    }
  };

  const getTroubleshootingTips = () => {
    return (
      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: 4, 
        padding: 12, 
        margin: '8px 0',
        fontSize: 14
      }}>
        <strong>🔧 Troubleshooting Tips:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li>Make sure your camera is in "PC Connection" mode</li>
          <li>Try disconnecting and reconnecting the USB cable</li>
          <li>Run <code>./reset-camera.sh</code> in the backend directory</li>
          <li>Check that no other apps are using the camera</li>
          <li>Ensure camera battery is charged</li>
        </ul>
      </div>
    );
  };

  return (
    <div style={{ border: '1px solid #aaa', padding: 16, borderRadius: 8, maxWidth: 700 }}>
      <DSLRStatusBar />
      <h2 tabIndex={0} aria-label="DSLR Control Panel">DSLR Control Panel</h2>
      {helperDetected ? (
        <>
          <DSLRSettingsPanel />
          <DSLRBurstPanel />
          <DSLRVideoPanel />
          <DSLRGalleryPanel />
          <div>Status: {status ? (status.connected ? `Connected (${status.model})` : 'Not Connected') : 'Loading...'}</div>
          <div style={{ margin: '12px 0' }}>
            <label>
              Filename: <input value={filename} onChange={e => setFilename(e.target.value)} aria-label="Filename" />
            </label>
            <label style={{ marginLeft: 8 }}>
              Resolution: <input value={resolution} onChange={e => setResolution(e.target.value)} placeholder="e.g. 1920x1080" aria-label="Resolution" />
            </label>
            <label style={{ marginLeft: 8 }}>
              Focus: <input value={focus} onChange={e => setFocus(e.target.value)} placeholder="auto/manual" aria-label="Focus" />
            </label>
            <button
              onClick={handleCapture}
              onKeyDown={handleCapture}
              disabled={loading || !status?.connected}
              style={{ marginLeft: 8 }}
              aria-label="Capture Photo"
            >
              {loading ? 'Capturing...' : 'Capture Photo'}
            </button>
          </div>
          <div style={{ margin: '12px 0' }}>
            <DSLRWebSocketLiveView />
          </div>
          {captureResult && (
            <div style={{ margin: '12px 0' }}>
              {captureResult.success ? (
                <>
                  <div>Last Capture:</div>
                  <img
                    src={captureResult.base64 ? `data:image/jpeg;base64,${captureResult.base64}` : `/static/${captureResult.filePath}`}
                    alt="Last Capture"
                    style={{ maxWidth: 320, border: '1px solid #ccc' }}
                  />
                  <div>
                    <button
                      onClick={handlePrint}
                      onKeyDown={handlePrint}
                      style={{ marginTop: 8 }}
                      aria-label="Print This Photo"
                    >
                      Print This Photo
                    </button>
                    {printMsg && <span style={{ marginLeft: 8 }}>{printMsg}</span>}
                  </div>
                </>
              ) : (
                <div style={{ color: 'red', margin: '8px 0' }}>
                  <strong>Capture failed:</strong> {captureResult.message || captureResult.error}
                  {getTroubleshootingTips()}
                </div>
              )}
            </div>
          )}
          {uploadMsg && <div style={{ color: uploadMsg.includes('fail') ? 'red' : 'green', margin: '8px 0' }}>{uploadMsg}</div>}
        </>
      ) : (
        <div role="alert" aria-live="assertive" style={{ color: 'red', margin: '16px 0' }}>
          DSLR Helper is not running. Please start the helper to enable DSLR features.
        </div>
      )}
    </div>
  );
} 