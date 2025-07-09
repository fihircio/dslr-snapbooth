# Photobooth Project Guide

## Overview
This guide documents the architecture, setup, API usage, and troubleshooting for the integrated photobooth system, combining a React/PHP portal with a Node.js DSLR backend.

---

## 1. System Architecture

```
[User]
   |
   v
[React Frontend (Vite, TypeScript, Tailwind)]
   |         \
   |          \
   v           v
[PHP Backend] [Node.js DSLR Backend]
   |                |
[Uploads, QR,      [DSLR control,
 Keys, Gallery]     Live View, Print]
```
- The React app talks to both backends via HTTP/WebSocket.
- Media from either source can be edited, shared, or printed.

---

## 2. Features
- Webcam and DSLR photo capture
- Live view streaming from DSLR
- Printing via system printer
- Media upload, QR, key/trial system (PHP)
- Gallery, editing, GIF/boomerang, and more

---

## 3. Setup

### A. Node.js DSLR Backend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the backend:
   ```bash
   npx nodemon main.js
   ```
3. Ensure gphoto2 is installed and your DSLR is connected and detected:
   ```bash
   gphoto2 --auto-detect
   ```

### B. React/PHP Portal
- Standard Vite/React setup for frontend
- PHP backend for uploads, QR, key/trial, etc.
- Place React components and services in `src/components` and `src/services`

---

## 4. API Usage

### A. Node.js DSLR Backend

#### 1. Check DSLR Status
```bash
curl http://localhost:3000/api/status
```
- Returns: `{ "connected": true/false, "model": "..." }`

#### 2. Capture Photo
```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","resolution":"1920x1080","focus":"auto"}'
```
- Returns: `{ "success": true/false, "filePath": "...", "base64": null }`

#### 3. Print Photo
```bash
curl -X POST http://localhost:3000/api/print \
  -H "Content-Type: application/json" \
  -d '{"filePath":"./static/test.jpg"}'
```
- Returns: `{ "success": true/false, "message": "request id is ..." }`

#### 4. WebSocket Live View
- Connect to `ws://localhost:3000` and send `{ "type": "liveview" }` to receive base64 JPEG frames.

#### 5. Upload to PHP Backend
```bash
curl -F "file=@snapbooth-dslr-helper/static/test.jpg" http://localhost/api/upload
```
- Returns: PHP backend response (success/failure)

---

## 5. React Integration
- Use `src/services/dslrService.ts` for Node.js backend API calls
- Use `src/components/DSLRPanel.tsx` for DSLR UI (status, capture, live view, print)
- Auto-upload captured DSLR images to PHP backend using `src/services/uploadService.ts`

---

## 6. Troubleshooting
- **No camera detected:** Ensure DSLR is connected, powered on, and detected by `gphoto2 --auto-detect`.
- **Capture fails:** Usually due to no camera detected.
- **Print job accepted but no printout:** Check file validity, printer status, and CUPS queue (`lpstat -t`).
- **Upload fails:** Ensure PHP backend is running and accessible at the correct URL.
- **WebSocket live view not working:** Check camera support for live view and backend logs.

---

## 7. Example User Flow
1. User opens React app.
2. User chooses capture source (webcam or DSLR).
3. User captures photo, edits, and uploads to gallery.
4. User prints photo via Node.js backend.

---

## 8. Maintenance & Extensibility
- Both backends can be extended independently.
- Add new features (e.g., cloud upload, advanced editing) as needed.
- Keep API endpoints and integration points documented for future devs.

---

**This guide can be shared with your team as a reference for setup, usage, and troubleshooting of the photobooth project.** 