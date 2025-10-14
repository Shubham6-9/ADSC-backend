// controllers/dailyChallenge.controller.js
import {
  getTodaysChallenges,
  completeDailyChallenge,
  getChallengeStats,
  updateChallengeProgress
} from "../services/dailyChallenge.service.js";
import DailyChallenge from "../models/DailyChallenge.js";

/**
 * GET /api/user/daily-challenges
 * Get today's challenges for the authenticated user
 */
export const getDailyChallenges = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await getTodaysChallenges(userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      challenges: result.challenges
    });
  } catch (err) {
    console.error("getDailyChallenges error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

/**
 * POST /api/user/daily-challenges/:id/complete
 * Mark a daily challenge as complete
 */
export const completeChallenge = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const challengeId = req.params.id;
    if (!challengeId) {
      return res.status(400).json({ success: false, message: "Challenge ID required" });
    }

    const result = await completeDailyChallenge(userId, challengeId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("completeChallenge error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

/**
 * GET /api/user/daily-challenges/stats
 * Get challenge statistics for the user
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await getChallengeStats(userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

/**
 * POST /api/user/daily-challenges/progress
 * Update challenge progress (for automatic tracking)
 * Body: { challengeType: string, incrementBy?: number }
 */
export const updateProgress = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { challengeType, incrementBy = 1 } = req.body;
    if (!challengeType) {
      return res.status(400).json({ success: false, message: "challengeType required" });
    }

    const result = await updateChallengeProgress(userId, challengeType, incrementBy);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("updateProgress error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

/**
 * DELETE /api/user/daily-challenges/reset-today
 * Reset today's challenges (delete them so they regenerate with new rewards)
 * Useful after currency system update
 */
export const resetTodayChallenges = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await DailyChallenge.deleteMany({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} challenges. Refresh to generate new ones with currency rewards!`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("resetTodayChallenges error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

export default {
  getDailyChallenges,
  completeChallenge,
  getStats,
  updateProgress,
  resetTodayChallenges
};
