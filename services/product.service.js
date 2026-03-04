const mongoose = require('mongoose');
const Products = require('../models/products');
const Customers = require('../models/customers');
const { handleError, createError } = require('../utils/error');

exports.getProductsByCustomer = async (payload) => {
    try {
        const { customerId } = payload?.params || {};
        if (!customerId) throw createError(400, 'Customer ID is required');

        const customer = await Customers.findById(customerId);
        if (!customer) throw createError(404, 'Customer not found');

        const products = await Products.find({ customerId }).lean();

        return {
            success: true,
            statusCode: 200,
            message: 'Products retrieved successfully',
            data: products,
        };
    } catch (error) {
        throw handleError(error);
    }
};