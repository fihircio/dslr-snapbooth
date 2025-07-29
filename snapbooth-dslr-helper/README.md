# snapbooth-dslr-helper

A Node.js helper for DSLR photobooths. Connects to DSLR cameras (via gphoto2), captures photos, streams live view, prints images, and exposes REST + WebSocket APIs.

---

## Project Integration

This backend is part of a larger photobooth system that includes a React/PHP portal for gallery, editing, and sharing. For full architecture, integration, and usage details, see [PHOTOBOOTH_GUIDE.md](./docs/PHOTOBOOTH_GUIDE.md).

---

## Core Responsibilities
- Connect to DSLR (via USB)
- Capture photo on demand
- Provide Live View frames
- Print captured image
- Expose REST + WebSocket endpoints

## Tech Stack
- **DSLR control:** gphoto2 (via subprocess)
- **REST API:** Express.js
- **Live view streaming:** WebSocket + MJPEG or base64 frames
- **Printing:** lp or cups (Linux-based)
- **Background queue:** Node.js async/worker

## Folder Structure
```
snapbooth-dslr-helper/
├── capture/                    # gphoto2 wrappers
│   └── controller.js
├── stream/                     # live view stream logic
│   └── streamer.js
├── print/                      # optional printer utils
│   └── printer.js
├── api/                        # REST + WebSocket server
│   ├── server.js
│   └── routes/
├── config/                     # camera config or system settings
├── static/                     # captured photos (temp)
├── main.js                     # Entry point
├── requirements.txt            # (for reference)
└── README.md
```

## API Endpoints
| Endpoint   | Method | Description                        |
|------------|--------|------------------------------------|
| /status    | GET    | Check DSLR connection and health    |
| /capture   | POST   | Capture a photo (see below)         |
| /liveview  | WS     | Start live preview stream (base64)  |
| /print     | POST   | Print a specified photo (see below) |

### /api/capture
- **POST**
- **Body:**
  - `filename` (optional): string, custom filename for the photo
  - `resolution` (optional): string, e.g. '1920x1080' (sets image format)
  - `focus` (optional): string, e.g. 'auto', 'manual' (sets focus mode)
- **Returns:** `{ success, filePath, base64 }`

**Example:**
```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","resolution":"1920x1080","focus":"auto"}'
```

### /api/print
- **POST**
- **Body:**
  - `filePath`: string, path to the image file (must be .jpg, .jpeg, or .png)
- **Returns:** `{ success, message }`

**Example:**
```bash
curl -X POST http://localhost:3000/api/print \
  -H "Content-Type: application/json" \
  -d '{"filePath":"./static/test.jpg"}'
```

### /liveview (WebSocket)
- **Connect:** `ws://localhost:3000`
- **Start streaming:** Send `{ "type": "liveview" }` as JSON
- **Receive:** `{ type: 'frame', data: <base64>, error? }` every ~500ms
- **Close:** Just close the WebSocket

**Example (JavaScript):**
```js
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => ws.send(JSON.stringify({ type: 'liveview' }));
ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  if (data.type === 'frame' && data.data) {
    // data.data is a base64-encoded JPEG
    // Display or process the frame
  }
};
```

## Build Phases
1. **Phase 1:** DSLR Photo Capture via gphoto2
2. **Phase 2:** REST API for Capture
3. **Phase 3:** WebSocket Live Preview
4. **Phase 4:** Print Support (optional)

