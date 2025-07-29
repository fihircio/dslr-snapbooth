# macOS DSLR Helper Quick Start & Troubleshooting

## Quick Start
1. Connect your DSLR camera via USB and power it on.
2. Run the following script to start the backend:
   ```sh
   ./start-dslr-helper.sh
   ```
   This will automatically kill the PTPCamera service and start the Node.js backend.

## Troubleshooting
- **Error: Could not claim the USB device**
  - Cause: macOS PTPCamera service is locking the camera.
  - Solution: The startup script kills PTPCamera automatically. If you still see this error, unplug/replug your camera and run the script again.
- **No live view or capture:**
  - Make sure your camera is in the correct mode and supports live view.
  - Try a different USB port or cable.
- **Permissions issues:**
  - Run the script with `sudo` if you see permission errors.

## For Developers
- Document all workflow steps and troubleshooting in your team’s portal: https://github.com/fihircio/gemini-photobooth-portal/tree/main/docs
- Add new guides and API docs as needed for frontend/backend integration.
