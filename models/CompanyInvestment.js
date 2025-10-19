import mongoose from 'mongoose';

const companyInvestmentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true
  },
  investmentType: {
    type: String,
    enum: ['initial', 'expansion', 'upgrade', 'marketing', 'technology', 'workforce'],
    default: 'expansion'
  },
  description: {
    type: String,
    default: ''
  },
  expectedReturn: {
    type: Number,
    default: 0
  },
  coinsSpent: {
    type: Number,
    default: 0
  },
  companyValueBefore: {
    type: Number,
    default: 0
  },
  companyValueAfter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
companyInvestmentSchema.index({ user: 1, company: 1 });
companyInvestmentSchema.index({ company: 1, createdAt: -1 });

export default mongoose.model('CompanyInvestment', companyInvestmentSchema);
