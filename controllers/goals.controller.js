// controllers/goals.controller.js
import mongoose from "mongoose";
import Goal from "../models/Goal.js";
import User from "../models/User.js"; // used only if req.user.username missing

// Helper to validate date string
function isValidDate(v) {
  if (!v) return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

/**
 * POST /api/user/goals
 * Create a new goal.
 * Frontend should NOT send `username` or `user`. Backend reads user from req.user.
 *
 * Body (JSON):
 * {
 *   "title": "Buy a Bike",
 *   "description": "Mountain bike",
 *   "targetAmount": 50000,
 *   "targetDate": "2026-03-01",
 *   "priority": "high",
 *   "category": "Transport",
 *   // optional: "savedAmount": 0  (must be >= 0)
 * }
 */
export const createGoal = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const {
      title,
      description = "",
      targetAmount,
      targetDate,
      priority = "medium",
      category = "General",
      savedAmount = 0,
    } = req.body;

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "title is required and must be a non-empty string" });
    }
    const numericTarget = Number(targetAmount);
    if (Number.isNaN(numericTarget) || numericTarget <= 0) {
      return res.status(400).json({ success: false, message: "targetAmount is required and must be a number > 0" });
    }
    const numericSaved = Number(savedAmount || 0);
    if (Number.isNaN(numericSaved) || numericSaved < 0) {
      return res.status(400).json({ success: false, message: "savedAmount must be a non-negative number" });
    }
    if (targetDate && !isValidDate(targetDate)) {
      return res.status(400).json({ success: false, message: "targetDate must be a valid date if provided" });
    }
    if (!["low", "medium", "high"].includes(priority)) {
      return res.status(400).json({ success: false, message: "priority must be one of 'low','medium','high'" });
    }

    // derive username: prefer req.user.username, otherwise fetch from DB
    let username = req.user && (req.user.username || req.user.email);
    if (!username) {
      const userDoc = await User.findById(userId).select("username email").lean();
      username = userDoc?.username || userDoc?.email || "user";
    }

    const doc = await Goal.create({
      user: userId,
      username,
      title: title.trim(),
      description: String(description || "").trim(),
      targetAmount: numericTarget,
      savedAmount: numericSaved,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      priority,
      category: String(category || "General").trim(),
    });

    return res.status(201).json({ success: true, goal: doc });
  } catch (err) {
    console.error("createGoal error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/user/goals
 * Query params:
 *  - status = active|achieved|all   (default: active)
 *  - page, limit
 *  - sortBy  (e.g. "-createdAt" or "progress")
 *  - category, priority, q (search in title)
 */
export const getGoals = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status = "active", sortBy = "-createdAt", category, priority, q } = req.query;

    const filter = { user: new mongoose.Types.ObjectId(userId) };

    if (status === "active") filter.isAchieved = false;
    else if (status === "achieved") filter.isAchieved = true;
    // else status === "all" -> no filter

    if (category) filter.category = String(category).trim();
    if (priority && ["low", "medium", "high"].includes(priority)) filter.priority = priority;
    if (q) filter.title = { $regex: String(q), $options: "i" };

    // build sort object
    let sort = {};
    if (sortBy) {
      const fields = String(sortBy).split(",").map(s => s.trim()).filter(Boolean);
      for (const f of fields) {
        if (f.startsWith("-")) sort[f.slice(1)] = -1;
        else sort[f] = 1;
      }
    } else {
      sort = { createdAt: -1 };
    }

    const [total, goals] = await Promise.all([
      Goal.countDocuments(filter),
      Goal.find(filter).sort(sort).skip(skip).limit(limit).lean()
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      meta: { total, page, limit, totalPages },
      goals
    });
  } catch (err) {
    console.error("getGoals error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/user/goals/:id
 * Get single goal (owner only)
 */
export const getGoalById = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid goal id" });
    }

    const goal = await Goal.findOne({ _id: id, user: userId }).lean();
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

    return res.json({ success: true, goal });
  } catch (err) {
    console.error("getGoalById error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * PATCH /api/user/goals/:id
 * Update goal (specifically for adding savings)
 * Body: { savedAmount: number }
 */
export const updateGoal = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid goal id" });
    }

    const { savedAmount } = req.body;
    
    // Validation
    const numericSaved = Number(savedAmount);
    if (Number.isNaN(numericSaved) || numericSaved < 0) {
      return res.status(400).json({ success: false, message: "savedAmount must be a non-negative number" });
    }

    // Find goal
    const goal = await Goal.findOne({ _id: id, user: userId });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

    // Update savedAmount
    goal.savedAmount = numericSaved;
    
    // Check if goal is achieved
    if (goal.savedAmount >= goal.targetAmount && !goal.isAchieved) {
      goal.isAchieved = true;
    }

    await goal.save();

    return res.json({ 
      success: true, 
      message: "Goal updated successfully",
      goal 
    });
  } catch (err) {
    console.error("updateGoal error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/user/goals/summary/total-savings
 * Get total savings across all goals and budgets
 */
export const getTotalSavings = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Calculate total from goals
    const goalsSavings = await Goal.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$savedAmount" } } }
    ]);

    const totalGoalsSavings = goalsSavings.length > 0 ? goalsSavings[0].total : 0;

    // Get budget savings (import Budget model if needed)
    let totalBudgetSavings = 0;
    try {
      const Budget = mongoose.model('Budget');
      const budgetSavings = await Budget.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: "$savings" } } }
      ]);
      totalBudgetSavings = budgetSavings.length > 0 ? budgetSavings[0].total : 0;
    } catch (err) {
      console.log("Budget model not available or error:", err.message);
    }

    const totalSavings = totalGoalsSavings + totalBudgetSavings;

    // Get breakdown by category
    const goalsByCategory = await Goal.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { 
        $group: { 
          _id: "$category", 
          totalSaved: { $sum: "$savedAmount" },
          totalTarget: { $sum: "$targetAmount" },
          count: { $sum: 1 }
        } 
      },
      { $sort: { totalSaved: -1 } }
    ]);

    return res.json({
      success: true,
      totalSavings,
      breakdown: {
        fromGoals: totalGoalsSavings,
        fromBudgets: totalBudgetSavings
      },
      goalsByCategory
    });
  } catch (err) {
    console.error("getTotalSavings error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
