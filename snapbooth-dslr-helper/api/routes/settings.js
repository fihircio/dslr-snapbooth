const express = require('express');
const { getCameraSettings, setCameraSettings } = require('../../capture/controller');

const router = express.Router();

// GET /api/settings - list all settings and their current values
router.get('/settings', async (req, res) => {
  const result = await getCameraSettings();
  res.json(result);
});

// POST /api/settings - set one or more settings
router.post('/settings', async (req, res) => {
  const settings = req.body || {};
  const result = await setCameraSettings(settings);
  res.json(result);
});

module.exports = router; 