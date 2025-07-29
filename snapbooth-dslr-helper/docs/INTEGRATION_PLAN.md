# Photobooth System Integration Plan

> **Note:** For the latest setup, usage, and troubleshooting, see [PHOTOBOOTH_GUIDE.md](./PHOTOBOOTH_GUIDE.md).

## Overview
This document explains the integration of a new Node.js DSLR backend with the existing React + PHP photobooth portal. It covers what currently exists, what is being added, and the goals and flow of the combined system.

---

## 1. Current System

### A. Frontend (React)
- Modern React app (Vite, TypeScript, Tailwind)
- Features: photo, boomerang, slowmo, GIF, photo strip, editing, printing, QR sharing, admin panel, etc.
- Uses browser webcam for photo/video capture
- Uploads media to PHP backend

### B. Backend (PHP)
- Handles media uploads, QR code generation, key/trial system, and media viewing
- APIs for event/trial key validation, trial requests, and uploads
- Gallery and sharing features

---

## 2. New Addition: Node.js DSLR Backend
- Provides REST and WebSocket APIs for DSLR camera control (via gphoto2)
- Features:
  - DSLR connection/status check
  - DSLR photo capture (with config options)
  - Live view streaming (WebSocket, base64 JPEG frames)
  - Print support (send image to system printer)
- Runs as a separate service alongside the PHP backend

---

## 3. Integration Goals
- **Enhance the photobooth with DSLR support** (higher quality, professional features)
- **Allow users to choose capture source:**
  - Browser webcam (existing flow)
  - DSLR camera (new Node.js backend)
- **Seamlessly combine both backends in the React UI**
- **Enable live view, capture, and print from DSLR directly in the app**
- **(Optional) Auto-upload DSLR captures to PHP backend for gallery/sharing**

---

## 4. Combined System Architecture

```
[User]
   |
   v
[React Frontend]
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

## 5. User Flow Example

1. User opens the React app.
2. User chooses capture source:
   - **Webcam:** Uses browser for capture (existing flow).
   - **DSLR:** React calls Node.js backend for live view, capture, print.
3. After capture:
   - Image is shown in the React UI.
   - User can edit, add stickers, create GIFs, etc.
   - User can upload to PHP backend (existing upload flow).
   - User can print via Node.js backend.

---

## 6. What Needs to Be Created
- React service layer for Node.js DSLR backend (status, capture, live view, print)
- UI components/buttons for DSLR actions
- (Optional) Logic to auto-upload DSLR images to PHP backend

## 7. What Can Be Reused
- All existing React UI and PHP backend features
- All editing, sharing, and gallery features
- Both webcam and DSLR capture can be offered in the same app

---

## 8. Summary Table

| Feature/Action         | Current System (React+PHP) | With Node.js DSLR Backend | What to Change/Add?         |
|------------------------|----------------------------|--------------------------|-----------------------------|
| Webcam Capture         | Yes                        | Yes                      | No change                   |
| DSLR Capture           | No                         | Yes                      | Add React service/UI        |
| Live View (DSLR)       | No                         | Yes                      | Add React component         |
| Print (via printer)    | No (or browser print)      | Yes                      | Add React service/UI        |
| Upload/QR/Key System   | Yes                        | Yes                      | No change                   |
| Gallery/Sharing        | Yes                        | Yes                      | No change                   |
| Editing/GIF/Effects    | Yes                        | Yes                      | No change                   |

---

## 9. Goals
- Professional-quality photobooth with both webcam and DSLR support
- Seamless user experience for all capture, edit, print, and sharing features
- Maintainable, modular, and scalable architecture

---

**This document can be shared with collaborators to explain the integration plan and project direction.** 