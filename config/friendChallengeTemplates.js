/**
 * Pre-made Friend Challenge Templates
 * Each template has clear verification criteria for auto-completion
 */

export const FRIEND_CHALLENGE_TEMPLATES = [
  // ========== EXPENSE TRACKING CHALLENGES ==========
  {
    id: 'expense_track_5',
    title: 'Expense Tracker Bronze',
    description: 'Track 5 expenses within the deadline',
    category: 'expense_tracking',
    difficulty: 'easy',
    suggestedWager: 10,
    suggestedDays: 3,
    verificationCriteria: {
      type: 'expense_count',
      targetValue: 5
    },
    icon: '📝'
  },
  {
    id: 'expense_track_10',
    title: 'Expense Tracker Silver',
    description: 'Track 10 expenses within the deadline',
    category: 'expense_tracking',
    difficulty: 'medium',
    suggestedWager: 20,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'expense_count',
      targetValue: 10
    },
    icon: '📝'
  },
  {
    id: 'expense_track_20',
    title: 'Expense Tracker Gold',
    description: 'Track 20 expenses within the deadline',
    category: 'expense_tracking',
    difficulty: 'hard',
    suggestedWager: 40,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'expense_count',
      targetValue: 20
    },
    icon: '📝'
  },
  {
    id: 'expense_with_notes',
    title: 'Detail Master',
    description: 'Add 5 expenses with notes (minimum 10 characters)',
    category: 'expense_tracking',
    difficulty: 'medium',
    suggestedWager: 25,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'expense_with_notes',
      targetValue: 5,
      minNoteLength: 10
    },
    icon: '✍️'
  },
  {
    id: 'expense_daily',
    title: 'Daily Tracker',
    description: 'Track at least 1 expense every day for 5 days',
    category: 'expense_tracking',
    difficulty: 'medium',
    suggestedWager: 30,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'expense_daily_streak',
      targetValue: 5
    },
    icon: '📅'
  },
  
  // ========== BUDGET CHALLENGES ==========
  {
    id: 'create_budget',
    title: 'Budget Planner',
    description: 'Create 1 budget within the deadline',
    category: 'budget_creation',
    difficulty: 'easy',
    suggestedWager: 15,
    suggestedDays: 2,
    verificationCriteria: {
      type: 'budget_count',
      targetValue: 1
    },
    icon: '💼'
  },
  {
    id: 'create_3_budgets',
    title: 'Budget Master',
    description: 'Create 3 different budgets',
    category: 'budget_creation',
    difficulty: 'medium',
    suggestedWager: 35,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'budget_count',
      targetValue: 3
    },
    icon: '💼'
  },
  {
    id: 'stay_under_budget',
    title: 'Budget Keeper',
    description: 'Stay under your budget for 5 days',
    category: 'budget_adherence',
    difficulty: 'hard',
    suggestedWager: 50,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'under_budget_days',
      targetValue: 5
    },
    icon: '✅'
  },
  
  // ========== SAVINGS GOAL CHALLENGES ==========
  {
    id: 'create_goal',
    title: 'Goal Setter',
    description: 'Create 1 savings goal',
    category: 'savings_goal',
    difficulty: 'easy',
    suggestedWager: 15,
    suggestedDays: 2,
    verificationCriteria: {
      type: 'goal_count',
      targetValue: 1
    },
    icon: '🎯'
  },
  {
    id: 'save_amount',
    title: 'Saver Bronze',
    description: 'Save at least $50 within the deadline',
    category: 'savings_goal',
    difficulty: 'medium',
    suggestedWager: 20,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'total_savings',
      targetValue: 50
    },
    icon: '💰'
  },
  {
    id: 'save_amount_100',
    title: 'Saver Silver',
    description: 'Save at least $100 within the deadline',
    category: 'savings_goal',
    difficulty: 'hard',
    suggestedWager: 40,
    suggestedDays: 10,
    verificationCriteria: {
      type: 'total_savings',
      targetValue: 100
    },
    icon: '💰'
  },
  
  // ========== STREAK CHALLENGES ==========
  {
    id: 'maintain_streak_3',
    title: 'Streak Starter',
    description: 'Maintain a 3-day login streak',
    category: 'streak_maintain',
    difficulty: 'easy',
    suggestedWager: 15,
    suggestedDays: 3,
    verificationCriteria: {
      type: 'login_streak',
      targetValue: 3
    },
    icon: '🔥'
  },
  {
    id: 'maintain_streak_7',
    title: 'Streak Warrior',
    description: 'Maintain a 7-day login streak',
    category: 'streak_maintain',
    difficulty: 'medium',
    suggestedWager: 30,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'login_streak',
      targetValue: 7
    },
    icon: '🔥'
  },
  {
    id: 'maintain_streak_14',
    title: 'Streak Legend',
    description: 'Maintain a 14-day login streak',
    category: 'streak_maintain',
    difficulty: 'hard',
    suggestedWager: 60,
    suggestedDays: 14,
    verificationCriteria: {
      type: 'login_streak',
      targetValue: 14
    },
    icon: '🔥'
  },
  
  // ========== DAILY CHALLENGE COMPLETION ==========
  {
    id: 'complete_daily_3',
    title: 'Challenge Rookie',
    description: 'Complete 3 daily challenges',
    category: 'daily_challenge_complete',
    difficulty: 'easy',
    suggestedWager: 15,
    suggestedDays: 3,
    verificationCriteria: {
      type: 'daily_challenges_completed',
      targetValue: 3
    },
    icon: '🏆'
  },
  {
    id: 'complete_daily_7',
    title: 'Challenge Pro',
    description: 'Complete 7 daily challenges',
    category: 'daily_challenge_complete',
    difficulty: 'medium',
    suggestedWager: 30,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'daily_challenges_completed',
      targetValue: 7
    },
    icon: '🏆'
  },
  {
    id: 'complete_daily_14',
    title: 'Challenge Master',
    description: 'Complete 14 daily challenges',
    category: 'daily_challenge_complete',
    difficulty: 'hard',
    suggestedWager: 50,
    suggestedDays: 14,
    verificationCriteria: {
      type: 'daily_challenges_completed',
      targetValue: 14
    },
    icon: '🏆'
  },
  
  // ========== XP & LEVEL CHALLENGES ==========
  {
    id: 'gain_xp_100',
    title: 'XP Hunter',
    description: 'Gain at least 100 XP',
    category: 'xp_gain',
    difficulty: 'medium',
    suggestedWager: 25,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'xp_gained',
      targetValue: 100
    },
    icon: '⭐'
  },
  {
    id: 'gain_xp_250',
    title: 'XP Farmer',
    description: 'Gain at least 250 XP',
    category: 'xp_gain',
    difficulty: 'hard',
    suggestedWager: 50,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'xp_gained',
      targetValue: 250
    },
    icon: '⭐'
  },
  {
    id: 'level_up',
    title: 'Level Up!',
    description: 'Reach the next level',
    category: 'level_up',
    difficulty: 'hard',
    suggestedWager: 60,
    suggestedDays: 10,
    verificationCriteria: {
      type: 'level_up',
      targetValue: 1
    },
    icon: '🎖️'
  },
  
  // ========== CATEGORY-SPECIFIC CHALLENGES ==========
  {
    id: 'food_expenses_10',
    title: 'Food Tracker',
    description: 'Track 10 food expenses',
    category: 'expense_tracking',
    difficulty: 'medium',
    suggestedWager: 20,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'category_expense_count',
      category: 'Food',
      targetValue: 10
    },
    icon: '🍔'
  },
  {
    id: 'transport_expenses_10',
    title: 'Transport Tracker',
    description: 'Track 10 transport expenses',
    category: 'expense_tracking',
    difficulty: 'medium',
    suggestedWager: 20,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'category_expense_count',
      category: 'Transport',
      targetValue: 10
    },
    icon: '🚗'
  },
  {
    id: 'entertainment_budget',
    title: 'Fun Budget Master',
    description: 'Stay under entertainment budget for 5 days',
    category: 'budget_adherence',
    difficulty: 'medium',
    suggestedWager: 30,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'category_under_budget',
      category: 'Entertainment',
      targetValue: 5
    },
    icon: '🎮'
  },
  
  // ========== CONSISTENCY CHALLENGES ==========
  {
    id: 'consistent_logger',
    title: 'Consistent Logger',
    description: 'Log at least 2 expenses every day for 5 days',
    category: 'expense_tracking',
    difficulty: 'hard',
    suggestedWager: 45,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'daily_expense_minimum',
      targetValue: 5,
      minPerDay: 2
    },
    icon: '📊'
  },
  {
    id: 'active_user',
    title: 'Active User',
    description: 'Complete at least 1 daily challenge every day for 5 days',
    category: 'daily_challenge_complete',
    difficulty: 'medium',
    suggestedWager: 35,
    suggestedDays: 5,
    verificationCriteria: {
      type: 'daily_challenge_streak',
      targetValue: 5
    },
    icon: '💪'
  },
  
  // ========== SOCIAL CHALLENGES ==========
  {
    id: 'add_friends',
    title: 'Social Butterfly',
    description: 'Add 3 new friends',
    category: 'social',
    difficulty: 'easy',
    suggestedWager: 10,
    suggestedDays: 3,
    verificationCriteria: {
      type: 'friends_added',
      targetValue: 3
    },
    icon: '👥'
  },
  {
    id: 'leaderboard_top_10',
    title: 'Top 10 Climber',
    description: 'Reach top 10 on the leaderboard',
    category: 'leaderboard',
    difficulty: 'hard',
    suggestedWager: 70,
    suggestedDays: 14,
    verificationCriteria: {
      type: 'leaderboard_rank',
      targetValue: 10
    },
    icon: '🏅'
  },
  
  // ========== ADVANCED CHALLENGES ==========
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete all daily challenges for 7 days',
    category: 'daily_challenge_complete',
    difficulty: 'extreme',
    suggestedWager: 100,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'perfect_daily_week',
      targetValue: 7
    },
    icon: '👑'
  },
  {
    id: 'budget_savings_combo',
    title: 'Budget & Save Combo',
    description: 'Create 2 budgets and save $50',
    category: 'combined',
    difficulty: 'hard',
    suggestedWager: 50,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'combined',
      requirements: [
        { type: 'budget_count', targetValue: 2 },
        { type: 'total_savings', targetValue: 50 }
      ]
    },
    icon: '🎯'
  },
  {
    id: 'expense_budget_goal',
    title: 'Triple Threat',
    description: 'Track 10 expenses, create 1 budget, and set 1 goal',
    category: 'combined',
    difficulty: 'hard',
    suggestedWager: 55,
    suggestedDays: 7,
    verificationCriteria: {
      type: 'combined',
      requirements: [
        { type: 'expense_count', targetValue: 10 },
        { type: 'budget_count', targetValue: 1 },
        { type: 'goal_count', targetValue: 1 }
      ]
    },
    icon: '🎪'
  },
  
  // ========== SPEED CHALLENGES ==========
  {
    id: 'quick_tracker',
    title: 'Quick Tracker',
    description: 'Track 5 expenses within 24 hours',
    category: 'expense_tracking',
    difficulty: 'medium',
    suggestedWager: 25,
    suggestedDays: 1,
    verificationCriteria: {
      type: 'expense_count',
      targetValue: 5
    },
    icon: '⚡'
  },
  {
    id: 'speed_budgeter',
    title: 'Speed Budgeter',
    description: 'Create 2 budgets within 48 hours',
    category: 'budget_creation',
    difficulty: 'medium',
    suggestedWager: 30,
    suggestedDays: 2,
    verificationCriteria: {
      type: 'budget_count',
      targetValue: 2
    },
    icon: '⚡'
  },
  
  // ========== MILESTONE CHALLENGES ==========
  {
    id: 'expense_milestone_50',
    title: 'Expense Milestone',
    description: 'Track your 50th expense (cumulative)',
    category: 'milestone',
    difficulty: 'medium',
    suggestedWager: 40,
    suggestedDays: 10,
    verificationCriteria: {
      type: 'total_expense_count',
      targetValue: 50
    },
    icon: '🎊'
  },
  {
    id: 'savings_milestone_500',
    title: 'Savings Milestone',
    description: 'Reach $500 in total savings',
    category: 'milestone',
    difficulty: 'hard',
    suggestedWager: 80,
    suggestedDays: 30,
    verificationCriteria: {
      type: 'total_savings',
      targetValue: 500
    },
    icon: '💎'
  }
];

/**
 * Get challenge template by ID
 */
export function getChallengeTemplate(templateId) {
  return FRIEND_CHALLENGE_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Get challenges by category
 */
export function getChallengesByCategory(category) {
  return FRIEND_CHALLENGE_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get challenges by difficulty
 */
export function getChallengesByDifficulty(difficulty) {
  return FRIEND_CHALLENGE_TEMPLATES.filter(t => t.difficulty === difficulty);
}

/**
 * Get all categories
 */
export function getAllCategories() {
  return [...new Set(FRIEND_CHALLENGE_TEMPLATES.map(t => t.category))];
}

export default FRIEND_CHALLENGE_TEMPLATES;
