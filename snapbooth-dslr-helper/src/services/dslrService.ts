// services/dslrService.ts

export async function getDSLRStatus() {
  const res = await fetch('http://localhost:3000/api/status');
  return res.json();
}

export async function captureDSLRPhoto(config: { filename?: string, resolution?: string, focus?: string }) {
  const res = await fetch('http://localhost:3000/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function printDSLRPhoto(filePath: string) {
  const res = await fetch('http://localhost:3000/api/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  });
  return res.json();
} 