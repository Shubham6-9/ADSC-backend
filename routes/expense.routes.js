// routes/expense.routes.js
import express from "express";
import { createExpense, getExpenses } from "../controllers/expense.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Create new expense
router.post("/", authMiddleware, createExpense);

// Get expenses with filters/pagination
router.get("/", authMiddleware, getExpenses);

export default router;
