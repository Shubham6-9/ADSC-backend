// services/streak.service.js
import User from '../models/User.js';

/**
 * Calculate streak based on last expense date and current date
 * Rules:
 * - Same day: no change
 * - Yesterday: increment streak
 * - 2 days ago (grace period): maintain streak, mark grace as used
 * - More than 2 days: reset to 1
 */
export const updateStreakOnExpense = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If no previous expense, start streak at 1
    if (!user.lastExpenseDate) {
      user.currentStreak = 1;
      user.longestStreak = Math.max(1, user.longestStreak);
      user.lastExpenseDate = today;
      user.streakGraceUsed = false;
      await user.save();
      
      return {
        success: true,
        streakUpdated: true,
        currentStreak: 1,
        longestStreak: user.longestStreak,
        isNewStreak: true,
        graceUsed: false,
        message: 'Streak started!'
      };
    }

    const lastExpense = new Date(user.lastExpenseDate);
    const lastExpenseDay = new Date(lastExpense.getFullYear(), lastExpense.getMonth(), lastExpense.getDate());
    
    // Calculate days difference
    const diffTime = today - lastExpenseDay;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let streakUpdated = false;
    let graceUsed = false;
    let streakIncreased = false;
    let streakReset = false;

    if (diffDays === 0) {
      // Same day - no change
      return {
        success: true,
        streakUpdated: false,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isNewStreak: false,
        graceUsed: false,
        message: 'Already logged expense today'
      };
    } else if (diffDays === 1) {
      // Yesterday - increment streak
      user.currentStreak += 1;
      user.lastExpenseDate = today;
      user.streakGraceUsed = false; // Reset grace
      streakUpdated = true;
      streakIncreased = true;
      
      // Update longest streak if current is higher
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
    } else if (diffDays === 2 && !user.streakGraceUsed) {
      // 2 days ago and grace not used - maintain streak with grace period
      user.lastExpenseDate = today;
      user.streakGraceUsed = true;
      streakUpdated = true;
      graceUsed = true;
    } else {
      // More than 2 days or grace already used - reset streak
      user.currentStreak = 1;
      user.lastExpenseDate = today;
      user.streakGraceUsed = false;
      streakUpdated = true;
      streakReset = true;
      
      // Still update longest if needed
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
    }

    await user.save();

    return {
      success: true,
      streakUpdated,
      streakIncreased,
      streakReset,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      isNewStreak: user.currentStreak === 1 && streakReset,
      graceUsed,
      message: streakIncreased 
        ? `Streak increased to ${user.currentStreak} days!` 
        : graceUsed 
          ? `Streak maintained (grace period used)`
          : streakReset
            ? 'Streak reset. Start again!'
            : 'Streak updated'
    };

  } catch (error) {
    console.error('Error updating streak:', error);
    return { success: false, message: 'Failed to update streak' };
  }
};

/**
 * Get user's current streak info
 */
export const getUserStreak = async (userId) => {
  try {
    const user = await User.findById(userId).select('currentStreak longestStreak lastExpenseDate streakGraceUsed');
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check if streak should be considered broken (more than 2 days without expense)
    let streakStatus = 'active';
    if (user.lastExpenseDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastExpense = new Date(user.lastExpenseDate);
      const lastExpenseDay = new Date(lastExpense.getFullYear(), lastExpense.getMonth(), lastExpense.getDate());
      const diffDays = Math.floor((today - lastExpenseDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streakStatus = 'completed_today';
      } else if (diffDays === 1) {
        streakStatus = 'at_risk'; // Need to add expense today
      } else if (diffDays === 2 && !user.streakGraceUsed) {
        streakStatus = 'grace_period'; // Last chance
      } else if (diffDays >= 2) {
        streakStatus = 'broken'; // Will reset on next expense
      }
    }

    return {
      success: true,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastExpenseDate: user.lastExpenseDate,
      streakGraceUsed: user.streakGraceUsed,
      streakStatus
    };

  } catch (error) {
    console.error('Error getting user streak:', error);
    return { success: false, message: 'Failed to get streak info' };
  }
};

/**
 * Calculate XP reward based on streak milestones
 */
export const getStreakXPReward = (streak) => {
  if (streak >= 365) return 1000; // 1 year
  if (streak >= 180) return 500;  // 6 months
  if (streak >= 100) return 300;  // 100 days
  if (streak >= 50) return 150;   // 50 days
  if (streak >= 30) return 100;   // 1 month
  if (streak >= 14) return 50;    // 2 weeks
  if (streak >= 7) return 30;     // 1 week
  if (streak >= 3) return 10;     // 3 days
  return 0; // No bonus for streaks less than 3
};

export default {
  updateStreakOnExpense,
  getUserStreak,
  getStreakXPReward
};
