const express = require('express');
const { detectDSLRSafe } = require('../../capture/controller');

const router = express.Router();

router.get('/status', async (req, res) => {
  const status = await detectDSLRSafe();
  res.json(status);
});

module.exports = router; 