import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'IT', 
      'Stock Market', 
      'Investment', 
      'Real Estate', 
      'E-Commerce',
      'Manufacturing',
      'Consulting',
      'Trading'
    ]
  },
  slotNumber: {
    type: Number,
    required: true,
    default: 1
  },
  // Financial metrics
  totalInvestment: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  dailyIncome: {
    type: Number,
    default: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  totalTaxPaid: {
    type: Number,
    default: 0
  },
  // Tax tracking
  pendingTax: {
    type: Number,
    default: 0
  },
  lastTaxPayment: {
    type: Date,
    default: null
  },
  // Income claim tracking
  lastIncomeClaim: {
    type: Date,
    default: null
  },
  unclaimedIncome: {
    type: Number,
    default: 0
  },
  // Company stats
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Performance multipliers
  incomeMultiplier: {
    type: Number,
    default: 1.0
  },
  growthRate: {
    type: Number,
    default: 0.05 // 5% daily growth
  },
  taxRate: {
    type: Number,
    default: 0.30 // 30% corporate tax
  }
}, {
  timestamps: true
});

// Index for efficient queries
companySchema.index({ user: 1, slotNumber: 1 });
companySchema.index({ user: 1, isActive: 1 });

// Virtual for profit calculation
companySchema.virtual('currentProfit').get(function() {
  return this.currentValue - this.totalInvestment;
});

// Method to calculate claimable income
companySchema.methods.getClaimableIncome = function() {
  if (!this.lastIncomeClaim) {
    return this.unclaimedIncome;
  }
  
  const now = new Date();
  const lastClaim = new Date(this.lastIncomeClaim);
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  
  if (hoursSinceLastClaim >= 24) {
    // Calculate new income since last claim
    const daysPassed = Math.floor(hoursSinceLastClaim / 24);
    const newIncome = this.dailyIncome * daysPassed;
    return this.unclaimedIncome + newIncome;
  }
  
  return this.unclaimedIncome;
};

// Method to check if can claim income
companySchema.methods.canClaimIncome = function() {
  if (!this.lastIncomeClaim) return true;
  
  const now = new Date();
  const lastClaim = new Date(this.lastIncomeClaim);
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  
  return hoursSinceLastClaim >= 24;
};

// Method to get time until next claim
companySchema.methods.getTimeUntilNextClaim = function() {
  if (!this.lastIncomeClaim) return 0;
  
  const now = new Date();
  const lastClaim = new Date(this.lastIncomeClaim);
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  
  if (hoursSinceLastClaim >= 24) return 0;
  
  return 24 - hoursSinceLastClaim;
};

// Method to calculate tax on profit
companySchema.methods.calculateTax = function(profit) {
  return Math.floor(profit * this.taxRate);
};

// Method to update daily income based on investments
companySchema.methods.updateDailyIncome = function() {
  // Base income = investment * growth rate * income multiplier
  this.dailyIncome = Math.floor(
    this.currentValue * this.growthRate * this.incomeMultiplier
  );
  return this.dailyIncome;
};

// Method to add investment
companySchema.methods.addInvestment = function(amount) {
  this.totalInvestment += amount;
  this.currentValue += amount;
  this.updateDailyIncome();
  return this;
};

// Method to upgrade company
companySchema.methods.upgrade = function(upgradeType) {
  switch(upgradeType) {
    case 'income':
      this.incomeMultiplier += 0.1; // +10% income
      break;
    case 'growth':
      this.growthRate += 0.01; // +1% growth rate
      break;
    case 'tax':
      this.taxRate = Math.max(0.15, this.taxRate - 0.05); // Reduce tax by 5%, min 15%
      break;
  }
  this.updateDailyIncome();
  return this;
};

export default mongoose.model('Company', companySchema);
