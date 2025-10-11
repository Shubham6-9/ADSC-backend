// controllers/expense.controller.js
import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import { updateStreakOnExpense, getStreakXPReward } from "../services/streak.service.js";

/**
 * Helper - validate ISO date string
 */
function isValidDate(value) {
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * POST /api/user/expense
 * Body: { date, category, amount, notes? }
 */
export const createExpense = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { date, category, amount, notes } = req.body;

    // Validation
    if (!date) return res.status(400).json({ success: false, message: "date is required (ISO string)" });
    if (!isValidDate(date)) return res.status(400).json({ success: false, message: "date must be a valid date" });

    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ success: false, message: "category is required and must be a non-empty string" });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ success: false, message: "amount is required and must be a non-negative number" });
    }

    // Create expense doc
    const expense = await Expense.create({
      user: userId,
      date: new Date(date),
      category: category.trim(),
      amount: numericAmount,
      notes: (notes && String(notes).trim()) || "",
    });

    // Update streak after expense is added
    const streakResult = await updateStreakOnExpense(userId);
    
    // Calculate streak bonus XP if applicable
    let streakXP = 0;
    if (streakResult.success && streakResult.streakIncreased) {
      streakXP = getStreakXPReward(streakResult.currentStreak);
    }

    // OPTIONAL: If you want to update budgets automatically when a new expense is added,
    // call your budget update logic here (e.g., services/updateBudgetOnExpense(expense))

    return res.status(201).json({ 
      success: true, 
      expense,
      streak: streakResult.success ? {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        streakIncreased: streakResult.streakIncreased,
        streakReset: streakResult.streakReset,
        graceUsed: streakResult.graceUsed,
        streakXP,
        message: streakResult.message
      } : null
    });
  } catch (err) {
    console.error("createExpense error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/user/expense
 * Query params:
 *  - page (default 1)
 *  - limit (default 25)
 *  - category (optional)
 *  - from (ISO date string) - start date inclusive
 *  - to   (ISO date string) - end date inclusive
 *  - sortBy (e.g. "date" or "-amount", default "-date")
 *
 * Returns paginated list of expenses for authenticated user.
 */
export const getExpenses = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Parse query params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const { category, from, to, sortBy } = req.query;

    // Build filter
    const filter = { user: new mongoose.Types.ObjectId(userId) };

    if (category && String(category).trim()) {
      filter.category = String(category).trim();
    }

    if (from) {
      if (!isValidDate(from)) return res.status(400).json({ success: false, message: "from must be a valid date" });
      filter.date = filter.date || {};
      filter.date.$gte = new Date(from);
    }
    if (to) {
      if (!isValidDate(to)) return res.status(400).json({ success: false, message: "to must be a valid date" });
      filter.date = filter.date || {};
      // set end of day for inclusive behavior if time not provided
      const toDate = new Date(to);
      toDate.setHours(23,59,59,999);
      filter.date.$lte = toDate;
    }

    // Sorting
    let sort = { date: -1 }; // default newest first
    if (sortBy && typeof sortBy === "string") {
      // allow comma separated fields like "date,-amount"
      sort = {};
      const fields = String(sortBy).split(",");
      fields.forEach(f => {
        f = f.trim();
        if (!f) return;
        if (f.startsWith("-")) sort[f.slice(1)] = -1;
        else sort[f] = 1;
      });
    }

    // Execute queries
    const [total, expenses] = await Promise.all([
      Expense.countDocuments(filter),
      Expense.find(filter).sort(sort).skip(skip).limit(limit).lean()
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      expenses,
    });
  } catch (err) {
    console.error("getExpenses error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
