const express = require('express');
const { detectDSLR } = require('../../capture/controller');

const router = express.Router();

router.get('/status', async (req, res) => {
  const status = await detectDSLR();
  res.json(status);
});

module.exports = router; 