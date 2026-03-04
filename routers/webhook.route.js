const express = require('express');
const router = express.Router();
const { handleWebhookEvent } = require('../controllers/webhook.controller');

router.post('/', handleWebhookEvent);

module.exports = router;
