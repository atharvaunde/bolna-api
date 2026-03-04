const mongoose = require('mongoose');

const RiskScoreSchema = new mongoose.Schema(
    {
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true, index: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        riskScore: { type: Number, required: true, default: 0 },
        riskLevel: {
            type: String,
            required: true,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: 'LOW',
        },
        breakdown: {
            savingsScore: { type: Number, default: 0 },
            spendingSpikeScore: { type: Number, default: 0 },
            balanceHealthScore: { type: Number, default: 0 },
            subscriptionScore: { type: Number, default: 0 },
            volatilityScore: { type: Number, default: 0 },
        },
    },
    { timestamps: true, collection: 'riskScores' },
);

RiskScoreSchema.index({ customerId: 1, year: -1, month: -1 });

module.exports = mongoose.model('riskScores', RiskScoreSchema);
