const healthRoutes = require('./health.route');
const analyticsRoutes = require('./analytics.route');
const callsRoutes = require('./calls.route');
const customerRoutes = require('./customer.route');
const customerInsightsRoutes = require('./customerInsights.route');
const dashboardRoutes = require('./dashboard.route');
const knowledgebaseRoutes = require('./knowledgebase.route');
const productRoutes = require('./product.route');
const riskRoutes = require('./risk.route');
const transactionRoutes = require('./transaction.route');
const webhookRoutes = require('./webhook.route');

module.exports = (app) => {
  app.use('/api/health', healthRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/calls', callsRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/customer-insights', customerInsightsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/knowledgebase', knowledgebaseRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/risk', riskRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/webhook', webhookRoutes);
};
