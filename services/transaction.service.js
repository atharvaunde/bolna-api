const mongoose = require('mongoose');
const Transactions = require('../models/transactions');
const Products = require('../models/products');
const Customers = require('../models/customers');
const { handleError, createError } = require('../utils/error');

exports.getTransactionsByCustomer = async (payload) => {
  try {
    const { customerId } = payload?.params || {};
    if (!customerId) throw createError(400, 'Customer ID is required');

    const customer = await Customers.findById(customerId);
    if (!customer) throw createError(404, 'Customer not found');

    const {
      page = 1,
      limit = 10,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
      startDate,
      endDate,
      instrument,
      transactionType,
      category,
      productId,
      productType,
      status,
      channel,
      merchantName,
    } = payload?.query || {};

    // Validate product if provided
    if (productId) {
      const product = await Products.findById(productId);
      if (!product) throw createError(404, 'Product not found');
    }

    const filter = { customerId: new mongoose.Types.ObjectId(customerId) };

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }
    if (instrument) filter.instrument = instrument;
    if (transactionType) filter.transactionType = transactionType;
    if (category) filter.transactionCategory = category;
    if (productId) filter.productId = new mongoose.Types.ObjectId(productId);
    if (productType) filter.productType = productType;
    if (status) filter.status = status;
    if (channel) filter.channel = channel;
    if (merchantName) filter.merchantName = { $regex: merchantName, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [transactions, total] = await Promise.all([
      Transactions.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Transactions.countDocuments(filter),
    ]);

    return {
      success: true,
      statusCode: 200,
      message: 'Transactions retrieved successfully',
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    };
  } catch (error) {
    throw handleError(error);
  }
};
