const { getCustomerInsights } = require('../services/customerInsights.service');

exports.getCustomerInsights = async (req, res, next) => {
  try {
    const result = await getCustomerInsights(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
