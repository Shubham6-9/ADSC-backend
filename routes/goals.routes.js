// routes/goals.routes.js
import express from "express";
import { createGoal, getGoals, getGoalById, updateGoal, getTotalSavings } from "../controllers/goals.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js"; // adapt path if needed

const router = express.Router();

// Create goal
router.post("/", authMiddleware, createGoal);

// Get total savings summary (must be before /:id route)
router.get("/summary/total-savings", authMiddleware, getTotalSavings);

// List goals with filters/pagination
router.get("/", authMiddleware, getGoals);

// Get single goal by id
router.get("/:id", authMiddleware, getGoalById);

// Update goal (add savings)
router.patch("/:id", authMiddleware, updateGoal);

export default router;
