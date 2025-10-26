import FriendChallenge from "../models/FriendChallenge.js";
import User from "../models/User.js";
import CurrencyTransaction from "../models/CurrencyTransaction.js";
import mongoose from "mongoose";
import { getChallengeTemplate, FRIEND_CHALLENGE_TEMPLATES } from "../config/friendChallengeTemplates.js";
import { verifyChallengeCompletion } from "../services/challengeVerification.service.js";

/**
 * Helper: Create currency transaction
 */
async function createTransaction(userId, amount, type, description, relatedChallenge = null, relatedUser = null, session = null) {
  const user = await User.findById(userId).session(session);
  const balanceBefore = user.virtualCurrency;
  const balanceAfter = balanceBefore + amount;

  const transaction = await CurrencyTransaction.create([{
    user: userId,
    amount,
    type,
    balanceBefore,
    balanceAfter,
    description,
    relatedChallenge,
    relatedUser,
  }], { session });

  // Update user balance
  user.virtualCurrency = balanceAfter;
  await user.save({ session });

  return transaction[0];
}

/**
 * GET /api/user/friend-challenges/templates
 * Get all available challenge templates
 */
export const getChallengeTemplates = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      templates: FRIEND_CHALLENGE_TEMPLATES,
    });
  } catch (err) {
    console.error("getChallengeTemplates error:", err);
    return res.status(500).json({ success: false, message: "Failed to get templates" });
  }
};

/**
 * POST /api/user/friend-challenges/create
 * Create a new friend challenge using a template
 */
export const createFriendChallenge = async (req, res) => {
  try {
    const challengerId = req.user && req.user.id;
    if (!challengerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const {
      challengedUserId,
      templateId,
      wagerAmount,
      daysToComplete, // Optional: override template suggestion
    } = req.body;

    // Validation
    if (!challengedUserId || !templateId || !wagerAmount) {
      return res.status(400).json({ success: false, message: "Missing required fields: challengedUserId, templateId, wagerAmount" });
    }

    // Get challenge template
    const template = getChallengeTemplate(templateId);
    if (!template) {
      return res.status(400).json({ success: false, message: "Invalid challenge template ID" });
    }

    if (wagerAmount < 1) {
      return res.status(400).json({ success: false, message: "Wager amount must be at least 1" });
    }

    if (challengerId === challengedUserId) {
      return res.status(400).json({ success: false, message: "Cannot challenge yourself" });
    }

    const [challenger, challenged] = await Promise.all([
      User.findById(challengerId),
      User.findById(challengedUserId),
    ]);

    if (!challenged) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if they are friends
    if (!challenger.friends.includes(challengedUserId)) {
      return res.status(400).json({ success: false, message: "You can only challenge your friends" });
    }

    // Check if challenger has enough balance
    if (challenger.virtualCurrency < wagerAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${challenger.virtualCurrency} coins but need ${wagerAmount}`,
      });
    }

    // Create challenge from template
    const now = new Date();
    const acceptDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const days = daysToComplete || template.suggestedDays;
    const completionDeadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const challenge = await FriendChallenge.create({
      challenger: challengerId,
      challenged: challengedUserId,
      challengeType: template.category,
      title: template.title,
      description: template.description,
      wagerAmount,
      acceptDeadline,
      completionDeadline,
      targetValue: template.verificationCriteria.targetValue || 0,
      verificationCriteria: template.verificationCriteria,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      challenge,
    });
  } catch (err) {
    console.error("createFriendChallenge error:", err);
    return res.status(500).json({ success: false, message: "Failed to create challenge" });
  }
};

/**
 * POST /api/user/friend-challenges/:challengeId/accept
 * Accept a friend challenge
 */
export const acceptFriendChallenge = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { challengeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ success: false, message: "Invalid challenge ID" });
    }

    const challenge = await FriendChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    // Verify user is the challenged person
    if (challenge.challenged.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You are not authorized to accept this challenge" });
    }

    // Check if already accepted/expired
    if (challenge.status !== "pending") {
      return res.status(400).json({ success: false, message: `Challenge is already ${challenge.status}` });
    }

    // Check if accept deadline has passed
    if (new Date() > challenge.acceptDeadline) {
      challenge.status = "expired";
      await challenge.save();
      return res.status(400).json({ success: false, message: "Challenge accept deadline has passed" });
    }

    // Check if user has enough balance
    const user = await User.findById(userId);
    if (user.virtualCurrency < challenge.wagerAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${user.virtualCurrency} coins but need ${challenge.wagerAmount}`,
      });
    }

    // Store baseline data for verification
    challenge.xpAtStart = user.xp || 0;
    challenge.levelAtStart = user.level || 1;
    challenge.friendsCountAtStart = user.friends?.length || 0;
    
    // Accept challenge
    challenge.status = "accepted";
    challenge.acceptedAt = new Date();
    await challenge.save();

    return res.status(200).json({
      success: true,
      message: "Challenge accepted! Complete it before the deadline. Progress is tracked automatically.",
      challenge,
    });
  } catch (err) {
    console.error("acceptFriendChallenge error:", err);
    return res.status(500).json({ success: false, message: "Failed to accept challenge" });
  }
};

/**
 * POST /api/user/friend-challenges/:challengeId/reject
 * Reject a friend challenge
 */
export const rejectFriendChallenge = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { challengeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ success: false, message: "Invalid challenge ID" });
    }

    const challenge = await FriendChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    if (challenge.challenged.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You are not authorized to reject this challenge" });
    }

    if (challenge.status !== "pending") {
      return res.status(400).json({ success: false, message: `Challenge is already ${challenge.status}` });
    }

    challenge.status = "cancelled";
    await challenge.save();

    return res.status(200).json({
      success: true,
      message: "Challenge rejected",
    });
  } catch (err) {
    console.error("rejectFriendChallenge error:", err);
    return res.status(500).json({ success: false, message: "Failed to reject challenge" });
  }
};

/**
 * GET /api/user/friend-challenges/:challengeId/check
 * Check if challenge is completed (auto-verification)
 */
export const checkChallengeCompletion = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { challengeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid challenge ID" });
    }

    const challenge = await FriendChallenge.findById(challengeId).session(session);
    if (!challenge) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    // Can be checked by either participant
    if (challenge.challenged.toString() !== userId && challenge.challenger.toString() !== userId) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "Not authorized to view this challenge" });
    }

    if (challenge.status !== "accepted") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Challenge is ${challenge.status}, cannot check completion` });
    }

    // Check if deadline has passed
    if (new Date() > challenge.completionDeadline) {
      // Challenge failed - deadline passed
      challenge.status = "failed";
      challenge.completedAt = new Date();
      challenge.winner = challenge.challenger;
      await challenge.save({ session });

      // Transfer currency: deduct from challenged, add to challenger
      await createTransaction(
        challenge.challenged,
        -challenge.wagerAmount,
        "challenge_loss",
        `Lost challenge: ${challenge.title} (time expired)`,
        challenge._id,
        challenge.challenger,
        session
      );

      await createTransaction(
        challenge.challenger,
        challenge.wagerAmount,
        "challenge_win",
        `Won challenge (opponent failed): ${challenge.title}`,
        challenge._id,
        challenge.challenged,
        session
      );

      await session.commitTransaction();

      return res.status(200).json({
        success: false,
        completed: false,
        failed: true,
        message: "Challenge deadline has passed. Challenge failed.",
        challenge,
      });
    }

    // Auto-verify completion using verification service
    const verification = await verifyChallengeCompletion(
      challenge,
      challenge.challenged.toString(),
      challenge.acceptedAt
    );

    // Update progress
    challenge.currentProgress = verification.progress;

    if (verification.completed) {
      // Challenge completed successfully!
      challenge.status = "completed";
      challenge.completedAt = new Date();
      challenge.winner = challenge.challenged;
      challenge.proofData = verification.details;
      await challenge.save({ session });

      // Transfer currency: deduct from challenger, add to challenged
      await createTransaction(
        challenge.challenger,
        -challenge.wagerAmount,
        "challenge_loss",
        `Lost challenge to ${(await User.findById(challenge.challenged).session(session)).username}`,
        challenge._id,
        challenge.challenged,
        session
      );

      await createTransaction(
        challenge.challenged,
        challenge.wagerAmount,
        "challenge_win",
        `Won challenge: ${challenge.title}`,
        challenge._id,
        challenge.challenger,
        session
      );

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        completed: true,
        message: `Congratulations! Challenge completed! You won ${challenge.wagerAmount} coins!`,
        challenge,
        verification,
      });
    } else {
      // Not yet completed
      await challenge.save({ session });
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        completed: false,
        message: "Challenge not yet completed. Keep going!",
        challenge,
        verification,
      });
    }
  } catch (err) {
    await session.abortTransaction();
    console.error("checkChallengeCompletion error:", err);
    return res.status(500).json({ success: false, message: "Failed to check challenge completion" });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/user/friend-challenges/:challengeId/cancel
 * Cancel a challenge (only if still pending and by challenger)
 */
export const cancelFriendChallenge = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { challengeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ success: false, message: "Invalid challenge ID" });
    }

    const challenge = await FriendChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    if (challenge.challenger.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the challenger can cancel" });
    }

    if (challenge.status !== "pending") {
      return res.status(400).json({ success: false, message: "Can only cancel pending challenges" });
    }

    challenge.status = "cancelled";
    await challenge.save();

    return res.status(200).json({
      success: true,
      message: "Challenge cancelled",
    });
  } catch (err) {
    console.error("cancelFriendChallenge error:", err);
    return res.status(500).json({ success: false, message: "Failed to cancel challenge" });
  }
};

/**
 * GET /api/user/friend-challenges/my-challenges
 * Get all user's challenges (sent and received)
 */
export const getMyChallenges = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const [sent, received] = await Promise.all([
      FriendChallenge.find({ challenger: userId })
        .populate("challenged", "username email level xp virtualCurrency")
        .sort({ createdAt: -1 })
        .lean(),
      FriendChallenge.find({ challenged: userId })
        .populate("challenger", "username email level xp virtualCurrency")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      challenges: {
        sent,
        received,
      },
    });
  } catch (err) {
    console.error("getMyChallenges error:", err);
    return res.status(500).json({ success: false, message: "Failed to get challenges" });
  }
};

/**
 * GET /api/user/friend-challenges/pending
 * Get pending challenges (need to accept)
 */
export const getPendingChallenges = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const challenges = await FriendChallenge.find({
      challenged: userId,
      status: "pending",
      acceptDeadline: { $gt: new Date() },
    })
      .populate("challenger", "username email level xp virtualCurrency")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      challenges,
    });
  } catch (err) {
    console.error("getPendingChallenges error:", err);
    return res.status(500).json({ success: false, message: "Failed to get pending challenges" });
  }
};

/**
 * GET /api/user/friend-challenges/active
 * Get active challenges (accepted, not yet completed)
 */
export const getActiveChallenges = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const challenges = await FriendChallenge.find({
      $or: [{ challenger: userId }, { challenged: userId }],
      status: "accepted",
    })
      .populate("challenger", "username email level xp virtualCurrency")
      .populate("challenged", "username email level xp virtualCurrency")
      .sort({ completionDeadline: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      challenges,
    });
  } catch (err) {
    console.error("getActiveChallenges error:", err);
    return res.status(500).json({ success: false, message: "Failed to get active challenges" });
  }
};

/**
 * GET /api/user/friend-challenges/currency/balance
 * Get current user's virtual currency balance
 */
export const getCurrencyBalance = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId).select("virtualCurrency username").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      balance: user.virtualCurrency,
      username: user.username,
    });
  } catch (err) {
    console.error("getCurrencyBalance error:", err);
    return res.status(500).json({ success: false, message: "Failed to get balance" });
  }
};

/**
 * POST /api/user/friend-challenges/currency/deposit-crypto
 * Deposit coins to crypto wallet (deduct from main balance)
 */
export const depositToCryptoWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.virtualCurrency < amount) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. You have ${user.virtualCurrency} coins but need ${amount}` 
      });
    }

    // Deduct from balance
    await createTransaction(
      userId,
      -amount,
      "crypto_deposit",
      `Deposited ${amount} coins to crypto wallet with 10x leverage`,
      null,
      null,
      session
    );

    await session.commitTransaction();
    
    // Get updated balance
    const updatedUser = await User.findById(userId).select("virtualCurrency");

    return res.status(200).json({
      success: true,
      message: "Deposit successful",
      newBalance: updatedUser.virtualCurrency,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("depositToCryptoWallet error:", err);
    console.error("Error details:", err.message, err.stack);
    return res.status(500).json({ success: false, message: `Failed to deposit: ${err.message}` });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/user/friend-challenges/currency/withdraw-crypto
 * Withdraw from crypto wallet (add to main balance)
 */
export const withdrawFromCryptoWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Add to balance
    await createTransaction(
      userId,
      amount,
      "crypto_withdraw",
      `Withdrew ${amount} coins from crypto wallet (after 10x leverage adjustment)`,
      null,
      null,
      session
    );

    await session.commitTransaction();

    const user = await User.findById(userId).select("virtualCurrency");
    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      newBalance: user.virtualCurrency,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("withdrawFromCryptoWallet error:", err);
    console.error("Error details:", err.message, err.stack);
    return res.status(500).json({ success: false, message: `Failed to withdraw: ${err.message}` });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/user/friend-challenges/currency/crypto-buy
 * Buy cryptocurrency (deduct from crypto wallet)
 */
export const buyCrypto = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { cryptoId, quantity, price } = req.body;
    if (!cryptoId || !quantity || !price || quantity <= 0 || price <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid crypto purchase data" });
    }

    const totalCost = quantity * price;

    // Create transaction for crypto purchase
    await createTransaction(
      userId,
      -totalCost,
      "crypto_buy",
      `Bought ${quantity} ${cryptoId.toUpperCase()} for ₹${totalCost.toFixed(2)}`,
      null,
      null,
      session
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Crypto purchase successful",
      totalCost,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("buyCrypto error:", err);
    return res.status(500).json({ success: false, message: `Failed to buy crypto: ${err.message}` });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/user/friend-challenges/currency/crypto-sell
 * Sell cryptocurrency (add to crypto wallet)
 */
export const sellCrypto = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { cryptoId, quantity, price, profitLoss } = req.body;
    if (!cryptoId || !quantity || !price || quantity <= 0 || price <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid crypto sale data" });
    }

    const totalValue = quantity * price;

    // Create transaction for crypto sale
    await createTransaction(
      userId,
      totalValue,
      "crypto_sell",
      `Sold ${quantity} ${cryptoId.toUpperCase()} for ₹${totalValue.toFixed(2)}`,
      null,
      null,
      session
    );

    // If there's a profit or loss, create additional transaction
    if (profitLoss !== 0) {
      const profitLossType = profitLoss > 0 ? "crypto_profit" : "crypto_loss";
      const profitLossAmount = Math.abs(profitLoss);
      
      await createTransaction(
        userId,
        profitLoss,
        profitLossType,
        `${profitLoss > 0 ? 'Profit' : 'Loss'} from ${cryptoId.toUpperCase()} trading: ₹${profitLossAmount.toFixed(2)}`,
        null,
        null,
        session
      );
    }

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Crypto sale successful",
      totalValue,
      profitLoss,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("sellCrypto error:", err);
    return res.status(500).json({ success: false, message: `Failed to sell crypto: ${err.message}` });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/user/currency/transactions
 * Get user's currency transaction history
 */
export const getCurrencyTransactions = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const transactions = await CurrencyTransaction.find({ user: userId })
      .populate("relatedUser", "username")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (err) {
    console.error("getCurrencyTransactions error:", err);
    return res.status(500).json({ success: false, message: "Failed to get transactions" });
  }
};

/**
 * Cron job helper: Check and expire challenges
 */
export const checkExpiredChallenges = async () => {
  try {
    const now = new Date();

    // Expire pending challenges that passed accept deadline
    await FriendChallenge.updateMany(
      {
        status: "pending",
        acceptDeadline: { $lt: now },
      },
      {
        status: "expired",
      }
    );

    // Fail accepted challenges that passed completion deadline
    const failedChallenges = await FriendChallenge.find({
      status: "accepted",
      completionDeadline: { $lt: now },
    });

    for (const challenge of failedChallenges) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        challenge.status = "failed";
        challenge.completedAt = now;
        challenge.winner = challenge.challenger;
        await challenge.save({ session });

        // Transfer currency
        await createTransaction(
          challenge.challenged,
          -challenge.wagerAmount,
          "challenge_loss",
          `Failed challenge: ${challenge.title} (deadline passed)`,
          challenge._id,
          challenge.challenger,
          session
        );

        await createTransaction(
          challenge.challenger,
          challenge.wagerAmount,
          "challenge_win",
          `Won challenge (opponent failed to complete)`,
          challenge._id,
          challenge.challenged,
          session
        );

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        console.error("Error processing failed challenge:", err);
      } finally {
        session.endSession();
      }
    }

    console.log(`Expired ${failedChallenges.length} challenges`);
  } catch (err) {
    console.error("checkExpiredChallenges error:", err);
  }
};
