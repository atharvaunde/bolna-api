const { getMonthlyTransactions, getFinancialSummary } = require('../services/analytics.service');

exports.getMonthlyTransactions = async (req, res, next) => {
  try {
    const result = await getMonthlyTransactions(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.getFinancialSummary = async (req, res, next) => {
  try {
    const result = await getFinancialSummary(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
