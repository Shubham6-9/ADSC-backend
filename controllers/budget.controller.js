// controllers/budget.controller.js
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import TotalSavings from "../models/TotalSavings.js";
import { updateChallengeProgress } from "../services/dailyChallenge.service.js";

/**
 * Helper: recalc and update TotalSavings for a user by aggregating budgets.savings
 * (Note: savings values are taken as stored in Budget documents; backend does NOT calculate savings)
 */
async function refreshTotalSavingsForUser(userId) {
  const agg = await Budget.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$savings" } } },
  ]);
  const total = agg[0]?.total || 0;

  const doc = await TotalSavings.findOneAndUpdate(
    { user: userId },
    { totalSaved: total, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
  return doc;
}

/**
 * Create a new budget.
 * Frontend MUST NOT send 'user'. Backend sets user from req.user.
 * Savings are calculated automatically as (budgetAmount - spent).
 * Monthly budgets are stored inside yearly budgets.
 */
export const createBudget = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Get user details to fetch username
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const {
      title,
      budgetType,
      categoryName,
      budgetAmount,
      startDate,
      endDate,
      budgetDuration = "custom",
    } = req.body;

    // Basic validation
    if (!title || typeof title !== "string") {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!["overall", "category"].includes(budgetType)) {
      return res.status(400).json({ success: false, message: "budgetType must be 'overall' or 'category'" });
    }
    
    // Validate categoryName for category budgets
    if (budgetType === "category") {
      if (!categoryName || typeof categoryName !== "string") {
        return res.status(400).json({ success: false, message: "categoryName is required for category budgets" });
      }
    }

    // Validate startDate and endDate for ALL budgets
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate are required" });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: "startDate cannot be after endDate" });
    }

    if (typeof budgetAmount !== "number" || budgetAmount <= 0) {
      return res.status(400).json({ success: false, message: "budgetAmount must be a positive number" });
    }

    // === MONTHLY BUDGET VALIDATION ===
    // Check if monthly budget exceeds yearly budget (if yearly exists)
    if (budgetDuration === "monthly") {
      const yearlyBudgetQuery = {
        user: userId,
        budgetDuration: "yearly",
        budgetType: budgetType,
      };
      
      if (budgetType === "category") {
        yearlyBudgetQuery.categoryName = categoryName;
      }

      const yearlyBudget = await Budget.findOne(yearlyBudgetQuery);

      if (yearlyBudget) {
        // Validate monthly budget dates are within yearly budget date range
        const monthlyStart = new Date(startDate);
        const monthlyEnd = new Date(endDate);
        const yearlyStart = new Date(yearlyBudget.startDate);
        const yearlyEnd = new Date(yearlyBudget.endDate);

        if (monthlyStart < yearlyStart || monthlyEnd > yearlyEnd) {
          return res.status(400).json({
            success: false,
            message: `Monthly budget dates (${startDate} to ${endDate}) must fall within yearly budget dates (${yearlyBudget.startDate.toISOString().split('T')[0]} to ${yearlyBudget.endDate.toISOString().split('T')[0]})`,
          });
        }

        // Calculate total already allocated to monthly budgets
        const monthlyBudgetsQuery = {
          user: userId,
          budgetDuration: "monthly",
          budgetType: budgetType,
        };

        if (budgetType === "category") {
          monthlyBudgetsQuery.categoryName = categoryName;
        }

        const existingMonthlyBudgets = await Budget.find(monthlyBudgetsQuery);
        const totalAllocatedMonthly = existingMonthlyBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
        const remainingYearlyBudget = yearlyBudget.budgetAmount - totalAllocatedMonthly;

        // Validate new monthly budget doesn't exceed remaining yearly budget
        if (budgetAmount > remainingYearlyBudget) {
          return res.status(400).json({
            success: false,
            message: `Monthly budget (${budgetAmount}) exceeds remaining yearly budget (${remainingYearlyBudget}). Yearly: ${yearlyBudget.budgetAmount}, Already allocated: ${totalAllocatedMonthly}`,
          });
        }
      }
    }

    // === CREATE BUDGET ===
    const initialSavings = budgetAmount;

    const budgetDoc = await Budget.create({
      user: userId,
      username: user.username,
      title,
      budgetType,
      categoryName: budgetType === "category" ? categoryName : undefined,
      budgetAmount,
      savings: initialSavings,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budgetDuration,
      spent: 0,
    });

    // Refresh total savings aggregate
    const totalSavings = await refreshTotalSavingsForUser(userId);

    // Update daily challenge progress for creating a budget
    try {
      await updateChallengeProgress(userId, 'create-budget', 1);
    } catch (challengeErr) {
      console.error("Challenge update error:", challengeErr);
    }

    return res.status(201).json({ success: true, budget: budgetDoc, totalSavings: totalSavings.totalSaved });
  } catch (err) {
    console.error("createBudget error:", err);
    
    // Handle duplicate key errors from unique indexes
    if (err.code === 11000) {
      const field = err.keyPattern;
      if (field.budgetType === 1 && field.categoryName === 1) {
        return res.status(400).json({
          success: false,
          message: `A ${budgetDuration} budget for category "${categoryName}" already exists. You can only have one ${budgetDuration} budget per category.`,
        });
      } else if (field.budgetType === 1 && field.startDate === 1) {
        return res.status(400).json({
          success: false,
          message: `An overall ${budgetDuration} budget with these dates already exists. Please use different dates or update the existing budget.`,
        });
      }
      return res.status(400).json({
        success: false,
        message: "A budget with these details already exists.",
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data format provided.",
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create budget. Please try again later." 
    });
  }
};

/**
 * Get all budgets for the authenticated user.
 * Returns budgets array and totalSavings (aggregated).
 */
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const budgets = await Budget.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const totalSavingsDoc = await TotalSavings.findOne({ user: userId });
    return res.json({ success: true, budgets, totalSavings: totalSavingsDoc?.totalSaved || 0 });
  } catch (err) {
    console.error("getBudgets error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch budgets. Please try again later." 
    });
  }
};

/**
 * Get only active budgets for the authenticated user.
 * Active means current date is between startDate and endDate.
 * Returns only budgets that are currently ongoing.
 */
export const getActiveBudgets = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const now = new Date();
    
    // Find budgets where current date is between startDate and endDate
    const activeBudgets = await Budget.find({
      user: userId,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ createdAt: -1 }).lean();

    const totalSavingsDoc = await TotalSavings.findOne({ user: userId });
    
    return res.json({ 
      success: true, 
      count: activeBudgets.length,
      budgets: activeBudgets, 
      totalSavings: totalSavingsDoc?.totalSaved || 0 
    });
  } catch (err) {
    console.error("getActiveBudgets error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch active budgets. Please try again later." 
    });
  }
};

/**
 * Get a single budget by id (only if owner).
 */
export const getBudgetById = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid budget id" });
    }

    const budget = await Budget.findOne({ _id: id, user: userId }).lean();
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });

    return res.json({ success: true, budget });
  } catch (err) {
    console.error("getBudgetById error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch budget details. Please try again later." 
    });
  }
};

/**
 * Add spent amount to a budget (atomic increment).
 * Body: { amountSpent: Number } -> amount to add to `spent` (must be >0).
 *
 * NOTE:
 * - This endpoint increments `spent` and automatically calculates `savings` as (budgetAmount - spent).
 * - Savings will be set to 0 if spent exceeds budgetAmount (prevents negative savings).
 */
export const addSpentToBudget = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    const { amountSpent } = req.body;
    const delta = Number(amountSpent || 0);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid budget id" });
    }
    if (!(delta > 0)) {
      return res.status(400).json({ success: false, message: "amountSpent must be a number greater than 0" });
    }

    // First, increment spent
    const updated = await Budget.findOneAndUpdate(
      { _id: id, user: userId },
      { $inc: { spent: delta } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Budget not found" });

    // Automatically calculate and update savings: budgetAmount - spent (minimum 0)
    const newSavings = Math.max(0, updated.budgetAmount - updated.spent);
    updated.savings = newSavings;
    await updated.save();

    // Refresh total savings aggregate
    const totalSavings = await refreshTotalSavingsForUser(userId);

    return res.json({ success: true, budget: updated, totalSavings: totalSavings.totalSaved });
  } catch (err) {
    console.error("addSpentToBudget error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update spending. Please try again later." 
    });
  }
};

/**
 * Get budget summary showing yearly budget allocation and remaining amounts.
 * Returns yearly budgets with their monthly allocations.
 */
export const getBudgetSummary = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Get all yearly budgets
    const yearlyBudgets = await Budget.find({ 
      user: userId, 
      budgetDuration: "yearly" 
    }).lean();

    const summary = [];

    for (const yearlyBudget of yearlyBudgets) {
      // Find corresponding monthly budgets (separate documents)
      const monthlyBudgetsQuery = {
        user: userId,
        budgetDuration: "monthly",
        budgetType: yearlyBudget.budgetType,
      };

      if (yearlyBudget.budgetType === "category") {
        monthlyBudgetsQuery.categoryName = yearlyBudget.categoryName;
      }

      const monthlyBudgets = await Budget.find(monthlyBudgetsQuery).lean();
      const totalAllocatedMonthly = monthlyBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
      const remainingBudget = yearlyBudget.budgetAmount - totalAllocatedMonthly;

      summary.push({
        yearlyBudget: {
          _id: yearlyBudget._id,
          title: yearlyBudget.title,
          budgetType: yearlyBudget.budgetType,
          categoryName: yearlyBudget.categoryName,
          budgetAmount: yearlyBudget.budgetAmount,
          spent: yearlyBudget.spent,
          savings: yearlyBudget.savings,
          username: yearlyBudget.username,
        },
        monthlyBudgets: monthlyBudgets.map(mb => ({
          _id: mb._id,
          title: mb.title,
          budgetAmount: mb.budgetAmount,
          spent: mb.spent,
          savings: mb.savings,
          startDate: mb.startDate,
          endDate: mb.endDate,
        })),
        totalAllocatedMonthly,
        remainingBudget,
        allocationPercentage: yearlyBudget.budgetAmount > 0 
          ? ((totalAllocatedMonthly / yearlyBudget.budgetAmount) * 100).toFixed(2) 
          : "0.00",
      });
    }

    return res.json({ success: true, summary });
  } catch (err) {
    console.error("getBudgetSummary error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch budget summary. Please try again later." 
    });
  }
};
