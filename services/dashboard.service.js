const mongoose = require('mongoose');
const Customers = require('../models/customers');
const Transactions = require('../models/transactions');
const Products = require('../models/products');
const RiskScores = require('../models/riskScores');
const Calls = require('../models/calls');
const { handleError } = require('../utils/error');

exports.getOverview = async (payload) => {
    try {
        const { timeframe = '30' } = payload?.query || {};
        const days = parseInt(timeframe);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Parallel aggregation queries for better performance
        const [
            totalCustomers,
            newCustomers,
            customersBySegment,
            customersByRisk,
            recentTransactions,
            productStats,
            highRiskCustomers,
            recentCalls,
        ] = await Promise.all([
            // Total customers
            Customers.countDocuments(),

            // New customers in timeframe
            Customers.countDocuments({ createdAt: { $gte: startDate } }),

            // Customers by segment
            Customers.aggregate([
                { $group: { _id: '$segment', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Customers by risk level
            Customers.aggregate([
                { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Recent transaction statistics
            Transactions.aggregate([
                { $match: { transactionDate: { $gte: startDate } } },
                {
                    $group: {
                        _id: null,
                        totalTransactions: { $sum: 1 },
                        totalCredits: {
                            $sum: { $cond: [{ $eq: ['$transactionType', 'CREDIT'] }, '$amount', 0] },
                        },
                        totalDebits: {
                            $sum: { $cond: [{ $eq: ['$transactionType', 'DEBIT'] }, '$amount', 0] },
                        },
                        avgAmount: { $avg: '$amount' },
                    },
                },
            ]),

            // Product statistics
            Products.aggregate([
                {
                    $group: {
                        _id: '$productType',
                        total: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
                    },
                },
            ]),

            // High risk customers count
            Customers.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } }),

            // Recent calls
            Calls.countDocuments({ createdAt: { $gte: startDate } }),
        ]);

        // Format segment distribution
        const segmentDistribution = customersBySegment.map((s) => ({
            segment: s._id || 'UNDEFINED',
            count: s.count,
        }));

        // Format risk distribution
        const riskDistribution = customersByRisk.map((r) => ({
            riskLevel: r._id || 'UNDEFINED',
            count: r.count,
        }));

        // Format transaction stats
        const transactionStats =
            recentTransactions.length > 0
                ? {
                      total: recentTransactions[0].totalTransactions,
                      totalCredits: Math.round(recentTransactions[0].totalCredits),
                      totalDebits: Math.round(recentTransactions[0].totalDebits),
                      netFlow: Math.round(
                          recentTransactions[0].totalCredits - recentTransactions[0].totalDebits,
                      ),
                      avgAmount: Math.round(recentTransactions[0].avgAmount),
                  }
                : { total: 0, totalCredits: 0, totalDebits: 0, netFlow: 0, avgAmount: 0 };

        // Format product stats
        const productDistribution = productStats.map((p) => ({
            productType: p._id,
            total: p.total,
            active: p.active,
            inactive: p.total - p.active,
        }));

        return {
            success: true,
            statusCode: 200,
            message: 'Dashboard overview retrieved successfully',
            data: {
                timeframe: `${days} days`,
                customers: {
                    total: totalCustomers,
                    new: newCustomers,
                    highRisk: highRiskCustomers,
                    bySegment: segmentDistribution,
                    byRisk: riskDistribution,
                },
                transactions: transactionStats,
                products: {
                    distribution: productDistribution,
                    total: productDistribution.reduce((sum, p) => sum + p.total, 0),
                },
                calls: {
                    recent: recentCalls,
                },
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};

exports.getCustomerMetrics = async (payload) => {
    try {
        const { limit = 10 } = payload?.query || {};

        const [topByNetWorth, topByIncome, recentOnboarded, needingAttention] = await Promise.all([
            // Top customers by net worth
            Customers.find({ netWorthEstimate: { $gt: 0 } })
                .select('customerId name netWorthEstimate segment riskLevel')
                .sort({ netWorthEstimate: -1 })
                .limit(parseInt(limit))
                .lean(),

            // Top customers by annual income
            Customers.find({ annualIncome: { $gt: 0 } })
                .select('customerId name annualIncome segment occupation')
                .sort({ annualIncome: -1 })
                .limit(parseInt(limit))
                .lean(),

            // Recently onboarded customers
            Customers.find({ onboardingDate: { $ne: null } })
                .select('customerId name onboardingDate segment kycStatus')
                .sort({ onboardingDate: -1 })
                .limit(parseInt(limit))
                .lean(),

            // High-risk customers needing attention
            Customers.find({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } })
                .select('customerId name riskLevel riskScore phone email')
                .sort({ riskScore: -1 })
                .limit(parseInt(limit))
                .lean(),
        ]);

        return {
            success: true,
            statusCode: 200,
            message: 'Customer metrics retrieved successfully',
            data: {
                topByNetWorth,
                topByIncome,
                recentOnboarded,
                needingAttention,
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};

exports.getTransactionTrends = async (payload) => {
    try {
        const { months = 6 } = payload?.query || {};
        const monthCount = Math.min(parseInt(months), 12);

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthCount);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // Monthly transaction trends
        const monthlyTrends = await Transactions.aggregate([
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
                    totalVolume: { $sum: '$amount' },
                    creditVolume: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'CREDIT'] }, '$amount', 0] },
                    },
                    debitVolume: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'DEBIT'] }, '$amount', 0] },
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Top transaction categories
        const topCategories = await Transactions.aggregate([
            { $match: { transactionDate: { $gte: startDate } } },
            {
                $group: {
                    _id: '$transactionCategory',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                },
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 10 },
        ]);

        // Transaction by instrument
        const byInstrument = await Transactions.aggregate([
            { $match: { transactionDate: { $gte: startDate } } },
            {
                $group: {
                    _id: '$instrument',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                },
            },
            { $sort: { count: -1 } },
        ]);

        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];

        const trends = monthlyTrends.map((m) => ({
            month: monthNames[m._id.month - 1],
            year: m._id.year,
            totalCount: m.totalCount,
            creditCount: m.creditCount,
            debitCount: m.debitCount,
            totalVolume: Math.round(m.totalVolume),
            creditVolume: Math.round(m.creditVolume),
            debitVolume: Math.round(m.debitVolume),
            netFlow: Math.round(m.creditVolume - m.debitVolume),
        }));

        return {
            success: true,
            statusCode: 200,
            message: 'Transaction trends retrieved successfully',
            data: {
                monthlyTrends: trends,
                topCategories: topCategories.map((c) => ({
                    category: c._id || 'UNCATEGORIZED',
                    count: c.count,
                    totalAmount: Math.round(c.totalAmount),
                })),
                byInstrument: byInstrument.map((i) => ({
                    instrument: i._id || 'UNKNOWN',
                    count: i.count,
                    totalAmount: Math.round(i.totalAmount),
                })),
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};

exports.getRiskAnalysis = async (payload) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const [riskTrends, criticalCustomers, riskDistribution] = await Promise.all([
            // Risk score trends over last 6 months
            RiskScores.aggregate([
                {
                    $group: {
                        _id: { year: '$year', month: '$month' },
                        avgRiskScore: { $avg: '$riskScore' },
                        lowCount: { $sum: { $cond: [{ $eq: ['$riskLevel', 'LOW'] }, 1, 0] } },
                        mediumCount: { $sum: { $cond: [{ $eq: ['$riskLevel', 'MEDIUM'] }, 1, 0] } },
                        highCount: { $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] } },
                        criticalCount: {
                            $sum: { $cond: [{ $eq: ['$riskLevel', 'CRITICAL'] }, 1, 0] },
                        },
                    },
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 },
            ]),

            // Critical risk customers with details
            RiskScores.aggregate([
                { $match: { year: currentYear, month: currentMonth, riskLevel: 'CRITICAL' } },
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: 'customer',
                    },
                },
                { $unwind: '$customer' },
                {
                    $project: {
                        customerId: '$customer._id',
                        customerName: '$customer.name',
                        customerEmail: '$customer.email',
                        customerPhone: '$customer.phone',
                        riskScore: 1,
                        riskLevel: 1,
                        breakdown: 1,
                    },
                },
                { $sort: { riskScore: -1 } },
                { $limit: 20 },
            ]),

            // Current risk distribution with breakdown
            RiskScores.aggregate([
                { $match: { year: currentYear, month: currentMonth } },
                {
                    $group: {
                        _id: '$riskLevel',
                        count: { $sum: 1 },
                        avgScore: { $avg: '$riskScore' },
                        avgSavingsScore: { $avg: '$breakdown.savingsScore' },
                        avgSpendingSpikeScore: { $avg: '$breakdown.spendingSpikeScore' },
                        avgBalanceHealthScore: { $avg: '$breakdown.balanceHealthScore' },
                        avgSubscriptionScore: { $avg: '$breakdown.subscriptionScore' },
                        avgVolatilityScore: { $avg: '$breakdown.volatilityScore' },
                    },
                },
                { $sort: { avgScore: -1 } },
            ]),
        ]);

        return {
            success: true,
            statusCode: 200,
            message: 'Risk analysis retrieved successfully',
            data: {
                riskTrends: riskTrends.reverse(),
                criticalCustomers,
                riskDistribution: riskDistribution.map((r) => ({
                    riskLevel: r._id,
                    count: r.count,
                    avgScore: Math.round(r.avgScore),
                    breakdown: {
                        savings: Math.round(r.avgSavingsScore || 0),
                        spendingSpike: Math.round(r.avgSpendingSpikeScore || 0),
                        balanceHealth: Math.round(r.avgBalanceHealthScore || 0),
                        subscription: Math.round(r.avgSubscriptionScore || 0),
                        volatility: Math.round(r.avgVolatilityScore || 0),
                    },
                })),
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};

exports.getProductInsights = async (payload) => {
    try {
        const [
            productDistribution,
            creditCardUtilization,
            loanStatistics,
            accountBalance,
            inactiveProducts,
        ] = await Promise.all([
            // Product type distribution
            Products.aggregate([
                {
                    $group: {
                        _id: '$productType',
                        total: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
                        inactive: { $sum: { $cond: [{ $eq: ['$status', 'INACTIVE'] }, 1, 0] } },
                        closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
                    },
                },
                { $sort: { total: -1 } },
            ]),

            // Credit card utilization
            Products.aggregate([
                {
                    $match: {
                        productType: 'CREDIT_CARD',
                        status: 'ACTIVE',
                        'metadata.creditLimit': { $gt: 0 },
                    },
                },
                {
                    $project: {
                        creditLimit: '$metadata.creditLimit',
                        availableLimit: '$metadata.availableLimit',
                        utilization: {
                            $multiply: [
                                {
                                    $divide: [
                                        {
                                            $subtract: [
                                                '$metadata.creditLimit',
                                                '$metadata.availableLimit',
                                            ],
                                        },
                                        '$metadata.creditLimit',
                                    ],
                                },
                                100,
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalCards: { $sum: 1 },
                        avgUtilization: { $avg: '$utilization' },
                        totalCreditLimit: { $sum: '$creditLimit' },
                        totalAvailable: { $sum: '$availableLimit' },
                        highUtilization: {
                            $sum: { $cond: [{ $gte: ['$utilization', 80] }, 1, 0] },
                        },
                    },
                },
            ]),

            // Loan statistics
            Products.aggregate([
                { $match: { productType: 'LOAN', status: 'ACTIVE' } },
                {
                    $group: {
                        _id: '$metadata.loanType',
                        count: { $sum: 1 },
                        totalOutstanding: { $sum: '$metadata.totalOutstandingAmount' },
                        avgEmi: { $avg: '$metadata.emiAmount' },
                    },
                },
                { $sort: { count: -1 } },
            ]),

            // Account balances
            Products.aggregate([
                {
                    $match: {
                        productType: { $in: ['SAVINGS_ACCOUNT', 'CURRENT_ACCOUNT'] },
                        status: 'ACTIVE',
                    },
                },
                {
                    $group: {
                        _id: '$productType',
                        count: { $sum: 1 },
                        totalBalance: { $sum: '$metadata.currentBalance' },
                        avgBalance: { $avg: '$metadata.currentBalance' },
                    },
                },
            ]),

            // Recently inactive products
            Products.find({ status: { $in: ['INACTIVE', 'CLOSED'] } })
                .select('productType productName status updatedAt')
                .populate('customerId', 'name email')
                .sort({ updatedAt: -1 })
                .limit(10)
                .lean(),
        ]);

        return {
            success: true,
            statusCode: 200,
            message: 'Product insights retrieved successfully',
            data: {
                distribution: productDistribution,
                creditCards:
                    creditCardUtilization.length > 0
                        ? {
                              total: creditCardUtilization[0].totalCards,
                              avgUtilization: Math.round(
                                  creditCardUtilization[0].avgUtilization || 0,
                              ),
                              totalCreditLimit: Math.round(
                                  creditCardUtilization[0].totalCreditLimit,
                              ),
                              totalAvailable: Math.round(creditCardUtilization[0].totalAvailable),
                              highUtilization: creditCardUtilization[0].highUtilization,
                          }
                        : null,
                loans: loanStatistics.map((l) => ({
                    loanType: l._id || 'UNSPECIFIED',
                    count: l.count,
                    totalOutstanding: Math.round(l.totalOutstanding || 0),
                    avgEmi: Math.round(l.avgEmi || 0),
                })),
                accounts: accountBalance.map((a) => ({
                    accountType: a._id,
                    count: a.count,
                    totalBalance: Math.round(a.totalBalance || 0),
                    avgBalance: Math.round(a.avgBalance || 0),
                })),
                recentlyInactive: inactiveProducts,
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};
