// routes/dailyChallenge.routes.js
import express from "express";
import {
  getDailyChallenges,
  completeChallenge,
  getStats,
  updateProgress
} from "../controllers/dailyChallenge.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get today's challenges
router.get("/", authMiddleware, getDailyChallenges);

// Get challenge stats
router.get("/stats", authMiddleware, getStats);

// Complete a challenge
router.post("/:id/complete", authMiddleware, completeChallenge);

// Update challenge progress (for automatic tracking)
router.post("/progress", authMiddleware, updateProgress);

export default router;
