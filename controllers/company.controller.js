import Company from '../models/Company.js';
import CompanySlot from '../models/CompanySlot.js';
import CompanyInvestment from '../models/CompanyInvestment.js';
import CompanyIncomeClaim from '../models/CompanyIncomeClaim.js';
import User from '../models/User.js';
import CurrencyTransaction from '../models/CurrencyTransaction.js';

// Investment leverage multiplier (10x buying power)
const INVESTMENT_LEVERAGE = 10;
const PROFIT_SHARE = 0.1; // User gets 10% of profit in actual coins (1/leverage)

// Company type configurations
const COMPANY_TYPES = {
  'IT': {
    name: 'IT Company',
    description: 'Software development and IT services',
    minInvestment: 10000,
    baseGrowthRate: 0.08, // 8% daily
    incomeMultiplier: 1.2,
    taxRate: 0.10 // 10% tax
  },
  'Stock Market': {
    name: 'Stock Market Trading',
    description: 'Stock trading and investment',
    minInvestment: 15000,
    baseGrowthRate: 0.10, // 10% daily (high risk, high reward)
    incomeMultiplier: 1.5,
    taxRate: 0.15 // 15% tax (higher due to capital gains)
  },
  'Investment': {
    name: 'Investment Firm',
    description: 'Mutual funds and investment management',
    minInvestment: 20000,
    baseGrowthRate: 0.06, // 6% daily (stable)
    incomeMultiplier: 1.1,
    taxRate: 0.12 // 12% tax
  },
  'Real Estate': {
    name: 'Real Estate Business',
    description: 'Property development and rental',
    minInvestment: 25000,
    baseGrowthRate: 0.05, // 5% daily (long-term)
    incomeMultiplier: 1.0,
    taxRate: 0.12 // 12% tax
  },
  'E-Commerce': {
    name: 'E-Commerce Platform',
    description: 'Online retail and marketplace',
    minInvestment: 12000,
    baseGrowthRate: 0.07, // 7% daily
    incomeMultiplier: 1.3,
    taxRate: 0.10 // 10% tax
  },
  'Manufacturing': {
    name: 'Manufacturing Unit',
    description: 'Production and manufacturing',
    minInvestment: 30000,
    baseGrowthRate: 0.04, // 4% daily
    incomeMultiplier: 0.9,
    taxRate: 0.10 // 10% tax
  },
  'Consulting': {
    name: 'Consulting Firm',
    description: 'Business and management consulting',
    minInvestment: 8000,
    baseGrowthRate: 0.09, // 9% daily
    incomeMultiplier: 1.4,
    taxRate: 0.10 // 10% tax
  },
  'Trading': {
    name: 'Trading Company',
    description: 'Import/export and commodity trading',
    minInvestment: 18000,
    baseGrowthRate: 0.06, // 6% daily
    incomeMultiplier: 1.1,
    taxRate: 0.12 // 12% tax
  }
};

// Get all companies for user
export const getUserCompanies = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const companies = await Company.find({ user: userId, isActive: true })
      .sort({ slotNumber: 1 });

    const companySlot = await CompanySlot.findOne({ user: userId });

    // Calculate claimable income and next claim time for each company
    const companiesWithStatus = await Promise.all(companies.map(async (company) => {
      // Update existing companies with new lower tax rates
      const companyConfig = COMPANY_TYPES[company.type];
      if (companyConfig && company.taxRate > companyConfig.taxRate) {
        company.taxRate = companyConfig.taxRate;
        await company.save();
      }
      
      // Check and update freeze status
      const freezeChanged = company.checkAndFreezeBusiness();
      if (freezeChanged !== company.isFrozen) {
        await company.save(); // Save if freeze status changed
      }
      
      return {
        ...company.toObject(),
        claimableIncome: company.getClaimableIncome(),
        canClaim: company.canClaimIncome(),
        hoursUntilClaim: company.getTimeUntilNextClaim(),
        currentProfit: company.currentValue - company.totalInvestment
      };
    }));

    res.json({
      success: true,
      companies: companiesWithStatus,
      slots: {
        total: companySlot?.totalSlots || 1,
        used: companySlot?.usedSlots || companies.length,
        available: (companySlot?.totalSlots || 1) - companies.length,
        nextSlotCost: companySlot?.nextSlotCost || 5000
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get available company types
export const getCompanyTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      companyTypes: COMPANY_TYPES
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create new company
export const createCompany = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; // JWT uses 'id', not '_id'
    const { name, type, initialInvestment } = req.body;
    
    console.log('🏢 Create company request:', { userId, name, type, initialInvestment });
    console.log('req.user:', req.user);

    // Validate company type
    if (!COMPANY_TYPES[type]) {
      return res.status(400).json({ success: false, message: 'Invalid company type' });
    }

    const config = COMPANY_TYPES[type];

    // Check minimum investment
    if (initialInvestment < config.minInvestment) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment for ${type} is ₹${config.minInvestment.toLocaleString()}`
      });
    }

    // Calculate actual coins needed (1/10th due to 10x leverage)
    const coinsNeeded = Math.floor(initialInvestment / INVESTMENT_LEVERAGE);
    
    // Check user has enough coins for leveraged investment
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found. Please log in again.'
      });
    }
    
    // Initialize virtualCurrency if undefined
    if (typeof user.virtualCurrency !== 'number' || isNaN(user.virtualCurrency)) {
      user.virtualCurrency = 0;
      await user.save();
    }
    
    console.log('User found:', user.email, 'Balance:', user.virtualCurrency);
    
    if (user.virtualCurrency < coinsNeeded) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. Need ${coinsNeeded} coins for ₹${initialInvestment.toLocaleString()} investment (10x leverage). You have ${user.virtualCurrency} coins.`
      });
    }

    // Get or create company slot record
    let companySlot = await CompanySlot.findOne({ user: userId });
    if (!companySlot) {
      companySlot = await CompanySlot.create({ user: userId, totalSlots: 1 });
    }

    // Check available slots
    const activeCompanies = await Company.countDocuments({ user: userId, isActive: true });
    if (activeCompanies >= companySlot.totalSlots) {
      return res.status(400).json({
        success: false,
        message: 'No available slots. Unlock more slots to create additional companies.'
      });
    }

    // Deduct actual coins (1/10th of investment due to leverage)
    const balanceBefore = Number(user.virtualCurrency);
    user.virtualCurrency = Number(user.virtualCurrency) - Number(coinsNeeded);
    const balanceAfter = Number(user.virtualCurrency);
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -Number(coinsNeeded),
      type: 'company_investment',
      description: `Company creation: ${name} (₹${initialInvestment.toLocaleString()} @ 10x leverage)`,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter
    });

    // Create company
    const company = await Company.create({
      user: userId,
      name,
      type,
      slotNumber: activeCompanies + 1,
      totalInvestment: initialInvestment,
      currentValue: initialInvestment,
      growthRate: config.baseGrowthRate,
      incomeMultiplier: config.incomeMultiplier,
      taxRate: config.taxRate
    });

    // Calculate initial daily income
    company.updateDailyIncome();
    await company.save();

    // Record investment
    await CompanyInvestment.create({
      user: userId,
      company: company._id,
      amount: initialInvestment,
      investmentType: 'initial',
      description: `Initial company investment (${coinsNeeded} coins @ 10x leverage)`,
      coinsSpent: coinsNeeded,
      companyValueBefore: 0,
      companyValueAfter: initialInvestment
    });

    // Update used slots
    companySlot.usedSlots = activeCompanies + 1;
    await companySlot.save();

    res.json({
      success: true,
      message: `${name} created successfully! Income will be available to claim in 30 minutes.`,
      company: {
        ...company.toObject(),
        claimableIncome: company.getClaimableIncome(),
        canClaim: company.canClaimIncome(),
        hoursUntilClaim: company.getTimeUntilNextClaim(),
        currentProfit: 0
      },
      userBalance: user.virtualCurrency
    });
  } catch (error) {
    console.error('Create company error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Make investment in company
export const makeInvestment = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { companyId, amount, investmentType = 'expansion' } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid investment amount' });
    }

    // Calculate actual coins needed (1/10th due to 10x leverage)
    const coinsNeeded = Math.floor(amount / INVESTMENT_LEVERAGE);

    const user = await User.findById(userId);
    if (user.virtualCurrency < coinsNeeded) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient coins. Need ${coinsNeeded} coins for ₹${amount.toLocaleString()} investment (10x leverage)` 
      });
    }

    const company = await Company.findOne({ _id: companyId, user: userId, isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const valueBefore = company.currentValue;

    // Deduct actual coins (1/10th of investment due to leverage)
    const invBalanceBefore = Number(user.virtualCurrency);
    user.virtualCurrency = Number(user.virtualCurrency) - Number(coinsNeeded);
    const invBalanceAfter = Number(user.virtualCurrency);
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -Number(coinsNeeded),
      type: 'company_investment',
      description: `Investment in ${company.name} (₹${amount.toLocaleString()} @ 10x leverage)`,
      balanceBefore: invBalanceBefore,
      balanceAfter: invBalanceAfter
    });

    // Add investment to company
    company.addInvestment(amount);
    await company.save();

    // Record investment
    await CompanyInvestment.create({
      user: userId,
      company: company._id,
      amount,
      investmentType,
      description: `${investmentType} investment (${coinsNeeded} coins @ 10x leverage)`,
      coinsSpent: coinsNeeded,
      companyValueBefore: valueBefore,
      companyValueAfter: company.currentValue
    });

    res.json({
      success: true,
      message: `Invested ₹${amount.toLocaleString()} in ${company.name}`,
      company: {
        ...company.toObject(),
        claimableIncome: company.getClaimableIncome(),
        canClaim: company.canClaimIncome(),
        currentProfit: company.currentValue - company.totalInvestment
      },
      userBalance: user.virtualCurrency
    });
  } catch (error) {
    console.error('Make investment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Claim daily income
export const claimIncome = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { companyId } = req.body;

    const company = await Company.findOne({ _id: companyId, user: userId, isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Check if business is frozen
    if (company.isFrozen) {
      return res.status(400).json({
        success: false,
        message: company.frozenReason || 'Business is frozen. Pay pending taxes to unfreeze.'
      });
    }

    if (!company.canClaimIncome()) {
      const hoursLeft = company.getTimeUntilNextClaim();
      return res.status(400).json({
        success: false,
        message: `You can claim income in ${Math.ceil(hoursLeft)} hours`
      });
    }

    const claimableIncome = company.getClaimableIncome();
    if (claimableIncome <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No income to claim'
      });
    }

    // Calculate tax
    const taxAmount = company.calculateTax(claimableIncome);
    const netIncome = claimableIncome - taxAmount;

    // Calculate coins earned (10% of net income due to 10x leverage)
    // This represents the actual profit share on the leveraged investment
    const coinsEarned = Math.floor(netIncome * PROFIT_SHARE);
    const profitPercentage = ((company.currentValue - company.totalInvestment) / company.totalInvestment) * 100;

    // Award coins to user first
    const user = await User.findById(userId);
    const incomeBalanceBefore = Number(user.virtualCurrency || 0);
    user.virtualCurrency = Number(user.virtualCurrency || 0) + Number(coinsEarned);
    const incomeBalanceAfter = Number(user.virtualCurrency);
    await user.save();

    // Update company
    company.lastIncomeClaim = new Date();
    company.unclaimedIncome = 0;
    company.totalProfit += netIncome;
    company.pendingTax += taxAmount;
    
    // Check if business should be frozen due to high pending tax
    const wasFrozen = company.checkAndFreezeBusiness();
    await company.save();
    
    // Warn user if business was just frozen
    if (wasFrozen) {
      await CurrencyTransaction.create({
        user: userId,
        amount: 0,
        type: 'company_frozen',
        description: `${company.name} frozen due to excessive pending tax`,
        balanceBefore: incomeBalanceBefore,
        balanceAfter: incomeBalanceAfter
      });
    }

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: Number(coinsEarned),
      type: 'company_income',
      description: `Income claimed from ${company.name}`,
      balanceBefore: incomeBalanceBefore,
      balanceAfter: incomeBalanceAfter
    });

    // Record income claim
    await CompanyIncomeClaim.create({
      user: userId,
      company: company._id,
      incomeAmount: claimableIncome,
      taxAmount,
      netIncome,
      coinsEarned,
      profitPercentage,
      companyValueAtClaim: company.currentValue,
      companyLevel: company.level
    });

    res.json({
      success: true,
      message: wasFrozen 
        ? `Claimed ₹${claimableIncome.toLocaleString()} income! ⚠️ Business frozen due to high pending tax!` 
        : `Claimed ₹${claimableIncome.toLocaleString()} income!`,
      claim: {
        grossIncome: claimableIncome,
        taxAmount,
        netIncome,
        coinsEarned,
        profitPercentage: profitPercentage.toFixed(2)
      },
      company: {
        ...company.toObject(),
        claimableIncome: 0,
        canClaim: false,
        currentProfit: company.currentValue - company.totalInvestment
      },
      userBalance: user.virtualCurrency,
      frozenWarning: wasFrozen
    });
  } catch (error) {
    console.error('Claim income error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Pay company tax
export const payTax = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { companyId } = req.body;

    const company = await Company.findOne({ _id: companyId, user: userId, isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (company.pendingTax <= 0) {
      return res.status(400).json({ success: false, message: 'No pending tax' });
    }

    const taxAmountRupees = company.pendingTax;
    // Convert rupees to coins (divide by leverage multiplier)
    // Since 1 coin = ₹10 investment power, ₹10 tax = 1 coin cost
    const taxAmountCoins = Math.ceil(taxAmountRupees / INVESTMENT_LEVERAGE);

    const user = await User.findById(userId);
    if (user.virtualCurrency < taxAmountCoins) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins to pay tax. Need ${taxAmountCoins} coins (₹${taxAmountRupees} tax)`
      });
    }

    // Deduct coins
    const taxBalanceBefore = Number(user.virtualCurrency || 0);
    user.virtualCurrency = Number(user.virtualCurrency || 0) - Number(taxAmountCoins);
    const taxBalanceAfter = Number(user.virtualCurrency);
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -Number(taxAmountCoins),
      type: 'company_tax',
      description: `Tax payment for ${company.name} (₹${taxAmountRupees} = ${taxAmountCoins} coins)`,
      balanceBefore: taxBalanceBefore,
      balanceAfter: taxBalanceAfter
    });

    // Update company
    company.totalTaxPaid += taxAmountRupees;
    company.pendingTax = 0;
    company.lastTaxPayment = new Date();
    
    // Check if business can be unfrozen after tax payment
    company.checkAndFreezeBusiness();
    await company.save();

    res.json({
      success: true,
      message: `Paid ₹${taxAmountRupees.toLocaleString()} in taxes (${taxAmountCoins} coins)`,
      taxPaidRupees: taxAmountRupees,
      taxPaidCoins: taxAmountCoins,
      company: {
        ...company.toObject(),
        currentProfit: company.currentValue - company.totalInvestment
      },
      userBalance: user.virtualCurrency
    });
  } catch (error) {
    console.error('Pay tax error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Unlock new company slot
export const unlockSlot = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    let companySlot = await CompanySlot.findOne({ user: userId });
    if (!companySlot) {
      companySlot = await CompanySlot.create({ user: userId });
    }

    if (companySlot.totalSlots >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum slots already unlocked'
      });
    }

    const user = await User.findById(userId);
    if (!companySlot.canUnlockSlot(user.virtualCurrency)) {
      return res.status(400).json({
        success: false,
        message: `Need ${companySlot.nextSlotCost} coins to unlock next slot`
      });
    }

    const { cost, newTotal } = companySlot.unlockSlot();
    
    // Deduct coins
    const slotBalanceBefore = Number(user.virtualCurrency || 0);
    user.virtualCurrency = Number(user.virtualCurrency || 0) - Number(cost);
    const slotBalanceAfter = Number(user.virtualCurrency);
    await user.save();

    await companySlot.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -Number(cost),
      type: 'company_slot_unlock',
      description: 'Company slot unlocked',
      balanceBefore: slotBalanceBefore,
      balanceAfter: slotBalanceAfter
    });

    res.json({
      success: true,
      message: `Unlocked slot ${newTotal}!`,
      slots: {
        total: companySlot.totalSlots,
        used: companySlot.usedSlots,
        available: companySlot.totalSlots - companySlot.usedSlots,
        nextSlotCost: companySlot.nextSlotCost
      },
      userBalance: user.virtualCurrency
    });
  } catch (error) {
    console.error('Unlock slot error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get company statistics
export const getCompanyStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { companyId } = req.params;

    const company = await Company.findOne({ _id: companyId, user: userId, isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Get investment history
    const investments = await CompanyInvestment.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get income claim history
    const incomeClaims = await CompanyIncomeClaim.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate stats
    const totalIncomeClaimed = incomeClaims.reduce((sum, claim) => sum + claim.netIncome, 0);
    const totalCoinsEarned = incomeClaims.reduce((sum, claim) => sum + claim.coinsEarned, 0);

    res.json({
      success: true,
      company: {
        ...company.toObject(),
        claimableIncome: company.getClaimableIncome(),
        canClaim: company.canClaimIncome(),
        hoursUntilClaim: company.getTimeUntilNextClaim(),
        currentProfit: company.currentValue - company.totalInvestment
      },
      stats: {
        totalIncomeClaimed,
        totalCoinsEarned,
        totalInvestments: investments.length,
        totalClaims: incomeClaims.length,
        roi: ((company.currentValue - company.totalInvestment) / company.totalInvestment * 100).toFixed(2)
      },
      recentInvestments: investments,
      recentClaims: incomeClaims,
      userBalance: req.user.virtualCurrency
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upgrade company
export const upgradeCompany = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { companyId, upgradeType } = req.body;

    if (!['income', 'growth', 'tax'].includes(upgradeType)) {
      return res.status(400).json({ success: false, message: 'Invalid upgrade type' });
    }

    const company = await Company.findOne({ _id: companyId, user: userId, isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Calculate upgrade cost (increases with company level)
    const upgradeCost = Math.floor(5000 * Math.pow(1.5, company.level));

    const user = await User.findById(userId);
    if (user.virtualCurrency < upgradeCost) {
      return res.status(400).json({
        success: false,
        message: `Need ${upgradeCost} coins for upgrade`
      });
    }

    // Deduct coins
    const upgradeBalanceBefore = Number(user.virtualCurrency || 0);
    user.virtualCurrency = Number(user.virtualCurrency || 0) - Number(upgradeCost);
    const upgradeBalanceAfter = Number(user.virtualCurrency);
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -Number(upgradeCost),
      type: 'company_upgrade',
      description: `${company.name} - ${upgradeType} upgrade`,
      balanceBefore: upgradeBalanceBefore,
      balanceAfter: upgradeBalanceAfter
    });

    // Apply upgrade
    company.upgrade(upgradeType);
    company.level += 1;
    company.experience += 100;
    await company.save();

    const upgradeMessages = {
      income: 'Income multiplier increased by 10%!',
      growth: 'Growth rate increased by 1%!',
      tax: 'Tax rate reduced by 5%!'
    };

    res.json({
      success: true,
      message: upgradeMessages[upgradeType],
      company: {
        ...company.toObject(),
        claimableIncome: company.getClaimableIncome(),
        canClaim: company.canClaimIncome(),
        currentProfit: company.currentValue - company.totalInvestment
      },
      userBalance: user.virtualCurrency
    });
  } catch (error) {
    console.error('Upgrade company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
