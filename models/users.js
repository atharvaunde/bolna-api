const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
    providerId: { type: String, required: true, unique: true },
    name: {
        type: String,
        required: true,
        enum: ['google', 'microsoft-entra-id', 'facebook', 'github'],
    },
    providerId: { type: String, required: true },
    accessToken: { type: String, required: true, select: false },
    refreshToken: { type: String, default: null, select: false },
    idToken: { type: String, default: null, select: false },
    accessTokenExpiry: { type: Date, required: true },
    refreshTokenExpiry: { type: Date, default: null },
    idTokenExpiry: { type: Date, default: null },
    scope: { type: String, default: null },
    tokenType: { type: String, default: 'Bearer' },
    tenantId: { type: String, default: null },
});

const UserSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true, maxLength: 100 },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        profilePicture: { type: String, default: null },
        locale: { type: String, default: null },
        timezone: { type: String, default: null },
        password: { type: String, required: false, minLength: 6 },
        otp: { type: String, default: null },
        otpValidity: { type: Date, default: null },
        passwordResetToken: { type: String, default: null },
        passwordResetExpiry: { type: Date, default: null },
        providers: [ProviderSchema],
        isActive: { type: Boolean, default: true },
        isEmailVerified: { type: Boolean, default: false },
        lastLogin: { type: Date, default: null },
        profileLastSyncedAt: { type: Date, default: null },
        lastGoogleMeetSyncAt: { type: Date, default: null },
        initialSync: { type: String, default: 'pending', enum: ['pending', 'in_progress', 'completed', 'failed'] },
    },
    { timestamps: true, collection: 'users' },
);

UserSchema.index({ 'providers.providerId': 1 });
UserSchema.index({ 'providers.name': 1 });

module.exports = mongoose.model('users', UserSchema);
