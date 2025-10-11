// routes/leaderboard.routes.js
import express from "express";
import { getLeaderboard, getMyRank, getTopUsers } from "../controllers/leaderboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get full leaderboard with pagination
router.get("/", getLeaderboard);

// Get authenticated user's rank
router.get("/my-rank", authMiddleware, getMyRank);

// Get top N users
router.get("/top", getTopUsers);

export default router;
