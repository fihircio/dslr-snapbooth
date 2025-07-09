const express = require('express');
const { printPhoto } = require('../../print/printer');

const router = express.Router();

/**
 * POST /api/print
 * Body: { filePath: string }
 */
router.post('/print', async (req, res) => {
  const { filePath } = req.body || {};
  if (!filePath) {
    return res.status(400).json({ success: false, message: 'filePath required' });
  }
  const result = await printPhoto(filePath);
  res.json(result);
});

module.exports = router; 