const express = require('express');
const router = express.Router();
const { getCustomerInsights } = require('../controllers/customerInsights.controller');

router.get('/{:customerId}', getCustomerInsights);

module.exports = router;
