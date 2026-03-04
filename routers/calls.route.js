const express = require('express');
const router = express.Router();
const { getCalls } = require('../controllers/calls.controller');

router.get('/{:customerId}', getCalls);
router.get('/{:customerId}/{:callId}', getCalls);

module.exports = router;
