import Game from "../models/Game.js";
import GameSession from "../models/GameSession.js";
import GameLeaderboard from "../models/GameLeaderboard.js";
import User from "../models/User.js";
import CurrencyTransaction from "../models/CurrencyTransaction.js";
import mongoose from "mongoose";

/**
 * Helper: Create currency transaction for games
 */
async function createGameTransaction(userId, amount, type, description, sessionId = null, session = null) {
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
    relatedChallenge: sessionId,
  }], { session });

  user.virtualCurrency = balanceAfter;
  await user.save({ session });

  return transaction[0];
}

/**
 * GET /api/user/games
 * Get all available games
 */
export const getAvailableGames = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId);
    
    // Fetch ALL games (both active and inactive) so users can see "Coming Soon" games
    const games = await Game.find({})
      .sort({ minimumLevel: 1, difficulty: 1 })
      .lean();

    // Check which games user can access based on level
    const gamesWithAccess = games.map(game => ({
      ...game,
      canAccess: (user.level || 1) >= game.minimumLevel,
      userBalance: user.virtualCurrency,
    }));

    return res.status(200).json({
      success: true,
      games: gamesWithAccess,
      userBalance: user.virtualCurrency,
    });
  } catch (err) {
    console.error("getAvailableGames error:", err);
    return res.status(500).json({ success: false, message: "Failed to get games" });
  }
};

/**
 * GET /api/user/games/:gameType
 * Get specific game details
 */
export const getGameDetails = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { gameType } = req.params;

    const game = await Game.findOne({ gameType, isActive: true }).lean();
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    const user = await User.findById(userId);

    // Get user's stats for this game
    const userStats = await GameSession.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), gameType, status: "completed" } },
      {
        $group: {
          _id: null,
          totalPlayed: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $gt: ["$rewardAmount", 0] }, 1, 0] } },
          highestScore: { $max: "$score" },
          totalCoinsWon: { $sum: { $cond: [{ $gt: ["$netProfit", 0] }, "$netProfit", 0] } },
          totalCoinsLost: { $sum: { $cond: [{ $lt: ["$netProfit", 0] }, { $abs: "$netProfit" }, 0] } },
        },
      },
    ]);

    const stats = userStats.length > 0 ? userStats[0] : {
      totalPlayed: 0,
      totalWins: 0,
      highestScore: 0,
      totalCoinsWon: 0,
      totalCoinsLost: 0,
    };

    // Check daily play limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlays = await GameSession.countDocuments({
      user: userId,
      gameType,
      createdAt: { $gte: today },
    });

    // Check cooldown
    const lastSession = await GameSession.findOne({
      user: userId,
      gameType,
    }).sort({ createdAt: -1 }).lean();

    let canPlay = true;
    let cooldownRemaining = 0;
    if (lastSession) {
      const cooldownEnd = new Date(lastSession.createdAt.getTime() + game.cooldownMinutes * 60 * 1000);
      if (new Date() < cooldownEnd) {
        canPlay = false;
        cooldownRemaining = Math.ceil((cooldownEnd - new Date()) / 1000);
      }
    }

    if (todayPlays >= game.dailyPlayLimit) {
      canPlay = false;
    }

    return res.status(200).json({
      success: true,
      game,
      userStats: stats,
      canPlay,
      cooldownRemaining,
      playsToday: todayPlays,
      playsRemaining: Math.max(0, game.dailyPlayLimit - todayPlays),
      userBalance: user.virtualCurrency,
      canAccess: user.level >= game.minimumLevel,
    });
  } catch (err) {
    console.error("getGameDetails error:", err);
    return res.status(500).json({ success: false, message: "Failed to get game details" });
  }
};

/**
 * POST /api/user/games/:gameType/start
 * Start a new game session
 */
export const startGameSession = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { gameType } = req.params;
    const { entryFee } = req.body;

    if (!entryFee || entryFee < 1) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid entry fee" });
    }

    const game = await Game.findOne({ gameType, isActive: true }).session(session);
    if (!game) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    // Validate entry fee range
    if (entryFee < game.minEntryFee || entryFee > game.maxEntryFee) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Entry fee must be between ${game.minEntryFee} and ${game.maxEntryFee} coins`,
      });
    }

    const user = await User.findById(userId).session(session);

    // Check level requirement
    if (user.level < game.minimumLevel) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: `You need to be at least level ${game.minimumLevel} to play this game`,
      });
    }

    // Check balance
    if (user.virtualCurrency < entryFee) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${user.virtualCurrency} coins but need ${entryFee}`,
      });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlays = await GameSession.countDocuments({
      user: userId,
      gameType,
      createdAt: { $gte: today },
    }).session(session);

    if (todayPlays >= game.dailyPlayLimit) {
      await session.abortTransaction();
      return res.status(429).json({
        success: false,
        message: `Daily play limit reached. You can play ${game.dailyPlayLimit} times per day`,
      });
    }

    // Check cooldown
    const lastSession = await GameSession.findOne({
      user: userId,
      gameType,
    }).sort({ createdAt: -1 }).session(session).lean();

    if (lastSession) {
      const cooldownEnd = new Date(lastSession.createdAt.getTime() + game.cooldownMinutes * 60 * 1000);
      if (new Date() < cooldownEnd) {
        const remainingSeconds = Math.ceil((cooldownEnd - new Date()) / 1000);
        await session.abortTransaction();
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(remainingSeconds / 60)} minutes before playing again`,
          cooldownRemaining: remainingSeconds,
        });
      }
    }

    // Deduct entry fee
    await createGameTransaction(
      userId,
      -entryFee,
      "game_entry",
      `Entered ${game.name} game`,
      null,
      session
    );

    // Create game session
    const gameSession = await GameSession.create([{
      user: userId,
      gameType,
      entryFee,
      maxScore: game.gameSettings.maxScore || 100,
      startedAt: new Date(),
    }], { session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Game session started",
      sessionId: gameSession[0]._id,
      entryFee,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("❌ startGameSession error:", err);
    console.error("Error details:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to start game session",
      error: err.message 
    });
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/user/games/:gameType/complete
 * Complete a game session and calculate rewards
 */
export const completeGameSession = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { gameType } = req.params;
    const { sessionId, score, correctAnswers, wrongAnswers, timeSpentSeconds, gameData } = req.body;

    if (!sessionId || score === undefined) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const gameSession = await GameSession.findById(sessionId).session(session);
    if (!gameSession) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Game session not found" });
    }

    if (gameSession.user.toString() !== userId) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (gameSession.status !== "in_progress") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Game session already completed" });
    }

    const game = await Game.findOne({ gameType }).session(session);
    if (!game) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    // Calculate reward based on score
    const scorePercentage = (score / gameSession.maxScore) * 100;
    let rewardAmount = 0;
    
    if (scorePercentage >= 80) {
      // High score: 2x-3x multiplier
      rewardAmount = Math.floor(gameSession.entryFee * (2 + (scorePercentage - 80) / 20));
    } else if (scorePercentage >= 60) {
      // Medium score: 1.5x-2x multiplier
      rewardAmount = Math.floor(gameSession.entryFee * (1.5 + (scorePercentage - 60) / 20));
    } else if (scorePercentage >= 40) {
      // Low score: Get entry fee back
      rewardAmount = gameSession.entryFee;
    }
    // Below 40%: No reward (lost the entry fee)

    // Apply house edge
    const houseEdge = (rewardAmount * game.houseEdgePercent) / 100;
    rewardAmount = Math.floor(rewardAmount - houseEdge);

    const netProfit = rewardAmount - gameSession.entryFee;

    // Update session
    gameSession.status = "completed";
    gameSession.completedAt = new Date();
    gameSession.score = score;
    gameSession.correctAnswers = correctAnswers || 0;
    gameSession.wrongAnswers = wrongAnswers || 0;
    gameSession.timeSpentSeconds = timeSpentSeconds || 0;
    gameSession.rewardAmount = rewardAmount;
    gameSession.netProfit = netProfit;
    gameSession.gameData = gameData || {};
    await gameSession.save({ session });

    // Add reward to user balance if any
    if (rewardAmount > 0) {
      await createGameTransaction(
        userId,
        rewardAmount,
        "game_reward",
        `Won ${rewardAmount} coins in ${game.name} (Score: ${score})`,
        sessionId,
        session
      );
    }

    // Update leaderboard
    await updateLeaderboard(userId, gameType, gameSession, session);

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: netProfit > 0 ? `Congratulations! You won ${rewardAmount} coins!` : 
               netProfit === 0 ? "Good try! You got your entry fee back." :
               "Better luck next time!",
      session: gameSession,
      rewardAmount,
      netProfit,
      scorePercentage: scorePercentage.toFixed(1),
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("❌ completeGameSession error:", err);
    console.error("Error details:", err.message);
    console.error("Stack trace:", err.stack);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to complete game session",
      error: err.message 
    });
  } finally {
    session.endSession();
  }
};

/**
 * Helper: Update leaderboard stats
 */
async function updateLeaderboard(userId, gameType, gameSession, session) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  // Update daily, weekly, and all-time leaderboards
  for (const period of ["daily", "weekly", "all_time"]) {
    const periodDate = period === "daily" ? today : period === "weekly" ? weekStart : new Date(2020, 0, 1);

    const leaderboard = await GameLeaderboard.findOneAndUpdate(
      { user: userId, gameType, period, periodDate },
      {
        $inc: {
          totalGamesPlayed: 1,
          totalWins: gameSession.netProfit > 0 ? 1 : 0,
          totalCoinsWon: gameSession.netProfit > 0 ? gameSession.netProfit : 0,
          totalCoinsLost: gameSession.netProfit < 0 ? Math.abs(gameSession.netProfit) : 0,
        },
        $max: {
          highestScore: gameSession.score,
        },
      },
      { upsert: true, new: true, session }
    );

    // Calculate averages
    leaderboard.netProfit = leaderboard.totalCoinsWon - leaderboard.totalCoinsLost;
    leaderboard.winRate = leaderboard.totalGamesPlayed > 0 
      ? (leaderboard.totalWins / leaderboard.totalGamesPlayed) * 100 
      : 0;
    leaderboard.averageScore = gameSession.score; // Simplified, should calculate properly
    
    if (gameSession.timeSpentSeconds > 0) {
      if (!leaderboard.fastestCompletionSeconds || gameSession.timeSpentSeconds < leaderboard.fastestCompletionSeconds) {
        leaderboard.fastestCompletionSeconds = gameSession.timeSpentSeconds;
      }
    }

    await leaderboard.save({ session });
  }
}

/**
 * GET /api/user/games/:gameType/leaderboard
 * Get leaderboard for a specific game
 */
export const getGameLeaderboard = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { gameType } = req.params;
    const { period = "all_time", limit = 50 } = req.query;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const periodDate = period === "daily" ? today : period === "weekly" ? weekStart : new Date(2020, 0, 1);

    const leaderboard = await GameLeaderboard.find({
      gameType,
      period,
      periodDate,
    })
      .populate("user", "username level xp")
      .sort({ highestScore: -1, netProfit: -1 })
      .limit(parseInt(limit))
      .lean();

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Get user's position
    const userEntry = rankedLeaderboard.find(entry => entry.user._id.toString() === userId);

    return res.status(200).json({
      success: true,
      leaderboard: rankedLeaderboard,
      userEntry: userEntry || null,
    });
  } catch (err) {
    console.error("getGameLeaderboard error:", err);
    return res.status(500).json({ success: false, message: "Failed to get leaderboard" });
  }
};

/**
 * GET /api/user/games/my-sessions
 * Get user's game history
 */
export const getMyGameSessions = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { gameType, limit = 20 } = req.query;

    const query = { user: userId };
    if (gameType) query.gameType = gameType;

    const sessions = await GameSession.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (err) {
    console.error("getMyGameSessions error:", err);
    return res.status(500).json({ success: false, message: "Failed to get game sessions" });
  }
};
