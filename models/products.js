const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'customers',
      required: true,
      index: true,
    },
    productType: {
      type: String,
      required: true,
      enum: ['SAVINGS_ACCOUNT', 'CURRENT_ACCOUNT', 'CREDIT_CARD', 'LOAN', 'FD', 'RD'],
    },
    productName: { type: String, required: true, trim: true },
    productNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      default: 'ACTIVE',
      enum: ['ACTIVE', 'INACTIVE', 'CLOSED'],
    },
    metadata: {
      cardVariant: { type: String, default: null },
      last4Digits: { type: String, default: null },
      creditLimit: { type: Number, default: null },
      availableLimit: { type: Number, default: null },
      billingCycleStart: { type: Date, default: null },
      billingCycleEnd: { type: Date, default: null },
      paymentDueDate: { type: Date, default: null },
      rewardProgram: { type: String, default: null },
      issueDate: { type: Date, default: null },
      expiryDate: { type: Date, default: null },

      loanAmount: { type: Number, default: null },
      loanType: { type: String, default: null },
      emiAmount: { type: Number, default: null },
      emiDayOfMonth: { type: Number, default: null },
      loanStartDate: { type: Date, default: null },
      loanEndDate: { type: Date, default: null },
      remainingTenureMonths: { type: Number, default: null },
      foreclosureEligible: { type: Boolean, default: null },
      foreclosureAmount: { type: Number, default: null },
      foreclosureDate: { type: Date, default: null },
      nextEmiDate: { type: Date, default: null },
      nextEmiAmount: { type: Number, default: null },
      totalOutstandingAmount: { type: Number, default: null },

      accountType: { type: String, default: null },
      branchCode: { type: String, default: null },
      ifscCode: { type: String, default: null },
      minimumBalance: { type: Number, default: null },

      interestRate: { type: Number, default: null },

      depositAmount: { type: Number, default: null },
      startDate: { type: Date, default: null },
      maturityDate: { type: Date, default: null },
      maturityAmount: { type: Number, default: null },
      autoRenewal: { type: Boolean, default: null },
      tenureMonths: { type: Number, default: null },

      monthlyInstallment: { type: Number, default: null },
      paidInstallments: { type: Number, default: null },
    },
  },
  { timestamps: true, collection: 'products' },
);

ProductSchema.index({ customerId: 1, productType: 1 });

module.exports = mongoose.model('products', ProductSchema);
