const Calls = require('../models/calls');
const Customers = require('../models/customers');
const { createError, handleError } = require('../utils/error');

exports.getCalls = async (payload) => {
  try {
    const { customerId, callId } = payload?.params || {};
    if (!customerId) throw createError(400, 'customerId is required');

    const customer = await Customers.findById(customerId).lean();
    if (!customer) throw createError(404, 'Customer not found');

    if (callId) {
      const call = await Calls.findOne({
        _id: callId,
        customerId,
      }).lean();

      if (!call) throw createError(404, 'Call not found');

      return {
        success: true,
        statusCode: 200,
        data: call,
      };
    }

    const { page = 1, limit = 20 } = payload?.query || {};
    const skip = (page - 1) * limit;
    const [calls, total] = await Promise.all([
      Calls.find({ customerId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Calls.countDocuments({ customerId }),
    ]);

    return {
      success: true,
      statusCode: 200,
      data: {
        calls,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    throw handleError(error);
  }
};
