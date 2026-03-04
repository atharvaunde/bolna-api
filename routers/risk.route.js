const express = require('express');
const router = express.Router();
const { calculateRisk, getRiskSummary } = require('../controllers/risk.controller');

router.get('/calculate/{:customerId}', calculateRisk);
router.get('/summary', getRiskSummary);

module.exports = router;
