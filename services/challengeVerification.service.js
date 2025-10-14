import Expense from "../models/Expense.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import User from "../models/User.js";
import DailyChallenge from "../models/DailyChallenge.js";

/**
 * Verify if a friend challenge is completed based on its verification criteria
 * @param {Object} challenge - The friend challenge document
 * @param {String} userId - The challenged user's ID
 * @param {Date} challengeStartDate - When the challenge was accepted
 * @returns {Promise<{completed: boolean, progress: number, details: Object}>}
 */
export async function verifyChallengeCompletion(challenge, userId, challengeStartDate) {
  const criteria = challenge.verificationCriteria;
  const type = criteria.type;
  const targetValue = criteria.targetValue || challenge.targetValue;

  // Date range: from challenge acceptance to now
  const startDate = new Date(challengeStartDate);
  const now = new Date();

  try {
    switch (type) {
      case 'expense_count':
        return await verifyExpenseCount(userId, targetValue, startDate);

      case 'expense_with_notes':
        return await verifyExpenseWithNotes(userId, targetValue, criteria.minNoteLength, startDate);

      case 'expense_daily_streak':
        return await verifyExpenseDailyStreak(userId, targetValue, startDate);

      case 'budget_count':
        return await verifyBudgetCount(userId, targetValue, startDate);

      case 'under_budget_days':
        return await verifyUnderBudgetDays(userId, targetValue, startDate);

      case 'goal_count':
        return await verifyGoalCount(userId, targetValue, startDate);

      case 'total_savings':
        return await verifyTotalSavings(userId, targetValue, startDate);

      case 'login_streak':
        return await verifyLoginStreak(userId, targetValue);

      case 'daily_challenges_completed':
        return await verifyDailyChallengesCompleted(userId, targetValue, startDate);

      case 'xp_gained':
        return await verifyXpGained(userId, targetValue, startDate, challenge);

      case 'level_up':
        return await verifyLevelUp(userId, startDate, challenge);

      case 'category_expense_count':
        return await verifyCategoryExpenseCount(userId, criteria.category, targetValue, startDate);

      case 'category_under_budget':
        return await verifyCategoryUnderBudget(userId, criteria.category, targetValue, startDate);

      case 'daily_expense_minimum':
        return await verifyDailyExpenseMinimum(userId, targetValue, criteria.minPerDay, startDate);

      case 'daily_challenge_streak':
        return await verifyDailyChallengeStreak(userId, targetValue, startDate);

      case 'friends_added':
        return await verifyFriendsAdded(userId, targetValue, startDate, challenge);

      case 'leaderboard_rank':
        return await verifyLeaderboardRank(userId, targetValue);

      case 'perfect_daily_week':
        return await verifyPerfectDailyWeek(userId, targetValue, startDate);

      case 'combined':
        return await verifyCombinedRequirements(userId, criteria.requirements, startDate, challenge);

      case 'total_expense_count':
        return await verifyTotalExpenseCount(userId, targetValue);

      default:
        return { completed: false, progress: 0, details: { error: 'Unknown verification type' } };
    }
  } catch (err) {
    console.error('Challenge verification error:', err);
    return { completed: false, progress: 0, details: { error: err.message } };
  }
}

// ========== VERIFICATION FUNCTIONS ==========

async function verifyExpenseCount(userId, targetValue, startDate) {
  const count = await Expense.countDocuments({
    user: userId,
    date: { $gte: startDate }
  });
  return {
    completed: count >= targetValue,
    progress: count,
    details: { expensesTracked: count, target: targetValue }
  };
}

async function verifyExpenseWithNotes(userId, targetValue, minNoteLength, startDate) {
  const expenses = await Expense.find({
    user: userId,
    date: { $gte: startDate },
    notes: { $exists: true, $ne: '' }
  });
  
  const validExpenses = expenses.filter(e => e.notes && e.notes.length >= minNoteLength);
  const count = validExpenses.length;
  
  return {
    completed: count >= targetValue,
    progress: count,
    details: { expensesWithNotes: count, target: targetValue, minNoteLength }
  };
}

async function verifyExpenseDailyStreak(userId, targetValue, startDate) {
  const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
  let streak = 0;
  
  for (let i = 0; i < days; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const count = await Expense.countDocuments({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd }
    });
    
    if (count > 0) {
      streak++;
    } else {
      break; // Streak broken
    }
  }
  
  return {
    completed: streak >= targetValue,
    progress: streak,
    details: { currentStreak: streak, target: targetValue }
  };
}

async function verifyBudgetCount(userId, targetValue, startDate) {
  const count = await Budget.countDocuments({
    user: userId,
    createdAt: { $gte: startDate }
  });
  return {
    completed: count >= targetValue,
    progress: count,
    details: { budgetsCreated: count, target: targetValue }
  };
}

async function verifyUnderBudgetDays(userId, targetValue, startDate) {
  const budgets = await Budget.find({
    user: userId,
    startDate: { $lte: new Date() },
    endDate: { $gte: startDate }
  });
  
  if (budgets.length === 0) {
    return { completed: false, progress: 0, details: { message: 'No active budgets found' } };
  }
  
  const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
  let underBudgetDays = 0;
  
  for (let i = 0; i < days && i < targetValue; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Check if under budget for this day
    for (const budget of budgets) {
      if (dayStart >= budget.startDate && dayStart <= budget.endDate) {
        const spent = await Expense.aggregate([
          {
            $match: {
              user: userId,
              date: { $gte: budget.startDate, $lte: dayEnd }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const totalSpent = spent[0]?.total || 0;
        if (totalSpent <= budget.budgetAmount) {
          underBudgetDays++;
          break;
        }
      }
    }
  }
  
  return {
    completed: underBudgetDays >= targetValue,
    progress: underBudgetDays,
    details: { underBudgetDays, target: targetValue }
  };
}

async function verifyGoalCount(userId, targetValue, startDate) {
  const count = await Goal.countDocuments({
    user: userId,
    createdAt: { $gte: startDate }
  });
  return {
    completed: count >= targetValue,
    progress: count,
    details: { goalsCreated: count, target: targetValue }
  };
}

async function verifyTotalSavings(userId, targetValue, startDate) {
  const goals = await Goal.find({
    user: userId,
    createdAt: { $gte: startDate }
  });
  
  const totalSaved = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
  
  return {
    completed: totalSaved >= targetValue,
    progress: totalSaved,
    details: { totalSaved, target: targetValue }
  };
}

async function verifyLoginStreak(userId, targetValue) {
  const user = await User.findById(userId);
  const currentStreak = user?.currentStreak || 0;
  
  return {
    completed: currentStreak >= targetValue,
    progress: currentStreak,
    details: { currentStreak, target: targetValue }
  };
}

async function verifyDailyChallengesCompleted(userId, targetValue, startDate) {
  const count = await DailyChallenge.countDocuments({
    user: userId,
    isCompleted: true,
    completedAt: { $gte: startDate }
  });
  
  return {
    completed: count >= targetValue,
    progress: count,
    details: { challengesCompleted: count, target: targetValue }
  };
}

async function verifyXpGained(userId, targetValue, startDate, challenge) {
  const user = await User.findById(userId);
  const xpAtStart = challenge.xpAtStart || 0;
  const currentXp = user?.xp || 0;
  const xpGained = Math.max(0, currentXp - xpAtStart);
  
  return {
    completed: xpGained >= targetValue,
    progress: xpGained,
    details: { xpGained, target: targetValue }
  };
}

async function verifyLevelUp(userId, startDate, challenge) {
  const user = await User.findById(userId);
  const levelAtStart = challenge.levelAtStart || 1;
  const currentLevel = user?.level || 1;
  const levelsGained = currentLevel - levelAtStart;
  
  return {
    completed: levelsGained >= 1,
    progress: levelsGained,
    details: { levelAtStart, currentLevel, levelsGained }
  };
}

async function verifyCategoryExpenseCount(userId, category, targetValue, startDate) {
  const count = await Expense.countDocuments({
    user: userId,
    category: category,
    date: { $gte: startDate }
  });
  
  return {
    completed: count >= targetValue,
    progress: count,
    details: { category, expensesTracked: count, target: targetValue }
  };
}

async function verifyCategoryUnderBudget(userId, category, targetValue, startDate) {
  const budgets = await Budget.find({
    user: userId,
    budgetType: 'category',
    categoryName: category,
    startDate: { $lte: new Date() },
    endDate: { $gte: startDate }
  });
  
  if (budgets.length === 0) {
    return { completed: false, progress: 0, details: { message: `No budget found for ${category}` } };
  }
  
  // Similar logic to verifyUnderBudgetDays but for specific category
  const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
  let underBudgetDays = 0;
  
  for (let i = 0; i < days && i < targetValue; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    for (const budget of budgets) {
      if (dayStart >= budget.startDate && dayStart <= budget.endDate) {
        const spent = await Expense.aggregate([
          {
            $match: {
              user: userId,
              category: category,
              date: { $gte: budget.startDate, $lte: dayEnd }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const totalSpent = spent[0]?.total || 0;
        if (totalSpent <= budget.budgetAmount) {
          underBudgetDays++;
          break;
        }
      }
    }
  }
  
  return {
    completed: underBudgetDays >= targetValue,
    progress: underBudgetDays,
    details: { category, underBudgetDays, target: targetValue }
  };
}

async function verifyDailyExpenseMinimum(userId, targetValue, minPerDay, startDate) {
  const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
  let qualifiedDays = 0;
  
  for (let i = 0; i < days && i < targetValue; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const count = await Expense.countDocuments({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd }
    });
    
    if (count >= minPerDay) {
      qualifiedDays++;
    }
  }
  
  return {
    completed: qualifiedDays >= targetValue,
    progress: qualifiedDays,
    details: { qualifiedDays, target: targetValue, minPerDay }
  };
}

async function verifyDailyChallengeStreak(userId, targetValue, startDate) {
  const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
  let streak = 0;
  
  for (let i = 0; i < days; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const count = await DailyChallenge.countDocuments({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd },
      isCompleted: true
    });
    
    if (count > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return {
    completed: streak >= targetValue,
    progress: streak,
    details: { currentStreak: streak, target: targetValue }
  };
}

async function verifyFriendsAdded(userId, targetValue, startDate, challenge) {
  const user = await User.findById(userId);
  const friendsAtStart = challenge.friendsCountAtStart || 0;
  const currentFriendsCount = user?.friends?.length || 0;
  const friendsAdded = Math.max(0, currentFriendsCount - friendsAtStart);
  
  return {
    completed: friendsAdded >= targetValue,
    progress: friendsAdded,
    details: { friendsAdded, target: targetValue }
  };
}

async function verifyLeaderboardRank(userId, targetValue) {
  const users = await User.find({}).sort({ xp: -1 }).select('_id').lean();
  const rank = users.findIndex(u => u._id.toString() === userId) + 1;
  
  return {
    completed: rank > 0 && rank <= targetValue,
    progress: rank,
    details: { currentRank: rank, targetRank: targetValue }
  };
}

async function verifyPerfectDailyWeek(userId, targetValue, startDate) {
  let perfectDays = 0;
  
  for (let i = 0; i < targetValue; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const [totalChallenges, completedChallenges] = await Promise.all([
      DailyChallenge.countDocuments({
        user: userId,
        date: { $gte: dayStart, $lte: dayEnd }
      }),
      DailyChallenge.countDocuments({
        user: userId,
        date: { $gte: dayStart, $lte: dayEnd },
        isCompleted: true
      })
    ]);
    
    if (totalChallenges > 0 && totalChallenges === completedChallenges) {
      perfectDays++;
    } else {
      break; // No longer perfect
    }
  }
  
  return {
    completed: perfectDays >= targetValue,
    progress: perfectDays,
    details: { perfectDays, target: targetValue }
  };
}

async function verifyCombinedRequirements(userId, requirements, startDate, challenge) {
  const results = [];
  
  for (const req of requirements) {
    const tempChallenge = { ...challenge, verificationCriteria: req, targetValue: req.targetValue };
    const result = await verifyChallengeCompletion(tempChallenge, userId, startDate);
    results.push({ ...result, requirement: req });
  }
  
  const allCompleted = results.every(r => r.completed);
  const completedCount = results.filter(r => r.completed).length;
  
  return {
    completed: allCompleted,
    progress: completedCount,
    details: { requirements: results, totalRequired: requirements.length }
  };
}

async function verifyTotalExpenseCount(userId, targetValue) {
  const count = await Expense.countDocuments({ user: userId });
  
  return {
    completed: count >= targetValue,
    progress: count,
    details: { totalExpenses: count, target: targetValue }
  };
}

export default verifyChallengeCompletion;
