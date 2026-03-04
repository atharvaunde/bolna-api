const express = require('express');
const router = express.Router();
const { getTransactionsByCustomer } = require('../controllers/transaction.controller');

router.get('/{:customerId}', getTransactionsByCustomer);

module.exports = router;
