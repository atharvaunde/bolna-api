const mongoose = require('mongoose');
const Customers = require('../models/customers');
const Calls = require('../models/calls');
const bolnaApi = require('../configs/bolna');
const { handleError, createError } = require('../utils/error');

exports.getCustomers = async (payload) => {
  try {
    const { customerId } = payload?.params || {};

    // If customerId is provided, return single customer
    if (customerId) {
      const customer = await Customers.findById(customerId).lean();
      if (!customer) throw createError(404, 'Customer not found');

      return {
        success: true,
        statusCode: 200,
        message: 'Customer retrieved successfully',
        data: customer,
      };
    }

    // Otherwise, return filtered list of customers
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      query = '',
      riskLevel,
    } = payload?.query || {};

    // Build filter
    const filter = {};

    // Search across multiple fields if query is provided
    if (query) {
      filter.$or = [
        { customerId: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ];
    }

    // Risk level filter
    if (riskLevel) {
      filter.riskLevel = Array.isArray(riskLevel) ? { $in: riskLevel } : riskLevel;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [customers, total] = await Promise.all([
      Customers.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Customers.countDocuments(filter),
    ]);

    return {
      success: true,
      statusCode: 200,
      message: 'Customers retrieved successfully',
      data: {
        customers,
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

exports.triggerCall = async (payload) => {
  try {
    const { customerId } = payload?.params || {};
    const customer = await Customers.findById(customerId).lean();
    if (!customer) throw createError(404, 'Customer not found');

    if (!customer.phone) throw createError(400, 'Customer does not have a phone number on file');

    const agentId = process.env.BOLNA_AGENT_ID;
    // const fromNumber = process.env.BOLNA_FROM_NUMBER;

    if (!agentId) throw createError(500, 'BOLNA_AGENT_ID environment variable is not configured');
    // if (!fromNumber) throw createError(500, 'BOLNA_FROM_NUMBER environment variable is not configured');

    const firstName = customer.name?.split(' ')[0] || customer.name;

    const aIpayload = {
      agent_id: agentId,
      recipient_phone_number: customer.phone,
      // from_phone_number: fromNumber,
      user_data: {
        customerId: customer?.customerId,
        firstName,
        customerName: customer.name,
        agentName: process.env.BOLNA_AGENT_NAME || 'Rahul',
        entityName: process.env.BOLNA_ENTITY_NAME || 'Demo Bank',
      },
    };

    console.log('Triggering Bolna call with payload:', aIpayload);

    try {
      const response = await bolnaApi.post('/call', aIpayload);

      const executionId = response.data?.execution_id || response.data?.run_id || response.data?.id;

      await Calls.create({
        executionId,
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        agentId: agentId,
        status: response.data?.status || 'queued',
      });

      return {
        success: true,
        statusCode: 200,
        message: `AI call triggered for ${customer.name}`,
        data: {
          executionId,
          status: response.data?.status,
          customer: {
            id: customer._id,
            name: customer.name,
            phone: customer.phone,
          },
          bolna: response.data,
        },
      };
    } catch (error) {
      console.error('Error triggering Bolna call:', error.response?.data || error.message || error);
      throw createError(500, 'Failed to trigger Bolna call');
    }
  } catch (error) {
    throw handleError(error);
  }
};
