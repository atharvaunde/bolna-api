const express = require('express');
const router = express.Router();
const { 
  serveKnowledgebase, 
  generateKnowledgebase, 
  previewKnowledgebase, 
  getCreditUtilization, 
  getCustomerContext 
} = require('../controllers/knowledgebase.controller');

router.get('/serve/{:token}', serveKnowledgebase);
router.post('/generate', generateKnowledgebase);
router.post('/preview', previewKnowledgebase);
router.get('/credit-utilization/{:customerId}', getCreditUtilization);
router.post('/customer-context', getCustomerContext);

module.exports = router;
