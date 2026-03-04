const express = require('express');
const router = express.Router();
const {
    getOverview,
    getCustomerMetrics,
    getTransactionTrends,
    getRiskAnalysis,
    getProductInsights,
} = require('../controllers/dashboard.controller');

router.get('/overview', getOverview);
router.get('/customer-metrics', getCustomerMetrics);
router.get('/transaction-trends', getTransactionTrends);
router.get('/risk-analysis', getRiskAnalysis);
router.get('/product-insights', getProductInsights);

module.exports = router;
