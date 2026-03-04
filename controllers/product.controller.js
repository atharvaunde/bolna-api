const { getProductsByCustomer } = require('../services/product.service');

exports.getProductsByCustomer = async (req, res, next) => {
  try {
    const result = await getProductsByCustomer(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
