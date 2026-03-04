const express = require('express');
const router = express.Router();
const { pingCheck, metaData } = require('../controllers/health.controller');

router.get('/ping', pingCheck);
router.get('/meta', metaData);

module.exports = router;
