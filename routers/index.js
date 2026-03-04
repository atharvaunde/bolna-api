const healthRoutes = require('./health.route');
module.exports = (app) => {
    app.use('/api/health', healthRoutes);
};
