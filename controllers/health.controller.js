const { pingCheck, metaData } = require('../services/health.service');

exports.pingCheck = async (req, res, next) => {
  try {
    const result = await pingCheck();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.metaData = async (req, res, next) => {
  try {
    const result = await metaData();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};