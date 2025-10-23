import express from "express";
import {
  getChallengeTemplates,
  createFriendChallenge,
  acceptFriendChallenge,
  rejectFriendChallenge,
  checkChallengeCompletion,
  cancelFriendChallenge,
  getMyChallenges,
  getPendingChallenges,
  getActiveChallenges,
  getCurrencyBalance,
  getCurrencyTransactions,
  depositToCryptoWallet,
  withdrawFromCryptoWallet,
} from "../controllers/friendChallenge.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Currency endpoints
router.get("/currency/balance", getCurrencyBalance);
router.get("/currency/transactions", getCurrencyTransactions);
router.post("/currency/deposit-crypto", depositToCryptoWallet);
router.post("/currency/withdraw-crypto", withdrawFromCryptoWallet);

// Challenge templates
router.get("/templates", getChallengeTemplates);

// Challenge management
router.post("/create", createFriendChallenge);
router.post("/:challengeId/accept", acceptFriendChallenge);
router.post("/:challengeId/reject", rejectFriendChallenge);
router.get("/:challengeId/check", checkChallengeCompletion); // Auto-verify
router.post("/:challengeId/cancel", cancelFriendChallenge);

// Get challenges
router.get("/my-challenges", getMyChallenges);
router.get("/pending", getPendingChallenges);
router.get("/active", getActiveChallenges);

export default router;
