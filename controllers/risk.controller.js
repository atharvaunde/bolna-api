const { calculateRisk, getRiskSummary } = require('../services/risk.service');

exports.calculateRisk = async (req, res, next) => {
  try {

    const result = await calculateRisk(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.getRiskSummary = async (req, res, next) => {
  try {
    const result = await getRiskSummary(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
