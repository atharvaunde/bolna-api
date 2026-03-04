const { getCalls } = require('../services/calls.service');

exports.getCalls = async (req, res, next) => {
  try {
    const result = await getCalls(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
