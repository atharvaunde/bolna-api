const { getTransactionsByCustomer } = require('../services/transaction.service');

exports.getTransactionsByCustomer = async (req, res, next) => {
  try {
    const result = await getTransactionsByCustomer(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
