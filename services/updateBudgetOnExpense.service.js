// services/updateBudgetOnExpense.service.js
import mongoose from "mongoose";
import Budget from "../models/Budget.js";

/**
 * Automatically update budget spent amounts when an expense is created.
 * Updates both overall budgets and matching category budgets.
 * 
 * @param {string} userId - The user's ID
 * @param {Object} expenseData - Expense details
 * @param {string} expenseData.category - Expense category
 * @param {number} expenseData.amount - Expense amount
 * @param {Date|string} expenseData.date - Expense date
 * @returns {Promise<Object>} Result with updated budgets info
 */
export async function updateBudgetOnExpense(userId, expenseData) {
    try {
        const { category, amount, date } = expenseData;

        if (!userId || !category || !amount || !date) {
            throw new Error("Missing required expense data for budget update");
        }

        const expenseDate = new Date(date);
        const expenseAmount = Number(amount);

        if (isNaN(expenseAmount) || expenseAmount < 0) {
            throw new Error("Invalid expense amount");
        }

        // Find all matching budgets for this expense
        // Match criteria:
        // 1. Budget belongs to the user
        // 2. Expense date falls within budget date range
        // 3. Budget is either:
        //    - Overall budget (all expenses count)
        //    - Category budget matching the expense category
        const matchingBudgets = await Budget.find({
            user: new mongoose.Types.ObjectId(userId),
            startDate: { $lte: expenseDate },
            endDate: { $gte: expenseDate },
            $or: [
                { budgetType: "overall" },
                {
                    budgetType: "category",
                    categoryName: { $regex: new RegExp(`^${category}$`, 'i') } // Case-insensitive match
                }
            ]
        });

        if (matchingBudgets.length === 0) {
            // No matching budgets found - this is ok, not all expenses need budgets
            return {
                success: true,
                message: "No matching budgets to update",
                updatedBudgets: []
            };
        }

        // Update all matching budgets
        const updatedBudgets = [];

        for (const budget of matchingBudgets) {
            // Increment spent amount atomically
            const updatedBudget = await Budget.findByIdAndUpdate(
                budget._id,
                { $inc: { spent: expenseAmount } },
                { new: true }
            );

            if (updatedBudget) {
                // Recalculate and update savings (budgetAmount - spent, minimum 0)
                const newSavings = Math.max(0, updatedBudget.budgetAmount - updatedBudget.spent);
                updatedBudget.savings = newSavings;
                await updatedBudget.save();

                updatedBudgets.push({
                    budgetId: updatedBudget._id,
                    title: updatedBudget.title,
                    budgetType: updatedBudget.budgetType,
                    categoryName: updatedBudget.categoryName,
                    spent: updatedBudget.spent,
                    savings: updatedBudget.savings,
                    budgetAmount: updatedBudget.budgetAmount
                });
            }
        }

        return {
            success: true,
            message: `Updated ${updatedBudgets.length} budget(s)`,
            updatedBudgets
        };

    } catch (error) {
        console.error("Error updating budgets on expense:", error);
        // Don't throw - we don't want to fail expense creation if budget update fails
        return {
            success: false,
            message: error.message || "Failed to update budgets",
            updatedBudgets: []
        };
    }
}

/**
 * Reverse budget update when an expense is deleted.
 * Decrements spent amount from matching budgets.
 * 
 * @param {string} userId - The user's ID
 * @param {Object} expenseData - Expense details
 * @returns {Promise<Object>} Result with updated budgets info
 */
export async function reverseBudgetOnExpenseDelete(userId, expenseData) {
    try {
        const { category, amount, date } = expenseData;

        if (!userId || !category || !amount || !date) {
            throw new Error("Missing required expense data for budget reversal");
        }

        const expenseDate = new Date(date);
        const expenseAmount = Number(amount);

        if (isNaN(expenseAmount) || expenseAmount < 0) {
            throw new Error("Invalid expense amount");
        }

        // Find matching budgets (same logic as update)
        const matchingBudgets = await Budget.find({
            user: new mongoose.Types.ObjectId(userId),
            startDate: { $lte: expenseDate },
            endDate: { $gte: expenseDate },
            $or: [
                { budgetType: "overall" },
                {
                    budgetType: "category",
                    categoryName: { $regex: new RegExp(`^${category}$`, 'i') }
                }
            ]
        });

        if (matchingBudgets.length === 0) {
            return {
                success: true,
                message: "No matching budgets to reverse",
                updatedBudgets: []
            };
        }

        // Reverse update (decrement spent)
        const updatedBudgets = [];

        for (const budget of matchingBudgets) {
            // Decrement spent amount, but don't go below 0
            const newSpent = Math.max(0, budget.spent - expenseAmount);

            const updatedBudget = await Budget.findByIdAndUpdate(
                budget._id,
                { $set: { spent: newSpent } },
                { new: true }
            );

            if (updatedBudget) {
                // Recalculate savings
                const newSavings = Math.max(0, updatedBudget.budgetAmount - updatedBudget.spent);
                updatedBudget.savings = newSavings;
                await updatedBudget.save();

                updatedBudgets.push({
                    budgetId: updatedBudget._id,
                    title: updatedBudget.title,
                    budgetType: updatedBudget.budgetType,
                    spent: updatedBudget.spent,
                    savings: updatedBudget.savings
                });
            }
        }

        return {
            success: true,
            message: `Reversed ${updatedBudgets.length} budget(s)`,
            updatedBudgets
        };

    } catch (error) {
        console.error("Error reversing budget on expense delete:", error);
        return {
            success: false,
            message: error.message || "Failed to reverse budgets",
            updatedBudgets: []
        };
    }
}
