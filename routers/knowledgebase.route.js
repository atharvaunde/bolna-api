const express = require('express');
const router = express.Router();
const {
  serveKnowledgebase,
  generateKnowledgebase,
  previewKnowledgebase,
  getCreditUtilization,
  getCustomerContext,
} = require('../controllers/knowledgebase.controller');

router.post('/generate-kb', generateKnowledgebase);
router.post('/preview-kb', previewKnowledgebase);
router.get('/serve/{:token}', serveKnowledgebase);
router.get('/credit-utilization/{:customerId}', getCreditUtilization);
router.post('/customer-context', getCustomerContext);

module.exports = router;
