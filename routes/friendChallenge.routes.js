import express from "express";
import {
  createFriendChallenge,
  acceptFriendChallenge,
  rejectFriendChallenge,
  completeFriendChallenge,
  cancelFriendChallenge,
  getMyChallenges,
  getPendingChallenges,
  getActiveChallenges,
  getCurrencyBalance,
  getCurrencyTransactions,
} from "../controllers/friendChallenge.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Currency endpoints
router.get("/currency/balance", getCurrencyBalance);
router.get("/currency/transactions", getCurrencyTransactions);

// Challenge management
router.post("/create", createFriendChallenge);
router.post("/:challengeId/accept", acceptFriendChallenge);
router.post("/:challengeId/reject", rejectFriendChallenge);
router.post("/:challengeId/complete", completeFriendChallenge);
router.post("/:challengeId/cancel", cancelFriendChallenge);

// Get challenges
router.get("/my-challenges", getMyChallenges);
router.get("/pending", getPendingChallenges);
router.get("/active", getActiveChallenges);

export default router;
