const express = require('express');
const { capturePhoto } = require('../../capture/controller');

const router = express.Router();

/**
 * POST /api/capture
 * Body: {
 *   filename?: string,
 *   resolution?: string, // e.g., '1920x1080'
 *   focus?: string       // e.g., 'auto', 'manual'
 * }
 */
router.post('/capture', async (req, res) => {
  const { filename, resolution, focus } = req.body || {};
  const result = await capturePhoto({ filename, resolution, focus });
  res.json(result);
});

module.exports = router; 