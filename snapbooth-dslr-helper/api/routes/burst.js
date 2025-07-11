const express = require('express');
const { burstCapture } = require('../../capture/controller');

const router = express.Router();

// POST /api/burst - capture multiple images
// Body: { count: number, interval: ms, filename: string }
router.post('/burst', async (req, res) => {
  const { count, interval, filename } = req.body || {};
  const result = await burstCapture({ count, interval, filename });
  res.json(result);
});

module.exports = router; 