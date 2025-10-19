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
    taxRate: 0.25
  },
  'Stock Market': {
    name: 'Stock Market Trading',
    description: 'Stock trading and investment',
    minInvestment: 15000,
    baseGrowthRate: 0.10, // 10% daily (high risk, high reward)
    incomeMultiplier: 1.5,
    taxRate: 0.30
  },
  'Investment': {
    name: 'Investment Firm',
    description: 'Mutual funds and investment management',
    minInvestment: 20000,
    baseGrowthRate: 0.06, // 6% daily (stable)
    incomeMultiplier: 1.1,
    taxRate: 0.28
  },
  'Real Estate': {
    name: 'Real Estate Business',
    description: 'Property development and rental',
    minInvestment: 25000,
    baseGrowthRate: 0.05, // 5% daily (long-term)
    incomeMultiplier: 1.0,
    taxRate: 0.30
  },
  'E-Commerce': {
    name: 'E-Commerce Platform',
    description: 'Online retail and marketplace',
    minInvestment: 12000,
    baseGrowthRate: 0.07, // 7% daily
    incomeMultiplier: 1.3,
    taxRate: 0.26
  },
  'Manufacturing': {
    name: 'Manufacturing Unit',
    description: 'Production and manufacturing',
    minInvestment: 30000,
    baseGrowthRate: 0.04, // 4% daily
    incomeMultiplier: 0.9,
    taxRate: 0.25
  },
  'Consulting': {
    name: 'Consulting Firm',
    description: 'Business and management consulting',
    minInvestment: 8000,
    baseGrowthRate: 0.09, // 9% daily
    incomeMultiplier: 1.4,
    taxRate: 0.27
  },
  'Trading': {
    name: 'Trading Company',
    description: 'Import/export and commodity trading',
    minInvestment: 18000,
    baseGrowthRate: 0.06, // 6% daily
    incomeMultiplier: 1.1,
    taxRate: 0.29
  }
};

// Get all companies for user
export const getUserCompanies = async (req, res) => {
  try {
    const userId = req.user._id;

    const companies = await Company.find({ user: userId, isActive: true })
      .sort({ slotNumber: 1 });

    const companySlot = await CompanySlot.findOne({ user: userId });

    // Calculate claimable income and next claim time for each company
    const companiesWithStatus = companies.map(company => ({
      ...company.toObject(),
      claimableIncome: company.getClaimableIncome(),
      canClaim: company.canClaimIncome(),
      hoursUntilClaim: company.getTimeUntilNextClaim(),
      currentProfit: company.currentValue - company.totalInvestment
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
    const userId = req.user._id;
    const { name, type, initialInvestment } = req.body;

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
    if (user.currency < coinsNeeded) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. Need ${coinsNeeded} coins for ₹${initialInvestment.toLocaleString()} investment (10x leverage)`
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
    user.currency -= coinsNeeded;
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -coinsNeeded,
      type: 'debit',
      description: `Company creation: ${name} (₹${initialInvestment.toLocaleString()} @ 10x leverage)`,
      balanceBefore: user.currency + coinsNeeded,
      balanceAfter: user.currency
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
      message: `${name} created successfully!`,
      company: {
        ...company.toObject(),
        claimableIncome: 0,
        canClaim: false,
        currentProfit: 0
      },
      userBalance: user.currency
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Make investment in company
export const makeInvestment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { companyId, amount, investmentType = 'expansion' } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid investment amount' });
    }

    // Calculate actual coins needed (1/10th due to 10x leverage)
    const coinsNeeded = Math.floor(amount / INVESTMENT_LEVERAGE);

    const user = await User.findById(userId);
    if (user.currency < coinsNeeded) {
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
    user.currency -= coinsNeeded;
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -coinsNeeded,
      type: 'debit',
      description: `Investment in ${company.name} (₹${amount.toLocaleString()} @ 10x leverage)`,
      balanceBefore: user.currency + coinsNeeded,
      balanceAfter: user.currency
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
      userBalance: user.currency
    });
  } catch (error) {
    console.error('Make investment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Claim daily income
export const claimIncome = async (req, res) => {
  try {
    const userId = req.user._id;
    const { companyId } = req.body;

    const company = await Company.findOne({ _id: companyId, user: userId, isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
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

    // Update company
    company.lastIncomeClaim = new Date();
    company.unclaimedIncome = 0;
    company.totalProfit += netIncome;
    company.pendingTax += taxAmount;
    await company.save();

    // Award coins to user
    const user = await User.findById(userId);
    user.currency += coinsEarned;
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: coinsEarned,
      type: 'credit',
      description: `Income claimed from ${company.name}`,
      balanceBefore: user.currency - coinsEarned,
      balanceAfter: user.currency
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
      message: `Claimed ₹${claimableIncome.toLocaleString()} income!`,
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
      userBalance: user.currency
    });
  } catch (error) {
    console.error('Claim income error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Pay company tax
export const payTax = async (req, res) => {
  try {
    const userId = req.user._id;
    const { companyId } = req.body;

    const company = await Company.findOne({ _id: companyId, user: userId, isActive: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (company.pendingTax <= 0) {
      return res.status(400).json({ success: false, message: 'No pending tax' });
    }

    const user = await User.findById(userId);
    if (user.currency < company.pendingTax) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins to pay tax'
      });
    }

    const taxAmount = company.pendingTax;

    // Deduct coins
    user.currency -= taxAmount;
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -taxAmount,
      type: 'debit',
      description: `Tax payment for ${company.name}`,
      balanceBefore: user.currency + taxAmount,
      balanceAfter: user.currency
    });

    // Update company
    company.totalTaxPaid += taxAmount;
    company.pendingTax = 0;
    company.lastTaxPayment = new Date();
    await company.save();

    res.json({
      success: true,
      message: `Paid ₹${taxAmount.toLocaleString()} in taxes`,
      taxPaid: taxAmount,
      company: {
        ...company.toObject(),
        currentProfit: company.currentValue - company.totalInvestment
      },
      userBalance: user.currency
    });
  } catch (error) {
    console.error('Pay tax error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Unlock new company slot
export const unlockSlot = async (req, res) => {
  try {
    const userId = req.user._id;

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
    if (!companySlot.canUnlockSlot(user.currency)) {
      return res.status(400).json({
        success: false,
        message: `Need ${companySlot.nextSlotCost} coins to unlock next slot`
      });
    }

    const { cost, newTotal } = companySlot.unlockSlot();
    
    // Deduct coins
    user.currency -= cost;
    await user.save();

    await companySlot.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -cost,
      type: 'debit',
      description: `Unlocked company slot ${newTotal}`,
      balanceBefore: user.currency + cost,
      balanceAfter: user.currency
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
      userBalance: user.currency
    });
  } catch (error) {
    console.error('Unlock slot error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get company statistics
export const getCompanyStats = async (req, res) => {
  try {
    const userId = req.user._id;
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
      recentClaims: incomeClaims
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upgrade company
export const upgradeCompany = async (req, res) => {
  try {
    const userId = req.user._id;
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
    if (user.currency < upgradeCost) {
      return res.status(400).json({
        success: false,
        message: `Need ${upgradeCost} coins for upgrade`
      });
    }

    // Deduct coins
    user.currency -= upgradeCost;
    await user.save();

    // Record transaction
    await CurrencyTransaction.create({
      user: userId,
      amount: -upgradeCost,
      type: 'debit',
      description: `${upgradeType} upgrade for ${company.name}`,
      balanceBefore: user.currency + upgradeCost,
      balanceAfter: user.currency
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
      userBalance: user.currency
    });
  } catch (error) {
    console.error('Upgrade company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
