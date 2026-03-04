const express = require('express');
const router = express.Router();
const { getProductsByCustomer } = require('../controllers/product.controller');

router.get('/{:customerId}', getProductsByCustomer);

module.exports = router;
