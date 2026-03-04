const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema(
    {
        executionId: { type: String, required: true, unique: true, index: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true, index: true },
        customerName: { type: String, default: null },
        customerPhone: { type: String, default: null },
        agentId: { type: String, default: null },
        status: { type: String, default: 'queued' },
        initiatedAt: { type: Date, default: null },
        createdAt: { type: Date, default: null },
        updatedAt: { type: Date, default: null },
        conversationDuration: { type: Number, default: null },
        answeredByVoiceMail: { type: Boolean, default: null },
        transcript: { type: String, default: null },
        summary: { type: String, default: null },
        userNumber: { type: String, default: null },
        agentNumber: { type: String, default: null },
        telephonyData: { type: mongoose.Schema.Types.Mixed, default: null },
        costBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
        usageBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
        extractedData: { type: mongoose.Schema.Types.Mixed, default: null },
        errorMessage: { type: String, default: null },
        rawWebhook: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true, collection: 'calls' },
);

module.exports = mongoose.model('calls', CallSchema);
