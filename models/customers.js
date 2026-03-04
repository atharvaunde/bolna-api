const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxLength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    panNumber: { type: String, default: null, trim: true },
    aadhaarMasked: { type: String, default: null, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: null },
    address: {
      line1: { type: String, default: null },
      line2: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      pincode: { type: String, default: null },
      country: { type: String, default: 'India' },
    },
    occupation: { type: String, default: null },
    employerName: { type: String, default: null },
    employmentType: {
      type: String,
      enum: ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'RETIRED', 'STUDENT'],
      default: null,
    },
    annualIncome: { type: Number, default: 0 },
    incomeSource: { type: String, default: null },
    netWorthEstimate: { type: Number, default: 0 },
    creditScore: { type: Number, default: null },
    onboardingDate: { type: Date, default: null },
    kycStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'],
      default: 'PENDING',
    },
    segment: {
      type: String,
      enum: ['MASS', 'MASS_AFFLUENT', 'AFFLUENT', 'HNI', 'ULTRA_HNI'],
      default: 'MASS',
    },
    relationshipManagerId: { type: String, default: null },
    riskScore: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    profileMetadata: {
      occupation: { type: String, default: null },
      annualIncome: { type: Number, default: 0 },
      city: { type: String, default: null },
      relationshipManagerId: { type: String, default: null },
    },
  },
  { timestamps: true, collection: 'customers' },
);

CustomerSchema.index({ name: 1 });
CustomerSchema.index({ riskLevel: 1 });
CustomerSchema.index({ 'address.city': 1 });
CustomerSchema.index({ 'profileMetadata.city': 1 });
CustomerSchema.index({ segment: 1 });
CustomerSchema.index({ kycStatus: 1 });

module.exports = mongoose.model('customers', CustomerSchema);
