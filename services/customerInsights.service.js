const mongoose = require('mongoose');
const Transactions = require('../models/transactions');
const Products = require('../models/products');
const Customers = require('../models/customers');
const { handleError, createError } = require('../utils/error');

const SUBSCRIPTION_KEYWORDS =
  /netflix|spotify|youtube\s?premium|prime|hotstar|disney|adobe|microsoft\s?365|linkedin|cult\.fit|apple\s?icloud|gym\s?membership/i;
const KNOWN_SUBSCRIPTION_SERVICES = [
  'Netflix',
  'Spotify',
  'Amazon Prime',
  'YouTube Premium',
  'Hotstar',
  'Disney+',
  'Adobe Creative Cloud',
  'Microsoft 365',
  'Apple iCloud',
  'LinkedIn Premium',
  'Cult.fit',
];

function resolveSubscriptionLabel(txn) {
  const src = `${txn.merchantName || ''} ${txn.description || ''}`.toLowerCase();
  for (const service of KNOWN_SUBSCRIPTION_SERVICES) {
    if (src.includes(service.toLowerCase().split(' ')[0])) return service;
  }
  //  Fallback: first 25 chars of description
  return (txn.description || txn.merchantName || 'Unknown').split('–').pop().trim().slice(0, 25);
}

exports.generateCustomerInsights = async (customerId) => {
  try {
    const customer = await Customers.findById(customerId).lean();
    if (!customer) throw createError(404, 'Customer not found');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const transactions = await Transactions.find({
      customerId: new mongoose.Types.ObjectId(customerId),
      transactionDate: { $gte: sixMonthsAgo },
      status: 'COMPLETED',
    }).lean();

    // Monthly Income (SALARY credits)
    const salaryTxns = transactions.filter(
      (t) => t.transactionType === 'CREDIT' && t.transactionCategory === 'SALARY',
    );
    const totalSalary = salaryTxns.reduce((s, t) => s + t.amount, 0);
    const monthlyIncome = Math.round(totalSalary / 6);

    // Monthly Spending buckets
    const monthlySpendingMap = {};
    transactions
      .filter((t) => t.transactionType === 'DEBIT')
      .forEach((t) => {
        const d = new Date(t.transactionDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlySpendingMap[key] = (monthlySpendingMap[key] || 0) + t.amount;
      });
    const spendingValues = Object.values(monthlySpendingMap);
    const averageSpending =
      spendingValues.length > 0
        ? Math.round(spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length)
        : 0;

    // Top Spending Categories
    const categoryTotals = {};
    transactions
      .filter((t) => t.transactionType === 'DEBIT')
      .forEach((t) => {
        const cat = t.transactionCategory || 'OTHER';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      });
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([category, amount]) => ({ category, amount: Math.round(amount) }));

    // Subscription Detection
    const subscriptionTxns = transactions.filter(
      (t) =>
        t.transactionType === 'DEBIT' &&
        (t.instrument === 'AUTO_DEBIT' ||
          t.instrument === 'STANDING_INSTRUCTION' ||
          SUBSCRIPTION_KEYWORDS.test(t.description || '') ||
          SUBSCRIPTION_KEYWORDS.test(t.merchantName || '')),
    );
    const subscriptionLabels = [...new Set(subscriptionTxns.map(resolveSubscriptionLabel))]
      .filter(Boolean)
      .slice(0, 10);
    const monthlySubscriptionBurden = Math.round(
      subscriptionTxns.reduce((s, t) => s + t.amount, 0) / 6,
    );

    // Credit Card Utilization
    const creditCards = await Products.find({
      customerId: new mongoose.Types.ObjectId(customerId),
      productType: 'CREDIT_CARD',
      status: 'ACTIVE',
    }).lean();
    const totalCreditLimit = creditCards.reduce((s, p) => s + (p.metadata?.creditLimit || 0), 0);
    const totalAvailableLimit = creditCards.reduce(
      (s, p) => s + (p.metadata?.availableLimit || 0),
      0,
    );
    const creditUtilizationPct =
      totalCreditLimit > 0
        ? Math.round(((totalCreditLimit - totalAvailableLimit) / totalCreditLimit) * 100)
        : 0;

    // Spending Spike Detection
    const spendingKeys = Object.keys(monthlySpendingMap).sort();
    let spendingSpikePercent = 0;
    if (spendingKeys.length >= 2) {
      const last = monthlySpendingMap[spendingKeys[spendingKeys.length - 1]];
      const prev = monthlySpendingMap[spendingKeys[spendingKeys.length - 2]];
      if (prev > 0) spendingSpikePercent = Math.round(((last - prev) / prev) * 100);
    }

    // Balance Health
    const balanceTxns = transactions
      .filter((t) => t.balanceAfterTransaction != null || t.balance != null)
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 60);

    const balances = balanceTxns.map((t) => t.balanceAfterTransaction ?? t.balance ?? 0);
    const avgRecentBalance =
      balances.length > 0 ? Math.round(balances.reduce((a, b) => a + b, 0) / balances.length) : 0;
    const minRecentBalance = balances.length > 0 ? Math.min(...balances) : 0;
    const lowBalanceEvents = balances.filter((b) => b < 5000).length;

    // EMI Delays
    const loanProducts = await Products.find({
      customerId: new mongoose.Types.ObjectId(customerId),
      productType: 'LOAN',
      status: 'ACTIVE',
    }).lean();
    let emiDelayCount = 0;
    loanProducts.forEach((loan) => {
      const dueDay = loan.metadata?.emiDayOfMonth || 5;
      const emiAmt = loan.metadata?.emiAmount || 0;
      const loanEmiTxns = transactions.filter(
        (t) =>
          t.transactionType === 'DEBIT' &&
          (t.instrument === 'EMI_PAYMENT' || t.transactionCategory === 'LOAN') &&
          t.amount >= emiAmt * 0.8,
      );
      emiDelayCount += loanEmiTxns.filter(
        (t) => new Date(t.transactionDate).getDate() > dueDay + 3,
      ).length;
    });

    // Build Human-Readable Insights
    const insights = [];
    if (spendingSpikePercent > 30) {
      insights.push(`Spending increased by ${spendingSpikePercent}% compared to last month`);
    }
    if (creditUtilizationPct > 80) {
      insights.push(`Credit card utilization exceeds ${creditUtilizationPct}% of credit limit`);
    }
    if (lowBalanceEvents > 3) {
      insights.push('Balance drops below ₹5,000 near month end');
    }
    if (
      monthlySubscriptionBurden > 0 &&
      monthlyIncome > 0 &&
      monthlySubscriptionBurden > monthlyIncome * 0.1
    ) {
      insights.push('Recurring subscription charges exceed 10% of monthly income');
    }
    if (emiDelayCount > 0) {
      insights.push(
        `Loan EMI payments were delayed ${emiDelayCount} time${emiDelayCount > 1 ? 's' : ''}`,
      );
    }
    if (averageSpending > monthlyIncome * 0.9 && monthlyIncome > 0) {
      insights.push(
        `Average spending (₹${averageSpending.toLocaleString('en-IN')}) is ` +
          `${Math.round((averageSpending / monthlyIncome) * 100)}% of monthly income`,
      );
    }
    if (minRecentBalance < 1000 && balances.length > 0) {
      insights.push(
        `Account balance reached critically low levels (min ₹${minRecentBalance.toLocaleString('en-IN')})`,
      );
    }

    return {
      customerId: customer._id.toString(),
      customerName: customer.name,
      riskScore: customer.riskScore ?? 0,
      riskLevel: customer.riskLevel ?? 'LOW',
      segment: customer.segment,
      creditScore: customer.creditScore,
      occupation: customer.occupation || customer.profileMetadata?.occupation,
      annualIncome: customer.annualIncome || customer.profileMetadata?.annualIncome,
      monthlyIncome,
      averageSpending,
      subscriptionBurden: monthlySubscriptionBurden,
      creditUtilizationPct,
      avgRecentBalance,
      minRecentBalance,
      lowBalanceEvents,
      topCategories,
      subscriptions: subscriptionLabels,
      emiDelayCount,
      spendingSpikePercent,
      insights,
    };
  } catch (error) {
    throw handleError(error);
  }
};

exports.getCustomerInsights = async (payload) => {
  try {
    const { customerId } = payload?.params || {};
    if (!customerId) throw createError(400, 'Customer ID is required');

    const insights = await exports.generateCustomerInsights(customerId);
    return {
      success: true,
      statusCode: 200,
      message: 'Customer insights generated successfully',
      data: insights,
    };
  } catch (error) {
    throw handleError(error);
  }
};
