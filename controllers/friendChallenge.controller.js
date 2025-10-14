import FriendChallenge from "../models/FriendChallenge.js";
import User from "../models/User.js";
import CurrencyTransaction from "../models/CurrencyTransaction.js";
import mongoose from "mongoose";

/**
 * Helper: Create currency transaction
 */
async function createTransaction(userId, amount, type, description, relatedChallenge = null, relatedUser = null) {
  const user = await User.findById(userId);
  const balanceBefore = user.virtualCurrency;
  const balanceAfter = balanceBefore + amount;

  const transaction = await CurrencyTransaction.create({
    user: userId,
    amount,
    type,
    balanceBefore,
    balanceAfter,
    description,
    relatedChallenge,
    relatedUser,
  });

  // Update user balance
  user.virtualCurrency = balanceAfter;
  await user.save();

  return transaction;
}

/**
 * POST /api/user/friend-challenges/create
 * Create a new friend challenge with wager
 */
export const createFriendChallenge = async (req, res) => {
  try {
    const challengerId = req.user && req.user.id;
    if (!challengerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const {
      challengedUserId,
      challengeType,
      title,
      description,
      wagerAmount,
      daysToComplete,
      targetValue,
    } = req.body;

    // Validation
    if (!challengedUserId || !challengeType || !title || !description || !wagerAmount || !daysToComplete) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
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

    // Create challenge
    const now = new Date();
    const acceptDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const completionDeadline = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);

    const challenge = await FriendChallenge.create({
      challenger: challengerId,
      challenged: challengedUserId,
      challengeType,
      title,
      description,
      wagerAmount,
      acceptDeadline,
      completionDeadline,
      targetValue: targetValue || null,
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

    // Accept challenge
    challenge.status = "accepted";
    challenge.acceptedAt = new Date();
    await challenge.save();

    return res.status(200).json({
      success: true,
      message: "Challenge accepted! Complete it before the deadline.",
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
 * POST /api/user/friend-challenges/:challengeId/complete
 * Mark challenge as completed
 */
export const completeFriendChallenge = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { challengeId } = req.params;
    const { proofData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid challenge ID" });
    }

    const challenge = await FriendChallenge.findById(challengeId).session(session);
    if (!challenge) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    // Only the challenged user can complete
    if (challenge.challenged.toString() !== userId) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "Only the challenged user can complete this" });
    }

    if (challenge.status !== "accepted") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Challenge is ${challenge.status}, cannot complete` });
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
        `Lost challenge: ${challenge.title}`,
        challenge._id,
        challenge.challenger
      );

      await createTransaction(
        challenge.challenger,
        challenge.wagerAmount,
        "challenge_win",
        `Won challenge against ${(await User.findById(challenge.challenged).session(session)).username}`,
        challenge._id,
        challenge.challenged
      );

      await session.commitTransaction();

      return res.status(200).json({
        success: false,
        message: "Challenge deadline has passed. You failed the challenge.",
        challenge,
      });
    }

    // Challenge completed successfully
    challenge.status = "completed";
    challenge.completedAt = new Date();
    challenge.winner = challenge.challenged;
    challenge.proofData = proofData || null;
    await challenge.save({ session });

    // Transfer currency: deduct from challenger, add to challenged
    await createTransaction(
      challenge.challenger,
      -challenge.wagerAmount,
      "challenge_loss",
      `Lost challenge to ${(await User.findById(challenge.challenged).session(session)).username}`,
      challenge._id,
      challenge.challenged
    );

    await createTransaction(
      challenge.challenged,
      challenge.wagerAmount,
      "challenge_win",
      `Won challenge: ${challenge.title}`,
      challenge._id,
      challenge.challenger
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: `Congratulations! You won ${challenge.wagerAmount} coins!`,
      challenge,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("completeFriendChallenge error:", err);
    return res.status(500).json({ success: false, message: "Failed to complete challenge" });
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
 * GET /api/user/currency/balance
 * Get user's virtual currency balance
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
          challenge.challenger
        );

        await createTransaction(
          challenge.challenger,
          challenge.wagerAmount,
          "challenge_win",
          `Won challenge (opponent failed to complete)`,
          challenge._id,
          challenge.challenged
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
