const crypto = require('crypto');
const FormData = require('form-data');
const Customers = require('../models/customers');
const Products = require('../models/products');
const Transactions = require('../models/transactions');
const RiskScores = require('../models/riskScores');
const { generateCustomerInsights } = require('./customerInsights.service');
const { handleError, createError } = require('../utils/error');
const bolnaApi = require('../configs/bolna');
const mongoose = require('mongoose');

const tempStore = new Map();
const TOKEN_TTL_MS = 10 * 60 * 1000;

function rupees(n) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

function dateRange(startTime, endTime) {
  const filter = {};
  if (startTime) filter.$gte = new Date(startTime);
  if (endTime) filter.$lte = new Date(endTime);
  return Object.keys(filter).length ? filter : null;
}

function buildMarkdown(insightsList) {
  let md = '# Bank Customer Financial Insights\n\n';
  md += `> Generated: ${new Date().toISOString()}\n\n`;
  md += `> Total customers: ${insightsList.length}\n\n`;
  md += '---\n\n';

  for (const ci of insightsList) {
    md += `## Customer: ${ci.customerName}\n\n`;
    md += `**Risk Level:** ${ci.riskLevel}  \n`;
    md += `**Risk Score:** ${ci.riskScore}/100  \n`;
    if (ci.segment) md += `**Segment:** ${ci.segment}  \n`;
    if (ci.creditScore) md += `**Credit Score:** ${ci.creditScore}  \n`;
    if (ci.occupation) md += `**Occupation:** ${ci.occupation}  \n`;
    md += '\n';

    md += '### Financial Overview\n\n';
    md += `Monthly Income: ${rupees(ci.monthlyIncome)}  \n`;
    md += `Average Monthly Spending: ${rupees(ci.averageSpending)}  \n`;
    if (ci.avgRecentBalance != null)
      md += `Average Recent Balance: ${rupees(ci.avgRecentBalance)}  \n`;
    if (ci.creditUtilizationPct != null && ci.creditUtilizationPct >= 0)
      md += `Credit Card Utilization: ${ci.creditUtilizationPct}%  \n`;
    if (ci.subscriptionBurden > 0)
      md += `Monthly Subscription Burden: ${rupees(ci.subscriptionBurden)}  \n`;
    md += '\n';

    if (ci.topCategories?.length > 0) {
      md += '### Top Spending Categories\n\n';
      ci.topCategories.forEach((c) => {
        md += `- ${c.category}: ${rupees(c.amount)}\n`;
      });
      md += '\n';
    }

    if (ci.subscriptions?.length > 0) {
      md += '### Active Subscriptions\n\n';
      ci.subscriptions.forEach((s) => {
        md += `- ${s}\n`;
      });
      md += '\n';
    }

    if (ci.insights?.length > 0) {
      md += '### Key Observations\n\n';
      ci.insights.forEach((obs) => {
        md += `- ${obs}.\n`;
      });
      md += '\n';
    } else {
      md += '### Key Observations\n\n';
      md += '- No significant risk signals detected. Customer appears financially healthy.\n\n';
    }

    md += '---\n\n';
  }

  return md;
}

function storeMarkdown(markdown) {
  const token = crypto.randomBytes(24).toString('hex');
  tempStore.set(token, markdown);
  setTimeout(() => tempStore.delete(token), TOKEN_TTL_MS);
  return token;
}

async function ingestViaUrl(token) {
  try {
    const PUBLIC_API_URL = process.env.PUBLIC_API_URL;
    if (!PUBLIC_API_URL)
      throw createError(500, 'PUBLIC_API_URL environment variable is not configured');

    const serveUrl = `${PUBLIC_API_URL}/api/bolna/knowledgebase/serve/${token}`;

    const form = new FormData();
    form.append('url', serveUrl);
    form.append('chunk_size', '512');
    form.append('similarity_top_k', '15');
    form.append('overlapping', '128');

    const response = await bolnaApi.post('/knowledgebase', form, {
      headers: form.getHeaders(),
      timeout: 120000,
    });

    return response.data;
  } catch (error) {
    console.error(
      'Error ingesting knowledgebase to Bolna:',
      error.response?.data || error.message || error,
    );
  }
}

exports.serveKnowledgebase = (payload) => {
  const { token } = payload?.params || {};
  const markdown = tempStore.get(token);
  return markdown || null;
};

exports.generateKnowledgebase = async (payload) => {
  try {
    const customers = await Customers.find({}).lean();
    if (!customers.length) throw createError(404, 'No customers found in database');

    const insightsList = [];
    const errors = [];

    for (const customer of customers) {
      try {
        insightsList.push(await generateCustomerInsights(customer._id.toString()));
      } catch (err) {
        errors.push({ customer: customer.name, error: err.message });
      }
    }

    if (!insightsList.length)
      throw createError(500, 'Failed to generate insights for any customer');

    const markdown = buildMarkdown(insightsList);
    const markdownSizeKB = Math.round(markdown.length / 1024);
    const token = storeMarkdown(markdown);
    const bolnaResponse = await ingestViaUrl(token);

    return {
      success: true,
      statusCode: 200,
      message: 'Knowledgebase generated and uploaded to Bolna successfully',
      data: {
        customersProcessed: insightsList.length,
        customersSkipped: errors.length,
        markdownSizeKB,
        ragId: bolnaResponse?.rag_id,
        bolnaStatus: bolnaResponse?.status,
        bolna: bolnaResponse,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  } catch (error) {
    throw handleError(error);
  }
};

exports.previewKnowledgebase = async (payload) => {
  try {
    const customers = await Customers.find({}).lean();
    if (!customers.length) throw createError(404, 'No customers found');

    const insightsList = [];
    for (const customer of customers) {
      try {
        insightsList.push(await generateCustomerInsights(customer._id.toString()));
      } catch (err) {
        console.warn(`[KnowledgebasePreview] Skipping "${customer.name}": ${err.message}`);
      }
    }

    const markdown = buildMarkdown(insightsList);

    return {
      success: true,
      statusCode: 200,
      message: 'Knowledgebase preview generated',
      data: {
        customersProcessed: insightsList.length,
        markdownSizeKB: Math.round(markdown.length / 1024),
        markdown,
      },
    };
  } catch (error) {
    throw handleError(error);
  }
};

exports.getCreditUtilization = async (payload) => {
  try {
    const { customerId } =  payload?.query || {};
    const { startTime, endTime } = payload?.query;
    console.log("Fetching Customer Utilization for customerId:", customerId);
    
    if (!customerId) throw createError(400, 'customerId is required');
    const customer = await Customers.findOne({ customerId }).lean();
    if (!customer) throw createError(404, `Customer not found: ${customerId}`);

    const cid = new mongoose.Types.ObjectId(customer._id);
    const allProducts = await Products.find({ customerId: cid, status: 'ACTIVE' }).lean();

    const txnMatch = {
      customerId: cid,
      status: 'COMPLETED',
    };
    const range = dateRange(startTime, endTime);
    if (range) txnMatch.transactionDate = range;

    const transactions = await Transactions.find(txnMatch).lean();

    const creditCards = allProducts.filter((p) => p.productType === 'CREDIT_CARD');
    const loans = allProducts.filter((p) => p.productType === 'LOAN');
    const fds = allProducts.filter((p) => p.productType === 'FD');
    const rds = allProducts.filter((p) => p.productType === 'RD');

    const creditCardDetails = creditCards.map((card) => {
      const limit = card.metadata?.creditLimit || 0;
      const available = card.metadata?.availableLimit || 0;
      const used = limit - available;
      const utilizationPct = limit > 0 ? Math.round((used / limit) * 100) : 0;
      const dueDate = card.metadata?.paymentDueDate
        ? new Date(card.metadata.paymentDueDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null;
      const billingEnd = card.metadata?.billingCycleEnd
        ? new Date(card.metadata.billingCycleEnd).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          })
        : null;

      const cardTxns = transactions.filter(
        (t) => t.productId?.toString() === card._id.toString() && t.transactionType === 'DEBIT',
      );
      const periodSpend = Math.round(cardTxns.reduce((s, t) => s + t.amount, 0));

      return {
        productName: card.productName,
        cardVariant: card.metadata?.cardVariant || null,
        last4Digits: card.metadata?.last4Digits || card.productNumber?.slice(-4) || null,
        creditLimit: limit,
        creditLimitFormatted: rupees(limit),
        availableLimit: available,
        availableLimitFormatted: rupees(available),
        usedLimit: used,
        usedLimitFormatted: rupees(used),
        utilizationPercent: utilizationPct,
        utilizationStatus:
          utilizationPct >= 90
            ? 'CRITICAL'
            : utilizationPct >= 70
              ? 'HIGH'
              : utilizationPct >= 40
                ? 'MODERATE'
                : 'HEALTHY',
        paymentDueDate: dueDate,
        billingCycleEnd: billingEnd,
        rewardProgram: card.metadata?.rewardProgram || null,
        periodSpend,
        periodSpendFormatted: rupees(periodSpend),
      };
    });

    const loanDetails = loans.map((loan) => {
      const emiAmt = loan.metadata?.emiAmount || 0;
      const outstanding = loan.metadata?.totalOutstandingAmount || loan.metadata?.loanAmount || 0;
      const nextEmiDate = loan.metadata?.nextEmiDate
        ? new Date(loan.metadata.nextEmiDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null;
      const remainingMonths = loan.metadata?.remainingTenureMonths || null;
      const loanEndDate = loan.metadata?.loanEndDate
        ? new Date(loan.metadata.loanEndDate).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric',
          })
        : null;

      const emiTxns = transactions.filter(
        (t) =>
          t.productId?.toString() === loan._id.toString() &&
          (t.instrument === 'EMI_PAYMENT' || t.transactionCategory === 'LOAN'),
      );
      const daysDelayed = emiTxns.filter((t) => {
        const due = loan.metadata?.emiDayOfMonth || 5;
        return new Date(t.transactionDate).getDate() > due + 3;
      }).length;

      return {
        productName: loan.productName,
        loanType: loan.metadata?.loanType || null,
        loanAmount: loan.metadata?.loanAmount || 0,
        loanAmountFormatted: rupees(loan.metadata?.loanAmount || 0),
        emiAmount: emiAmt,
        emiAmountFormatted: rupees(emiAmt),
        totalOutstanding: outstanding,
        totalOutstandingFormatted: rupees(outstanding),
        nextEmiDate,
        remainingTenureMonths: remainingMonths,
        loanEndDate,
        interestRate: loan.metadata?.interestRate || null,
        foreclosureEligible: loan.metadata?.foreclosureEligible ?? null,
        foreclosureAmount: loan.metadata?.foreclosureAmount || null,
        foreclosureAmountFormatted: loan.metadata?.foreclosureAmount
          ? rupees(loan.metadata.foreclosureAmount)
          : null,
        periodEmiPayments: emiTxns.length,
        latePayments: daysDelayed,
      };
    });

    const fdDetails = fds.map((fd) => ({
      productName: fd.productName,
      depositAmount: fd.metadata?.depositAmount || 0,
      depositAmountFormatted: rupees(fd.metadata?.depositAmount || 0),
      maturityAmount: fd.metadata?.maturityAmount || 0,
      maturityAmountFormatted: rupees(fd.metadata?.maturityAmount || 0),
      maturityDate: fd.metadata?.maturityDate
        ? new Date(fd.metadata.maturityDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null,
      interestRate: fd.metadata?.interestRate || null,
      tenureMonths: fd.metadata?.tenureMonths || null,
      autoRenewal: fd.metadata?.autoRenewal ?? null,
    }));

    const rdDetails = rds.map((rd) => ({
      productName: rd.productName,
      monthlyInstallment: rd.metadata?.monthlyInstallment || 0,
      monthlyInstallmentFormatted: rupees(rd.metadata?.monthlyInstallment || 0),
      maturityAmount: rd.metadata?.maturityAmount || 0,
      maturityAmountFormatted: rupees(rd.metadata?.maturityAmount || 0),
      paidInstallments: rd.metadata?.paidInstallments || 0,
      tenureMonths: rd.metadata?.tenureMonths || null,
      maturityDate: rd.metadata?.maturityDate
        ? new Date(rd.metadata.maturityDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null,
      interestRate: rd.metadata?.interestRate || null,
    }));

    const totalCreditLimit = creditCards.reduce((s, p) => s + (p.metadata?.creditLimit || 0), 0);
    const totalAvailable = creditCards.reduce((s, p) => s + (p.metadata?.availableLimit || 0), 0);
    const overallUtilization =
      totalCreditLimit > 0
        ? Math.round(((totalCreditLimit - totalAvailable) / totalCreditLimit) * 100)
        : 0;

    const totalMonthlyEmi = loans.reduce((s, l) => s + (l.metadata?.emiAmount || 0), 0);
    const totalOutstanding = loans.reduce(
      (s, l) => s + (l.metadata?.totalOutstandingAmount || 0),
      0,
    );

    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Credit card alerts
    creditCardDetails.forEach((c) => {
      if (c.utilizationPercent >= 90)
        alerts.push(
          `${c.productName} ending ${c.last4Digits} is at ${c.utilizationPercent}% utilization — critically high`,
        );
      
      // Check if payment is overdue or upcoming
      const card = creditCards.find(cc => cc.productName === c.productName);
      if (card?.metadata?.paymentDueDate) {
        const dueDate = new Date(card.metadata.paymentDueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.round((dueDate - today) / 86400000);
        
        if (daysUntilDue < 0) {
          // Overdue
          const daysOverdue = Math.abs(daysUntilDue);
          alerts.push(
            `⚠️ OVERDUE: ${c.productName} payment was due on ${c.paymentDueDate} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago)`,
          );
        } else if (daysUntilDue === 0) {
          alerts.push(`🔴 URGENT: ${c.productName} payment due TODAY`);
        } else if (daysUntilDue <= 3) {
          alerts.push(`⚠️ ${c.productName} payment due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} (${c.paymentDueDate})`);
        } else if (daysUntilDue <= 7) {
          alerts.push(`${c.productName} payment due on ${c.paymentDueDate}`);
        }
      }
    });

    // Loan alerts
    loanDetails.forEach((l) => {
      if (l.latePayments > 0)
        alerts.push(
          `${l.productName} had ${l.latePayments} late EMI payment(s) in the selected period`,
        );
      
      // Check if EMI is overdue or upcoming
      const loan = loans.find(ln => ln.productName === l.productName);
      if (loan?.metadata?.nextEmiDate) {
        const emiDate = new Date(loan.metadata.nextEmiDate);
        emiDate.setHours(0, 0, 0, 0);
        const daysUntilEmi = Math.round((emiDate - today) / 86400000);
        
        if (daysUntilEmi < 0) {
          // Overdue
          const daysOverdue = Math.abs(daysUntilEmi);
          alerts.push(
            `⚠️ OVERDUE: ${l.productName} EMI of ${l.emiAmountFormatted} was due on ${l.nextEmiDate} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago)`,
          );
        } else if (daysUntilEmi === 0) {
          alerts.push(`🔴 URGENT: ${l.productName} EMI of ${l.emiAmountFormatted} due TODAY`);
        } else if (daysUntilEmi <= 3) {
          alerts.push(
            `⚠️ ${l.productName} EMI of ${l.emiAmountFormatted} due in ${daysUntilEmi} day${daysUntilEmi > 1 ? 's' : ''} (${l.nextEmiDate})`,
          );
        } else if (daysUntilEmi <= 7) {
          alerts.push(`${l.productName} next EMI of ${l.emiAmountFormatted} due on ${l.nextEmiDate}`);
        }
      }
    });

    // FD maturity alerts
    fdDetails.forEach((fd) => {
      const daysToMaturity = fd.maturityDate
        ? Math.round((new Date(fd.maturityDate) - today) / 86400000)
        : null;
      if (daysToMaturity !== null && daysToMaturity <= 30 && daysToMaturity >= 0) {
        alerts.push(
          `FD "${fd.productName}" matures on ${fd.maturityDate} — auto-renewal is ${fd.autoRenewal ? 'ON' : 'OFF'}`,
        );
      }
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        customerName: customer.name,
        customerId: customer._id,
        periodStart: startTime || null,
        periodEnd: endTime || null,
        summary: {
          totalCreditCards: creditCards.length,
          overallCreditUtilizationPercent: overallUtilization,
          totalCreditLimitFormatted: rupees(totalCreditLimit),
          totalAvailableLimitFormatted: rupees(totalAvailable),
          totalMonthlyEmiFormatted: rupees(totalMonthlyEmi),
          totalLoanOutstandingFormatted: rupees(totalOutstanding),
          totalFDs: fds.length,
          totalRDs: rds.length,
        },
        creditCards: creditCardDetails,
        loans: loanDetails,
        fixedDeposits: fdDetails,
        recurringDeposits: rdDetails,
        alerts,
      },
    };
  } catch (error) {
    throw handleError(error);
  }
};

exports.getCustomerContext = async (payload) => {
  try {
    const { customerId } = payload?.query || {};
    console.log("Fetching Customer Context for customerId:", customerId);
    const { startTime, endTime } = payload?.query;
    if (!customerId) throw createError(400, 'customerId is required');
    const customer = await Customers.findOne({ customerId }).lean();
    if (!customer) throw createError(404, `Customer not found: ${customerId}`);

    const cid = new mongoose.Types.ObjectId(customer?._id);

    const txnMatch = { customerId: cid, status: 'COMPLETED' };
    const range = dateRange(startTime, endTime);
    if (range) {
      txnMatch.transactionDate = range;
    } else {
      const since = new Date();
      since.setMonth(since.getMonth() - 3);
      txnMatch.transactionDate = { $gte: since };
    }

    const [transactions, latestRisk] = await Promise.all([
      Transactions.find(txnMatch).sort({ transactionDate: -1 }).lean(),
      RiskScores.findOne({ customerId: cid }).sort({ year: -1, month: -1 }).lean(),
    ]);

    const credits = transactions.filter((t) => t.transactionType === 'CREDIT');
    const debits = transactions.filter((t) => t.transactionType === 'DEBIT');

    const totalCredits = Math.round(credits.reduce((s, t) => s + t.amount, 0));
    const totalDebits = Math.round(debits.reduce((s, t) => s + t.amount, 0));

    const categoryTotals = {};
    debits.forEach((t) => {
      const cat = t.transactionCategory || 'OTHER';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amountFormatted: rupees(Math.round(amount)) }));

    const recentTxns = transactions.slice(0, 5).map((t) => ({
      date: new Date(t.transactionDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
      type: t.transactionType,
      amount: rupees(t.amount),
      description: t.description || t.merchantName || '—',
      category: t.transactionCategory || 'OTHER',
    }));

    const lastBalance = transactions.find(
      (t) => t.balanceAfterTransaction != null || t.balance != null,
    );
    const currentBalance = lastBalance?.balanceAfterTransaction ?? lastBalance?.balance ?? null;

    const highSpendTxns = debits
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((t) => ({
        date: new Date(t.transactionDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
        amount: rupees(t.amount),
        description: t.description || t.merchantName || '—',
        category: t.transactionCategory || 'OTHER',
      }));

    const alerts = [];
    if (latestRisk?.riskLevel === 'HIGH' || latestRisk?.riskLevel === 'CRITICAL') {
      alerts.push(
        `Customer is flagged as ${latestRisk.riskLevel} risk (score: ${latestRisk.riskScore}/100)`,
      );
    }
    if (currentBalance !== null && currentBalance < 5000) {
      alerts.push(`Current account balance is low: ${rupees(currentBalance)}`);
    }
    if (totalDebits > totalCredits * 1.2) {
      alerts.push('Spending significantly exceeds income in the selected period');
    }
    if (customer.kycStatus !== 'VERIFIED') {
      alerts.push(`KYC status is ${customer.kycStatus} — may need follow-up`);
    }

    const profile = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      segment: customer.segment || null,
      occupation: customer.occupation || null,
      employerName: customer.employerName || null,
      annualIncome: customer.annualIncome ? rupees(customer.annualIncome) : null,
      creditScore: customer.creditScore || null,
      kycStatus: customer.kycStatus || null,
      city: customer.address?.city || null,
      onboardingDate: customer.onboardingDate
        ? new Date(customer.onboardingDate).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric',
          })
        : null,
    };

    return {
      success: true,
      statusCode: 200,
      data: {
        profile,
        risk: {
          riskScore: latestRisk?.riskScore ?? customer.riskScore ?? 0,
          riskLevel: latestRisk?.riskLevel ?? customer.riskLevel ?? 'LOW',
          breakdown: latestRisk?.breakdown || null,
        },
        period: {
          start: startTime || null,
          end: endTime || null,
          totalTransactions: transactions.length,
          totalCreditsFormatted: rupees(totalCredits),
          totalDebitsFormatted: rupees(totalDebits),
          netFlowFormatted: rupees(totalCredits - totalDebits),
        },
        currentBalanceFormatted: currentBalance !== null ? rupees(currentBalance) : null,
        topSpendingCategories: topCategories,
        highestSpends: highSpendTxns,
        recentTransactions: recentTxns,
        alerts,
      },
    };
  } catch (error) {
    throw handleError(error);
  }
};
