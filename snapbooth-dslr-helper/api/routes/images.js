const express = require('express');
const { listCameraImages, downloadCameraImage } = require('../../capture/controller');
const router = express.Router();

// GET /api/images - list images on the camera
router.get('/images', async (req, res) => {
  const result = await listCameraImages();
  // If result.images is an array of filenames, add index as number
  if (result.success && Array.isArray(result.images)) {
    const images = result.images.map((name, idx) => ({ number: idx + 1, name }));
    res.json({ success: true, images });
  } else {
    res.json(result);
  }
});

// GET /api/download?number=...&name=... - download a specific image
router.get('/download', async (req, res) => {
  const { number, name } = req.query;
  if (!number || !name) return res.status(400).json({ success: false, error: 'number and name required' });
  const result = await downloadCameraImage({ number, name });
  if (result.success) {
    res.download(result.filePath, name);
  } else {
    res.status(500).json(result);
  }
});

module.exports = router; 