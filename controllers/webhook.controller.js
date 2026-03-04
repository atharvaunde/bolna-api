const { handleWebhookEvent } = require('../services/webhook.service');

exports.handleWebhookEvent = async (req, res, next) => {
  try {
    await handleWebhookEvent(req);
    return res.status(200).send('ok');
  } catch (error) {
    return next(error);
  }
};
