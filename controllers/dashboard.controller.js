const {
    getOverview,
    getCustomerMetrics,
    getTransactionTrends,
    getRiskAnalysis,
    getProductInsights,
} = require('../services/dashboard.service');

exports.getOverview = async (req, res, next) => {
    try {
        const payload = {
            query: req.query,
        };
        const result = await getOverview(payload);
        return res.status(result.statusCode).json(result);
    } catch (error) {
        return next(error);
    }
};

exports.getCustomerMetrics = async (req, res, next) => {
    try {
        const payload = {
            query: req.query,
        };
        const result = await getCustomerMetrics(payload);
        return res.status(result.statusCode).json(result);
    } catch (error) {
        return next(error);
    }
};

exports.getTransactionTrends = async (req, res, next) => {
    try {
        const payload = {
            query: req.query,
        };
        const result = await getTransactionTrends(payload);
        return res.status(result.statusCode).json(result);
    } catch (error) {
        return next(error);
    }
};

exports.getRiskAnalysis = async (req, res, next) => {
    try {
        const payload = {
            query: req.query,
        };
        const result = await getRiskAnalysis(payload);
        return res.status(result.statusCode).json(result);
    } catch (error) {
        return next(error);
    }
};

exports.getProductInsights = async (req, res, next) => {
    try {
        const payload = {
            query: req.query,
        };
        const result = await getProductInsights(payload);
        return res.status(result.statusCode).json(result);
    } catch (error) {
        return next(error);
    }
};
