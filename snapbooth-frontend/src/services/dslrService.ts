// services/dslrService.ts

// Add VITE_DSLR_API_TOKEN=yourtoken to your .env file
const DSLR_API_TOKEN = (import.meta as any).env.VITE_DSLR_API_TOKEN || 'yourtoken';

export async function getDSLRStatus() {
  const res = await fetch('http://localhost:3000/api/status', {
    headers: { 'X-DSLR-Token': DSLR_API_TOKEN },
  });
  return res.json();
}

export async function captureDSLRPhoto(config: { filename?: string, resolution?: string, focus?: string }) {
  const res = await fetch('http://localhost:3000/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-DSLR-Token': DSLR_API_TOKEN },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function printDSLRPhoto(filePath: string) {
  const res = await fetch('http://localhost:3000/api/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-DSLR-Token': DSLR_API_TOKEN },
    body: JSON.stringify({ filePath }),
  });
  return res.json();
}

export async function getCameraSettings() {
  const res = await fetch('http://localhost:3000/api/settings', {
    headers: { 'X-DSLR-Token': DSLR_API_TOKEN },
  });
  return res.json();
}

export async function setCameraSettings(settings: Record<string, any>) {
  const res = await fetch('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-DSLR-Token': DSLR_API_TOKEN },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function burstDSLRPhotos(config: { count: number, intervalMs?: number, filenamePrefix?: string }) {
  const res = await fetch('http://localhost:3000/api/burst', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-DSLR-Token': DSLR_API_TOKEN },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function startDSLRVideo(config: { filename?: string }) {
  const res = await fetch('http://localhost:3000/api/video/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-DSLR-Token': DSLR_API_TOKEN },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function stopDSLRVideo() {
  const res = await fetch('http://localhost:3000/api/video/stop', {
    method: 'POST',
    headers: { 'X-DSLR-Token': DSLR_API_TOKEN },
  });
  return res.json();
}

export async function checkDSLRHelperStatus(): Promise<{ running: boolean; connected: boolean; model?: string }> {
  try {
    const res = await fetch('http://localhost:3000/api/status', {
      headers: { 'X-DSLR-Token': DSLR_API_TOKEN },
    });
    if (!res.ok) return { running: false, connected: false };
    const data = await res.json();
    // running = backend is up; connected = camera is present
    return { running: true, connected: !!data.connected, model: data.model };
  } catch {
    return { running: false, connected: false };
  }
} 