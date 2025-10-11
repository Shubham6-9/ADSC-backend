// routes/budget.routes.js
import express from "express";
import {
  createBudget,
  getBudgets,
  getActiveBudgets,
  getBudgetById,
  addSpentToBudget,
  getBudgetSummary,
} from "../controllers/budget.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js"; // adapt path to your project

const router = express.Router();

// Create budget (validates monthly against yearly if exists)
router.post("/", authMiddleware, createBudget);

// Get all budgets for logged-in user
router.get("/", authMiddleware, getBudgets);

// Get only active budgets (current date between startDate and endDate)
router.get("/active", authMiddleware, getActiveBudgets);

// Get budget summary (yearly vs monthly allocation)
router.get("/summary", authMiddleware, getBudgetSummary);

// Get a single budget by id (owner only)
router.get("/:id", authMiddleware, getBudgetById);

// Increment spent on any budget
// Body: { amountSpent: Number }
router.patch("/:id/spent", authMiddleware, addSpentToBudget);

export default router;
