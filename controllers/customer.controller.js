const { getCustomers, triggerCall } = require('../services/customer.service');

exports.getCustomers = async (req, res, next) => {
  try {
    const result = await getCustomers(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.triggerCall = async (req, res, next) => {
  try {
    const result = await triggerCall(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
