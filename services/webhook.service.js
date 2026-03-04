const Calls = require('../models/calls');
const { handleError } = require('../utils/error');

exports.handleWebhookEvent = async (payload) => {
    try {
        const { body: event } = payload || {};
        const executionId = event.id;
        if (!executionId) {
            console.warn('[BolnaWebhook] No execution ID in webhook payload, skipping.');
            return;
        }

        const update = {
            status: event.status ?? undefined,
            initiatedAt: event.initiated_at ? new Date(event.initiated_at) : undefined,
            createdAt: event.created_at ? new Date(event.created_at) : undefined,
            updatedAt: event.updated_at ? new Date(event.updated_at) : undefined,
            conversationDuration: event.conversation_duration ?? undefined,
            answeredByVoiceMail: event.answered_by_voice_mail ?? undefined,
            transcript: event.transcript ?? undefined,
            summary: event.summary ?? undefined,
            userNumber: event.user_number ?? undefined,
            agentNumber: event.agent_number ?? undefined,
            telephonyData: event.telephony_data ?? undefined,
            costBreakdown: event.cost_breakdown ?? undefined,
            usageBreakdown: event.usage_breakdown ?? undefined,
            extractedData: event.extracted_data ?? undefined,
            errorMessage: event.error_message ?? undefined,
            rawWebhook: event,
        };

        // Strip undefined keys so we don't overwrite existing fields with undefined
        Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

        const result = await Calls.findOneAndUpdate(
            { executionId },
            { $set: update },
            { new: true },
        );

        if (!result) {
            console.warn(`[BolnaWebhook] No call record found for executionId: ${executionId}`);
        } else {
            console.log(`[BolnaWebhook] Updated call ${executionId} → status: ${result.status}`);
        }

        return result;
    } catch (error) {
        throw handleError(error);
    }
};
