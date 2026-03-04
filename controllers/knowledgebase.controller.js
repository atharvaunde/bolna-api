const { 
  serveKnowledgebase, 
  generateKnowledgebase, 
  previewKnowledgebase, 
  getCreditUtilization, 
  getCustomerContext 
} = require('../services/knowledgebase.service');

exports.serveKnowledgebase = async (req, res, next) => {
  try {

    const result = await serveKnowledgebase(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.generateKnowledgebase = async (req, res, next) => {
  try {
    const result = await generateKnowledgebase(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.previewKnowledgebase = async (req, res, next) => {
  try {
    const result = await previewKnowledgebase(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.getCreditUtilization = async (req, res, next) => {
  try {
    const result = await getCreditUtilization(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.getCustomerContext = async (req, res, next) => {
  try {
    const result = await getCustomerContext(req);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};
