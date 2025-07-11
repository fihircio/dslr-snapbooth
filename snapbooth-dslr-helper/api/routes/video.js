const express = require('express');
const { startVideoRecording, stopVideoRecording } = require('../../capture/controller');

const router = express.Router();

// POST /api/video/start - start video recording
// Body: { filename: string }
router.post('/video/start', async (req, res) => {
  const { filename } = req.body || {};
  try {
    const result = await startVideoRecording({ filename });
    res.json(result);
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// POST /api/video/stop - stop video recording
router.post('/video/stop', async (req, res) => {
  const result = await stopVideoRecording();
  res.json(result);
});

module.exports = router; 