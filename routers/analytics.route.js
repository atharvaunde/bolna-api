const express = require('express');
const router = express.Router();
const {
  getMonthlyTransactions,
  getFinancialSummary,
} = require('../controllers/analytics.controller');

router.get('/monthly-transactions', getMonthlyTransactions);
router.get('/financial-summary/{:customerId}', getFinancialSummary);

module.exports = router;
