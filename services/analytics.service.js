const mongoose = require('mongoose');
const Transactions = require('../models/transactions');
const Customers = require('../models/customers');
const { handleError, createError } = require('../utils/error');

exports.getMonthlyTransactions = async (payload) => {
    try {
        const { months = 6 } = payload?.query || {};
        const monthCount = Math.min(parseInt(months) || 6, 24);

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthCount);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const pipeline = [
            { $match: { transactionDate: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$transactionDate' },
                        month: { $month: '$transactionDate' },
                    },
                    totalCount: { $sum: 1 },
                    creditCount: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'CREDIT'] }, 1, 0] },
                    },
                    debitCount: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'DEBIT'] }, 1, 0] },
                    },
                    totalCredits: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'CREDIT'] }, '$amount', 0] },
                    },
                    totalDebits: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'DEBIT'] }, '$amount', 0] },
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ];

        const results = await Transactions.aggregate(pipeline);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = results.map((r) => ({
            month: monthNames[r._id.month - 1],
            year: r._id.year,
            totalCount: r.totalCount,
            creditCount: r.creditCount,
            debitCount: r.debitCount,
            totalCredits: Math.round(r.totalCredits),
            totalDebits: Math.round(r.totalDebits),
        }));

        return {
            success: true,
            statusCode: 200,
            message: 'Monthly transaction analytics retrieved successfully',
            data,
        };
    } catch (error) {
        throw handleError(error);
    }
};

exports.getFinancialSummary = async (payload) => {
    try {
        const { customerId } = payload?.params || {};
        if (!customerId) throw createError(400, 'Customer ID is required');

        const customer = await Customers.findById(customerId).lean();
        if (!customer) throw createError(404, 'Customer not found');

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const pipeline = [
            {
                $match: {
                    customerId: new mongoose.Types.ObjectId(customerId),
                    transactionDate: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$transactionDate' },
                        month: { $month: '$transactionDate' },
                    },
                    totalCredits: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'CREDIT'] }, '$amount', 0] },
                    },
                    totalDebits: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'DEBIT'] }, '$amount', 0] },
                    },
                    txnCount: { $sum: 1 },
                    avgBalance: { $avg: '$balance' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ];

        const categoryPipeline = [
            {
                $match: {
                    customerId: new mongoose.Types.ObjectId(customerId),
                    transactionDate: { $gte: sixMonthsAgo },
                    transactionType: 'DEBIT',
                },
            },
            {
                $group: {
                    _id: '$transactionCategory',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { totalAmount: -1 } },
        ];

        const [monthlyData, categoryData] = await Promise.all([
            Transactions.aggregate(pipeline),
            Transactions.aggregate(categoryPipeline),
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthly = monthlyData.map((r) => ({
            month: monthNames[r._id.month - 1],
            year: r._id.year,
            totalCredits: Math.round(r.totalCredits),
            totalDebits: Math.round(r.totalDebits),
            txnCount: r.txnCount,
            avgBalance: Math.round(r.avgBalance || 0),
        }));

        const categories = categoryData.map((r) => ({
            category: r._id || 'OTHER',
            totalAmount: Math.round(r.totalAmount),
            count: r.count,
        }));

        const totalCredits = monthly.reduce((s, m) => s + m.totalCredits, 0);
        const totalDebits = monthly.reduce((s, m) => s + m.totalDebits, 0);
        const avgMonthlyBalance = monthly.length > 0
            ? Math.round(monthly.reduce((s, m) => s + m.avgBalance, 0) / monthly.length)
            : 0;

        return {
            success: true,
            statusCode: 200,
            message: 'Financial summary retrieved successfully',
            data: {
                monthly,
                categories,
                summary: {
                    totalCredits,
                    totalDebits,
                    netFlow: totalCredits - totalDebits,
                    avgMonthlyBalance,
                    totalTransactions: monthly.reduce((s, m) => s + m.txnCount, 0),
                },
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};
