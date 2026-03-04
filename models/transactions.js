const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
    {
        transactionId: { type: String, required: true, unique: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true, index: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true, index: true },
        productType: { type: String, enum: ['SAVINGS_ACCOUNT', 'CURRENT_ACCOUNT', 'CREDIT_CARD', 'LOAN', 'FD', 'RD'], default: null },
        transactionDate: { type: Date, required: true },
        valueDate: { type: Date, default: null },
        initiationTimestamp: { type: Date, default: null },
        settlementTimestamp: { type: Date, default: null },
        description: { type: String, default: null },
        transactionType: {
            type: String,
            required: true,
            enum: ['CREDIT', 'DEBIT'],
        },
        amount: { type: Number, required: true },
        balance: { type: Number, default: null },
        balanceAfterTransaction: { type: Number, default: null },
        currency: { type: String, default: 'INR' },
        instrument: {
            type: String,
            default: null,
            enum: [
                'UPI',
                'NEFT',
                'IMPS',
                'RTGS',
                'CARD',
                'ATM',
                'CHEQUE',
                'TPT',
                'BANK_INTERNAL_TRANSFER',
                'STANDING_INSTRUCTION',
                'AUTO_DEBIT',
                'LOAN_DISBURSEMENT',
                'EMI_PAYMENT',
                'EMI_FORECAST',
                'INTEREST_CREDIT',
                'FD_BOOKING',
                'FD_MATURITY',
                'RD_INSTALLMENT',
                'REVERSAL',
            ],
        },
        channel: {
            type: String,
            default: null,
            enum: ['MOBILE_APP', 'INTERNET_BANKING', 'BRANCH', 'ATM', 'POS', 'API', 'PHONE_BANKING', 'AGENT'],
        },
        transactionCategory: {
            type: String,
            default: 'OTHER',
            enum: [
                'SALARY',
                'RENT',
                'SHOPPING',
                'FOOD',
                'UTILITIES',
                'LOAN',
                'INVESTMENT',
                'TRANSFER',
                'TRAVEL',
                'SUBSCRIPTION',
                'OTHER',
            ],
        },
        subCategory: { type: String, default: null },
        autoTagged: { type: Boolean, default: true },
        merchantName: { type: String, default: null },
        merchantCity: { type: String, default: null },
        merchantCategoryCode: { type: String, default: null },
        tags: [{ type: String }],
        referenceId: { type: String, default: null },
        referenceNumber: { type: String, default: null },
        remarks: { type: String, default: null },
        isReversal: { type: Boolean, default: false },
        parentTransactionId: { type: String, default: null },
        status: {
            type: String,
            default: 'COMPLETED',
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED', 'PROCESSING'],
        },
    },
    { timestamps: true, collection: 'transactions' },
);

TransactionSchema.index({ customerId: 1, transactionDate: -1 });
TransactionSchema.index({ productId: 1, transactionDate: -1 });
TransactionSchema.index({ productType: 1 });
TransactionSchema.index({ transactionCategory: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ merchantName: 1 });

module.exports = mongoose.model('transactions', TransactionSchema);
