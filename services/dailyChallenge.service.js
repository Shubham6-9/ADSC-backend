// services/dailyChallenge.service.js
import DailyChallenge from "../models/DailyChallenge.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import CurrencyTransaction from "../models/CurrencyTransaction.js";
import addXp from "./addXp.service.js";

/**
 * Challenge templates with varying difficulty and rewards
 */
const CHALLENGE_TEMPLATES = [
  {
    challengeType: 'add-expense',
    title: 'Track Your Spending',
    description: 'Add at least 1 expense today',
    xpReward: 10,
    currencyReward: 5,
    targetValue: 1
  },
  {
    challengeType: 'add-expense-with-notes',
    title: 'Detail Master',
    description: 'Add an expense with detailed notes',
    xpReward: 15,
    currencyReward: 8,
    targetValue: 1
  },
  {
    challengeType: 'add-multiple-expenses',
    title: 'Diligent Tracker',
    description: 'Add 3 or more expenses today',
    xpReward: 25,
    currencyReward: 15,
    targetValue: 3
  },
  {
    challengeType: 'check-streak',
    title: 'Streak Keeper',
    description: 'Maintain your daily expense tracking streak',
    xpReward: 20,
    currencyReward: 10,
    targetValue: 1
  },
  {
    challengeType: 'create-budget',
    title: 'Budget Planner',
    description: 'Create a new budget for better financial control',
    xpReward: 30,
    currencyReward: 20,
    targetValue: 1
  },
  {
    challengeType: 'create-goal',
    title: 'Goal Setter',
    description: 'Set a new financial goal',
    xpReward: 30,
    currencyReward: 20,
    targetValue: 1
  },
  {
    challengeType: 'track-daily',
    title: 'Daily Commitment',
    description: 'Log in and check your dashboard',
    xpReward: 5,
    currencyReward: 3,
    targetValue: 1
  }
];

/**
 * Get start of today (00:00:00) in UTC
 */
function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get end of today (23:59:59) in UTC
 */
function getTodayEnd() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * Generate daily challenges for a user
 * Creates 3-5 random challenges each day
 */
export async function generateDailyChallenges(userId) {
  try {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    // Check if challenges already exist for today
    const existingChallenges = await DailyChallenge.find({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (existingChallenges.length > 0) {
      return { success: true, challenges: existingChallenges, message: "Challenges already exist for today" };
    }

    // Get user to check their level for difficulty scaling
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Select 3-5 random challenges
    const numChallenges = Math.floor(Math.random() * 3) + 3; // 3 to 5 challenges
    const shuffled = [...CHALLENGE_TEMPLATES].sort(() => 0.5 - Math.random());
    const selectedTemplates = shuffled.slice(0, numChallenges);

    // Create challenges with scaled rewards based on user level
    const challenges = [];
    for (const template of selectedTemplates) {
      const levelMultiplier = 1 + (user.level - 1) * 0.1; // 10% increase per level
      const scaledXP = Math.round(template.xpReward * levelMultiplier);
      const scaledCurrency = Math.round((template.currencyReward || 0) * levelMultiplier);

      const challenge = await DailyChallenge.create({
        user: userId,
        date: todayStart,
        challengeType: template.challengeType,
        title: template.title,
        description: template.description,
        xpReward: scaledXP,
        currencyReward: scaledCurrency,
        targetValue: template.targetValue,
        currentProgress: 0,
        isCompleted: false
      });

      challenges.push(challenge);
    }

    return { success: true, challenges, message: "Daily challenges generated" };
  } catch (err) {
    console.error("generateDailyChallenges error:", err);
    return { success: false, message: "Failed to generate challenges", error: err.message };
  }
}

/**
 * Get today's challenges for a user (auto-generate if needed)
 */
export async function getTodaysChallenges(userId) {
  try {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    let challenges = await DailyChallenge.find({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    }).sort({ createdAt: 1 });

    // If no challenges exist, generate them
    if (challenges.length === 0) {
      const result = await generateDailyChallenges(userId);
      if (result.success) {
        challenges = result.challenges;
      } else {
        return result;
      }
    }

    return { success: true, challenges };
  } catch (err) {
    console.error("getTodaysChallenges error:", err);
    return { success: false, message: "Failed to fetch challenges", error: err.message };
  }
}

/**
 * Update challenge progress and complete if target reached
 */
export async function updateChallengeProgress(userId, challengeType, incrementBy = 1) {
  try {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    // Find incomplete challenge of this type for today
    const challenge = await DailyChallenge.findOne({
      user: userId,
      challengeType: challengeType,
      date: { $gte: todayStart, $lte: todayEnd },
      isCompleted: false
    });

    if (!challenge) {
      return { success: false, message: "No active challenge found for this type" };
    }

    // Update progress
    challenge.currentProgress += incrementBy;

    // Check if completed
    if (challenge.currentProgress >= challenge.targetValue) {
      challenge.isCompleted = true;
      challenge.completedAt = new Date();
      
      // Award XP
      await addXp(userId, challenge.xpReward);
      
      // Award Virtual Currency
      const currencyReward = challenge.currencyReward || 0;
      if (currencyReward > 0) {
        const user = await User.findById(userId);
        const balanceBefore = user.virtualCurrency;
        user.virtualCurrency += currencyReward;
        await user.save();
        
        // Create transaction record
        await CurrencyTransaction.create({
          user: userId,
          amount: currencyReward,
          type: "daily_challenge_reward",
          balanceBefore,
          balanceAfter: user.virtualCurrency,
          description: `Completed daily challenge: ${challenge.title}`,
        });
      }
    }

    await challenge.save();

    return {
      success: true,
      challenge,
      completed: challenge.isCompleted,
      xpAwarded: challenge.isCompleted ? challenge.xpReward : 0,
      currencyAwarded: challenge.isCompleted ? (challenge.currencyReward || 0) : 0
    };
  } catch (err) {
    console.error("updateChallengeProgress error:", err);
    return { success: false, message: "Failed to update challenge progress", error: err.message };
  }
}

/**
 * Mark a challenge as complete (manual completion)
 */
export async function completeDailyChallenge(userId, challengeId) {
  try {
    const challenge = await DailyChallenge.findOne({
      _id: challengeId,
      user: userId
    });

    if (!challenge) {
      return { success: false, message: "Challenge not found" };
    }

    if (challenge.isCompleted) {
      return { success: false, message: "Challenge already completed" };
    }

    // Mark as complete
    challenge.isCompleted = true;
    challenge.completedAt = new Date();
    challenge.currentProgress = challenge.targetValue;

    // Award XP
    const xpResult = await addXp(userId, challenge.xpReward);
    
    // Award Virtual Currency
    const currencyReward = challenge.currencyReward || 0;
    let currencyAwarded = 0;
    if (currencyReward > 0) {
      const user = await User.findById(userId);
      const balanceBefore = user.virtualCurrency;
      user.virtualCurrency += currencyReward;
      await user.save();
      currencyAwarded = currencyReward;
      
      // Create transaction record
      await CurrencyTransaction.create({
        user: userId,
        amount: currencyReward,
        type: "daily_challenge_reward",
        balanceBefore,
        balanceAfter: user.virtualCurrency,
        description: `Completed daily challenge: ${challenge.title}`,
      });
    }

    await challenge.save();

    return {
      success: true,
      challenge,
      xpResult,
      currencyAwarded,
      message: `Challenge completed! Earned ${challenge.xpReward} XP and ${currencyAwarded} coins!`
    };
  } catch (err) {
    console.error("completeDailyChallenge error:", err);
    return { success: false, message: "Failed to complete challenge", error: err.message };
  }
}

/**
 * Get challenge statistics for a user
 */
export async function getChallengeStats(userId) {
  try {
    const totalCompleted = await DailyChallenge.countDocuments({
      user: userId,
      isCompleted: true
    });

    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    const todayCompleted = await DailyChallenge.countDocuments({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd },
      isCompleted: true
    });

    const todayTotal = await DailyChallenge.countDocuments({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    return {
      success: true,
      stats: {
        totalCompleted,
        todayCompleted,
        todayTotal,
        todayProgress: todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0
      }
    };
  } catch (err) {
    console.error("getChallengeStats error:", err);
    return { success: false, message: "Failed to fetch stats", error: err.message };
  }
}

export default {
  generateDailyChallenges,
  getTodaysChallenges,
  updateChallengeProgress,
  completeDailyChallenge,
  getChallengeStats
};
