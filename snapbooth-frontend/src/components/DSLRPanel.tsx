import React, { useState, useEffect } from 'react';
import { getDSLRStatus, captureDSLRPhoto, printDSLRPhoto, checkDSLRHelperStatus } from '../services/dslrService';
import { DSLRWebSocketLiveView } from './DSLRWebSocketLiveView';
import { HDMILiveView } from './HDMILiveView';
import { uploadPhotoToPHP } from '../services/uploadService';
import { DSLRSettingsPanel } from './DSLRSettingsPanel';
import { DSLRBurstPanel } from './DSLRBurstPanel';
import { DSLRVideoPanel } from './DSLRVideoPanel';
import { DSLRStatusBar } from './DSLRStatusBar';
import { DSLRGalleryPanel } from './DSLRGalleryPanel';

type LiveViewMethod = 'auto' | 'hdmi' | 'v002-direct' | 'gphoto2';

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
  const [liveViewMethod, setLiveViewMethod] = useState<LiveViewMethod>('auto');
  const [liveViewStatus, setLiveViewStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleLiveViewMethodChange = (method: LiveViewMethod) => {
    setLiveViewMethod(method);
    setLiveViewStatus(null); // Reset status when method changes
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
          {liveViewMethod === 'hdmi' && (
            <>
              <li><strong>For HDMI:</strong> Connect HDMI capture device</li>
              <li><strong>For HDMI:</strong> Run <code>node test-hdmi-devices.js</code></li>
              <li><strong>For HDMI:</strong> Ensure camera HDMI output is enabled</li>
            </>
          )}
          {liveViewMethod === 'v002-direct' && (
            <>
              <li><strong>For Enhanced gphoto2:</strong> Better reliability than standard gphoto2</li>
              <li><strong>For Enhanced gphoto2:</strong> Improved error handling and retry logic</li>
              <li><strong>For Enhanced gphoto2:</strong> Works on all platforms</li>
              <li><strong>⚠️  Camera Conflict:</strong> Close v002 Camera Live before using our helper</li>
              <li><strong>⚠️  Camera Conflict:</strong> Run <code>./resolve-camera-conflict.sh</code> if camera disappears</li>
            </>
          )}
          {error && error.includes('camera') && (
            <>
              <li><strong>🚨 Camera Conflict Detected:</strong></li>
              <li>1. Close v002 Camera Live completely</li>
              <li>2. Run <code>./resolve-camera-conflict.sh</code> in backend</li>
              <li>3. Wait 10 seconds</li>
              <li>4. Restart the DSLR helper</li>
              <li>5. Try again</li>
            </>
          )}
        </ul>
      </div>
    );
  };

  const renderLiveView = () => {
    if (liveViewMethod === 'hdmi') {
      return (
        <HDMILiveView 
          mode="hdmi"
          onStatusChange={setLiveViewStatus}
          onError={(error) => console.error('HDMI error:', error)}
        />
      );
    } else if (liveViewMethod === 'v002-direct') {
      return (
        <HDMILiveView 
          mode="v002-direct"
          onStatusChange={setLiveViewStatus}
          onError={(error) => console.error('v002 Direct error:', error)}
        />
      );
    } else if (liveViewMethod === 'gphoto2') {
      return <DSLRWebSocketLiveView />;
    } else {
      // Auto mode - use HDMILiveView with auto mode
      return (
        <HDMILiveView 
          mode="auto"
          onStatusChange={setLiveViewStatus}
          onError={(error) => console.error('Auto live view error:', error)}
        />
      );
    }
  };

  const getLiveViewMethodInfo = () => {
    switch (liveViewMethod) {
      case 'hdmi':
        return {
          name: 'HDMI Input Capture',
          description: 'HDMI capture device streaming (most reliable)',
          latency: '~50ms',
          reliability: 'Excellent',
          requirements: 'HDMI capture device + FFmpeg'
        };
      case 'v002-direct':
        return {
          name: 'Enhanced gphoto2 Wrapper',
          description: 'Enhanced gphoto2 with better reliability and error handling',
          latency: '~200ms',
          reliability: 'Good',
          requirements: 'gphoto2 library'
        };
      case 'gphoto2':
        return {
          name: 'gphoto2 Live View',
          description: 'Traditional camera live view (unreliable on 600D)',
          latency: '~300ms',
          reliability: 'Fair',
          requirements: 'gphoto2 library'
        };
      default:
        return {
          name: 'Auto (Smart Fallback)',
          description: 'HDMI → v002 Direct → gphoto2 (best available)',
          latency: 'Variable',
          reliability: 'Best available',
          requirements: 'Multiple methods available'
        };
    }
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
          
          {/* Live View Method Selection */}
          <div style={{ margin: '16px 0', padding: '12px', background: '#f8f9fa', borderRadius: 4 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Live View Method</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="liveViewMethod"
                  value="auto"
                  checked={liveViewMethod === 'auto'}
                  onChange={() => handleLiveViewMethodChange('auto')}
                />
                Auto
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="liveViewMethod"
                  value="hdmi"
                  checked={liveViewMethod === 'hdmi'}
                  onChange={() => handleLiveViewMethodChange('hdmi')}
                />
                HDMI
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="liveViewMethod"
                  value="v002-direct"
                  checked={liveViewMethod === 'v002-direct'}
                  onChange={() => handleLiveViewMethodChange('v002-direct')}
                />
                v002 Direct
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="liveViewMethod"
                  value="gphoto2"
                  checked={liveViewMethod === 'gphoto2'}
                  onChange={() => handleLiveViewMethodChange('gphoto2')}
                />
                gphoto2
              </label>
            </div>
            
            {/* Method Info */}
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              <strong>{getLiveViewMethodInfo().name}</strong> - {getLiveViewMethodInfo().description}
              <br />
              Latency: {getLiveViewMethodInfo().latency} | Reliability: {getLiveViewMethodInfo().reliability}
            </div>
          </div>

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

          {/* Live View Display */}
          <div style={{ margin: '12px 0' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Live View</h3>
            {renderLiveView()}
            
            {/* Live View Status */}
            {liveViewStatus && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                background: '#e3f2fd', 
                borderRadius: 4, 
                fontSize: '12px' 
              }}>
                <strong>Live View Status:</strong> {liveViewStatus.method || 'Unknown'} | 
                Latency: {liveViewStatus.latency || 'Unknown'} | 
                Resolution: {liveViewStatus.resolution || 'Unknown'}
              </div>
            )}
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