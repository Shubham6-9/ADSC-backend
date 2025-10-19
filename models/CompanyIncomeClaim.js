import mongoose from 'mongoose';

const companyIncomeClaimSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  incomeAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  netIncome: {
    type: Number,
    required: true
  },
  coinsEarned: {
    type: Number,
    required: true
  },
  profitPercentage: {
    type: Number,
    default: 0
  },
  daysClaimed: {
    type: Number,
    default: 1
  },
  companyValueAtClaim: {
    type: Number,
    default: 0
  },
  companyLevel: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for efficient queries
companyIncomeClaimSchema.index({ user: 1, company: 1, createdAt: -1 });
companyIncomeClaimSchema.index({ company: 1, createdAt: -1 });

export default mongoose.model('CompanyIncomeClaim', companyIncomeClaimSchema);
