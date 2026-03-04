const mongoose = require('mongoose');
const Customers = require('../models/customers');
const Transactions = require('../models/transactions');
const RiskScores = require('../models/riskScores');
const { handleError, createError } = require('../utils/error');

const getRiskLevel = (score) => {
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MEDIUM';
    if (score <= 80) return 'HIGH';
    return 'CRITICAL';
};

exports.calculateRisk = async (payload) => {
    try {
        const { customerId } = payload?.params || {};
        if (!customerId) throw createError(400, 'Customer ID is required');

        const customer = await Customers.findById(customerId);
        if (!customer) throw createError(404, 'Customer not found');

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const transactions = await Transactions.find({
            customerId: new mongoose.Types.ObjectId(customerId),
            transactionDate: { $gte: sixMonthsAgo },
        }).lean();

        const totalCredits = transactions
            .filter((t) => t.transactionType === 'CREDIT')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalDebits = transactions
            .filter((t) => t.transactionType === 'DEBIT')
            .reduce((sum, t) => sum + t.amount, 0);

        const annualIncome = customer.profileMetadata?.annualIncome || 0;
        const monthlyIncome = annualIncome / 12;

        let savingsScore = 0;
        if (totalCredits > 0) {
            const savingsRate = ((totalCredits - totalDebits) / totalCredits) * 100;
            if (savingsRate < 10) savingsScore = 30;
            else if (savingsRate <= 20) savingsScore = 15;
        } else {
            savingsScore = 30;
        }

        let spendingSpikeScore = 0;
        let spendingIncreasePercent = 0;
        const monthlySpending = {};
        transactions
            .filter((t) => t.transactionType === 'DEBIT')
            .forEach((t) => {
                const key = `${new Date(t.transactionDate).getFullYear()}-${new Date(t.transactionDate).getMonth()}`;
                monthlySpending[key] = (monthlySpending[key] || 0) + t.amount;
            });

        const spendingKeys = Object.keys(monthlySpending).sort();
        const spendingValues = Object.values(monthlySpending);
        if (spendingKeys.length >= 2) {
            const lastMonthSpending = monthlySpending[spendingKeys[spendingKeys.length - 1]];
            const prevMonthSpending = monthlySpending[spendingKeys[spendingKeys.length - 2]];
            if (prevMonthSpending > 0) {
                spendingIncreasePercent = ((lastMonthSpending - prevMonthSpending) / prevMonthSpending) * 100;
                if (spendingIncreasePercent > 30) spendingSpikeScore = 20;
                else if (spendingIncreasePercent > 20) spendingSpikeScore = 10;
            }
        }

        let balanceHealthScore = 0;
        let lastBalance = null;
        const recentSavingsTxns = transactions
            .filter(
                (t) =>
                    t.productType === 'SAVINGS_ACCOUNT' &&
                    t.balance !== null &&
                    t.balance !== undefined,
            )
            .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

        if (recentSavingsTxns.length > 0) {
            lastBalance = recentSavingsTxns[0].balance;
            const threshold = monthlyIncome || 50000;
            if (lastBalance < threshold * 0.5) balanceHealthScore = 35;
            else if (lastBalance < threshold) balanceHealthScore = 25;
            else if (lastBalance < threshold * 2) balanceHealthScore = 15;
        } else {
            balanceHealthScore = 25;
        }

        let subscriptionScore = 0;
        const SUBSCRIPTION_KEYWORDS = /netflix|spotify|aws|gym|saas|youtube|prime|hotstar|disney|swiggy\s?one|zomato\s?pro/i;
        if (monthlyIncome > 0) {
            const subscriptionTransactions = transactions.filter(
                (t) =>
                    t.transactionType === 'DEBIT' &&
                    (t.instrument === 'AUTO_DEBIT' ||
                        t.instrument === 'STANDING_INSTRUCTION' ||
                        SUBSCRIPTION_KEYWORDS.test(t.description || '') ||
                        SUBSCRIPTION_KEYWORDS.test(t.remarks || '')),
            );
            const totalSubscription = subscriptionTransactions.reduce((sum, t) => sum + t.amount, 0);
            const monthlySubscription = totalSubscription / 6;
            if ((monthlySubscription / monthlyIncome) * 100 > 10) {
                subscriptionScore = 10;
            }
        }

        let volatilityScore = 0;
        if (spendingValues.length >= 2) {
            const meanSpending = spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length;
            const variance = spendingValues.reduce((sum, v) => sum + Math.pow(v - meanSpending, 2), 0) / spendingValues.length;
            const stdDev = Math.sqrt(variance);
            const cv = meanSpending > 0 ? (stdDev / meanSpending) * 100 : 0;
            if (cv > 50) volatilityScore = 15;
        }

        let riskScore = savingsScore + spendingSpikeScore + balanceHealthScore + subscriptionScore + volatilityScore;
        riskScore = Math.min(riskScore, 100);

        const riskLevel = getRiskLevel(riskScore);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        await RiskScores.findOneAndUpdate(
            { customerId: new mongoose.Types.ObjectId(customerId), month, year },
            {
                riskScore,
                riskLevel,
                breakdown: {
                    savingsScore,
                    spendingSpikeScore,
                    balanceHealthScore,
                    subscriptionScore,
                    volatilityScore,
                },
            },
            { upsert: true, new: true },
        );

        await Customers.findByIdAndUpdate(customerId, { riskScore, riskLevel });

        const insights = [];
        if (savingsScore > 0) {
            const savingsRate = totalCredits > 0 ? (((totalCredits - totalDebits) / totalCredits) * 100).toFixed(1) : 0;
            insights.push(`Savings rate dropped below ${savingsScore >= 30 ? '10%' : '20%'} (currently ${savingsRate}%)`);
        }
        if (spendingSpikeScore > 0) {
            insights.push(`Spending increased by ${Math.round(spendingIncreasePercent)}% compared to last month`);
        }
        if (balanceHealthScore > 0 && lastBalance !== null) {
            insights.push(`Average balance fell below threshold (₹${lastBalance.toLocaleString('en-IN')})`);
        }
        if (subscriptionScore > 0) {
            insights.push('Recurring subscription charges exceed 10% of monthly income');
        }
        if (volatilityScore > 0) {
            insights.push('High volatility detected in monthly spending patterns');
        }

        return {
            success: true,
            statusCode: 200,
            message: 'Risk score calculated successfully',
            data: {
                customerId,
                riskScore,
                riskLevel,
                breakdown: {
                    savingsScore,
                    spendingSpikeScore,
                    balanceHealthScore,
                    subscriptionScore,
                    volatilityScore,
                },
                insights,
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};

exports.getRiskSummary = async (payload) => {
    try {
        const { customerId } = payload?.params || {};
        if (!customerId) throw createError(400, 'Customer ID is required');

        const customer = await Customers.findById(customerId).lean();
        if (!customer) throw createError(404, 'Customer not found');

        const latestRisk = await RiskScores.findOne({ customerId: new mongoose.Types.ObjectId(customerId) })
            .sort({ year: -1, month: -1 })
            .lean();

        const topRiskFactors = [];
        if (latestRisk?.breakdown) {
            const { savingsScore, spendingSpikeScore, balanceHealthScore, subscriptionScore, volatilityScore } = latestRisk.breakdown;
            if (savingsScore > 0) topRiskFactors.push({ factor: 'Low Savings Rate', score: savingsScore });
            if (spendingSpikeScore > 0) topRiskFactors.push({ factor: 'Spending Spike', score: spendingSpikeScore });
            if (balanceHealthScore > 0) topRiskFactors.push({ factor: 'Low Balance', score: balanceHealthScore });
            if (subscriptionScore > 0) topRiskFactors.push({ factor: 'High Subscription Burden', score: subscriptionScore });
            if (volatilityScore > 0) topRiskFactors.push({ factor: 'High Volatility', score: volatilityScore });
            topRiskFactors.sort((a, b) => b.score - a.score);
        }

        return {
            success: true,
            statusCode: 200,
            message: 'Risk summary retrieved successfully',
            data: {
                riskScore: customer.riskScore,
                riskLevel: customer.riskLevel,
                riskBreakdown: latestRisk?.breakdown || null,
                topRiskFactors,
            },
        };
    } catch (error) {
        throw handleError(error);
    }
};
