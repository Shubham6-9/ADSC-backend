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
  isFrozen: {
    type: Boolean,
    default: false
  },
  frozenReason: {
    type: String,
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
  const now = new Date();
  // Use lastIncomeClaim if it exists, otherwise use createdAt for new companies
  const lastClaim = this.lastIncomeClaim ? new Date(this.lastIncomeClaim) : new Date(this.createdAt);
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  
  // Changed to 5 minutes per collection period (0.0833 hours)
  const PERIOD_HOURS = 5 / 60; // 5 minutes in hours
  if (hoursSinceLastClaim >= PERIOD_HOURS) {
    // Calculate new income since last claim (income every 5 minutes)
    const periodsPassed = Math.floor(hoursSinceLastClaim / PERIOD_HOURS);
    // Daily income divided by periods per day (24 hours / (5/60) hours = 288 periods)
    const periodsPerDay = 24 / PERIOD_HOURS;
    const incomePerPeriod = this.dailyIncome / periodsPerDay;
    const newIncome = incomePerPeriod * periodsPassed;
    return this.unclaimedIncome + newIncome;
  }
  
  return this.unclaimedIncome;
};

// Method to check if can claim income
companySchema.methods.canClaimIncome = function() {
  if (this.isFrozen) return false; // Cannot claim if business is frozen
  
  const now = new Date();
  // Use lastIncomeClaim if it exists, otherwise use createdAt for new companies
  const lastClaim = this.lastIncomeClaim ? new Date(this.lastIncomeClaim) : new Date(this.createdAt);
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  
  // Changed to 5 minutes
  const PERIOD_HOURS = 5 / 60; // 5 minutes in hours
  return hoursSinceLastClaim >= PERIOD_HOURS;
};

// Method to get time until next claim
companySchema.methods.getTimeUntilNextClaim = function() {
  const now = new Date();
  // Use lastIncomeClaim if it exists, otherwise use createdAt for new companies
  const lastClaim = this.lastIncomeClaim ? new Date(this.lastIncomeClaim) : new Date(this.createdAt);
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  
  // Changed to 5 minutes
  const PERIOD_HOURS = 5 / 60; // 5 minutes in hours
  if (hoursSinceLastClaim >= PERIOD_HOURS) return 0;
  
  return PERIOD_HOURS - hoursSinceLastClaim;
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

// Method to check if business should be frozen due to high pending tax
companySchema.methods.checkAndFreezeBusiness = function() {
  // Freeze if pending tax exceeds 50% of current company value
  const freezeThreshold = this.currentValue * 0.5;
  
  if (this.pendingTax >= freezeThreshold && !this.isFrozen) {
    this.isFrozen = true;
    this.frozenReason = 'Excessive pending tax. Pay taxes to unfreeze business.';
    return true;
  }
  
  // Unfreeze if tax is paid and below threshold
  if (this.pendingTax < freezeThreshold && this.isFrozen) {
    this.isFrozen = false;
    this.frozenReason = null;
    return false;
  }
  
  return this.isFrozen;
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
