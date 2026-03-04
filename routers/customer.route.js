const express = require('express');
const router = express.Router();
const { getCustomers, triggerCall } = require('../controllers/customer.controller');

router.get('/', getCustomers);
router.get('/{:customerId}', getCustomers);
router.post('/{:customerId}/trigger-call', triggerCall);

module.exports = router;
