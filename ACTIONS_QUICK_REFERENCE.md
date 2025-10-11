# 🎮 Actions Quick Reference

## 📊 Complete Actions List (Sorted by XP)

### 🏆 Legendary Tier (100+ XP)

| Action Name | XP | When to Award |
|------------|-----|---------------|
| `budget-streak-month` | 200 | User maintains budget for 30 consecutive days |
| `savings-milestone-10000` | 250 | Total savings reach ₹10,000 |
| `savings-milestone-5000` | 150 | Total savings reach ₹5,000 |
| `track-expenses-month` | 100 | User logs expenses for 30 consecutive days |
| `achieve-goal` | 100 | User completes a savings goal |

### 💎 High Tier (60-99 XP)

| Action Name | XP | When to Award |
|------------|-----|---------------|
| `savings-milestone-1000` | 75 | Total savings reach ₹1,000 |
| `goal-75-percent` | 60 | User reaches 75% of goal target |
| `budget-streak-week` | 60 | User maintains budget for 7 consecutive days |

### ⭐ Medium Tier (30-59 XP)

| Action Name | XP | When to Award |
|------------|-----|---------------|
| `first-login` | 50 | User's first login after signup |
| `complete-budget-month` | 50 | User completes full month within budget |
| `monthly-planning` | 50 | User plans budget for upcoming month |
| `create-emergency-fund` | 50 | User creates emergency fund goal |
| `create-multiple-goals` | 45 | User creates 3+ goals |
| `goal-50-percent` | 40 | User reaches 50% of goal target |
| `create-multiple-budgets` | 40 | User creates 3+ budgets |
| `no-impulse-spending` | 40 | No expenses for 3 consecutive days |
| `expense-consistency` | 40 | User logs expenses 5 days in a row |
| `track-expenses-week` | 35 | User logs expenses for 7 consecutive days |
| `stay-under-budget` | 35 | User stays under budget for the week |
| `complete-profile` | 30 | User completes profile information |
| `create-goal` | 30 | User creates a savings goal |
| `budget-savings` | 30 | User has unspent budget amount (savings) |
| `allocate-budget-savings` | 30 | User allocates expired budget savings to goal |
| `weekly-review` | 30 | User reviews financial summary weekly |
| `analyze-trends` | 30 | User filters and analyzes expense trends |

### 🌟 Low-Medium Tier (20-29 XP)

| Action Name | XP | When to Award |
|------------|-----|---------------|
| `create-budget` | 25 | User creates any budget |
| `save-daily` | 25 | User saves money daily for 7 days |
| `set-budget-limit` | 25 | User sets realistic budget limit |
| `compare-spending` | 25 | User compares spending across categories |
| `add-savings-to-goal` | 20 | User manually adds savings to a goal |
| `create-budget-category` | 20 | User creates category-specific budget |
| `create-budget-overall` | 20 | User creates overall budget |
| `emergency-expense` | 20 | User marks expense as emergency |
| `review-expenses` | 20 | User reviews and filters expenses |
| `explore-dashboard` | 20 | User visits dashboard |

### 🔰 Basic Tier (10-19 XP)

| Action Name | XP | When to Award |
|------------|-----|---------------|
| `add-expense-notes` | 15 | User adds detailed notes to expense |
| `view-leaderboard` | 15 | User checks their rank |
| `budget-update` | 15 | User updates existing budget |
| `add-expense` | 10 | User logs an expense |
| `daily-check-in` | 10 | User logs in daily |

### ⚡ Micro Actions (5-9 XP)

| Action Name | XP | When to Award |
|------------|-----|---------------|
| `add-expense-daily` | 5 | User logs expenses daily (cumulative) |
| `categorize-expense` | 5 | User properly categorizes expense |

---

## 🎯 Priority Implementation Order

### Phase 1: Core Features (Week 1)
1. ✅ `add-expense` (10 XP)
2. ✅ `create-budget` (25 XP)
3. ✅ `create-goal` (30 XP)
4. ✅ `first-login` (50 XP)
5. ✅ `daily-check-in` (10 XP)

### Phase 2: Engagement (Week 2)
6. ✅ `add-savings-to-goal` (20 XP)
7. ✅ `achieve-goal` (100 XP)
8. ✅ `stay-under-budget` (35 XP)
9. ✅ `allocate-budget-savings` (30 XP)
10. ✅ `budget-savings` (30 XP)

### Phase 3: Milestones (Week 3)
11. ✅ `goal-50-percent` (40 XP)
12. ✅ `goal-75-percent` (60 XP)
13. ✅ `savings-milestone-1000` (75 XP)
14. ✅ `track-expenses-week` (35 XP)
15. ✅ `complete-budget-month` (50 XP)

### Phase 4: Advanced (Week 4+)
16. ⏳ `budget-streak-week` (60 XP)
17. ⏳ `expense-consistency` (40 XP)
18. ⏳ `track-expenses-month` (100 XP)
19. ⏳ `budget-streak-month` (200 XP)
20. ⏳ `savings-milestone-5000` (150 XP)

---

## 💻 Integration Code Snippets

### In Expense Controller
```javascript
// After adding expense
await awardXP(userId, 'add-expense');

// If has notes
if (expense.notes) {
  await awardXP(userId, 'add-expense-notes');
}

// If emergency
if (expense.isEmergency) {
  await awardXP(userId, 'emergency-expense');
}
```

### In Budget Controller
```javascript
// After creating budget
await awardXP(userId, 'create-budget');

// If category budget
if (budget.budgetType === 'category') {
  await awardXP(userId, 'create-budget-category');
}

// If overall budget
if (budget.budgetType === 'overall') {
  await awardXP(userId, 'create-budget-overall');
}

// Check for multiple budgets
const budgetCount = await Budget.countDocuments({ user: userId });
if (budgetCount >= 3) {
  await awardXP(userId, 'create-multiple-budgets');
}
```

### In Goals Controller
```javascript
// After creating goal
await awardXP(userId, 'create-goal');

// If emergency fund
if (goal.category === 'Emergency') {
  await awardXP(userId, 'create-emergency-fund');
}

// After adding savings
await awardXP(userId, 'add-savings-to-goal');

// Check progress milestones
if (goal.progress >= 50 && goal.progress < 75) {
  await awardXP(userId, 'goal-50-percent');
} else if (goal.progress >= 75 && !goal.isAchieved) {
  await awardXP(userId, 'goal-75-percent');
} else if (goal.isAchieved) {
  await awardXP(userId, 'achieve-goal');
}

// Check total savings
const totalSavings = await calculateTotalSavings(userId);
if (totalSavings >= 1000) await awardXP(userId, 'savings-milestone-1000');
if (totalSavings >= 5000) await awardXP(userId, 'savings-milestone-5000');
if (totalSavings >= 10000) await awardXP(userId, 'savings-milestone-10000');
```

### In Auth Controller
```javascript
// After first login
if (user.loginCount === 1) {
  await awardXP(userId, 'first-login');
}

// Daily check-in
const lastLogin = user.lastLoginDate;
const today = new Date().setHours(0, 0, 0, 0);
if (new Date(lastLogin).setHours(0, 0, 0, 0) < today) {
  await awardXP(userId, 'daily-check-in');
}
```

---

## 🛠️ Helper Function

```javascript
// utils/awardXP.js
import axios from 'axios';
import Action from '../models/Action.js';

export const awardXP = async (userId, actionName) => {
  try {
    // Get action details
    const action = await Action.findOne({ actionName });
    if (!action) {
      console.warn(`Action not found: ${actionName}`);
      return;
    }

    // Award XP to user
    await axios.post(`http://localhost:5000/api/admin/users/${userId}/add-xp`, {
      xpAmount: action.xpReward
    });

    console.log(`✅ Awarded ${action.xpReward} XP for ${actionName} to user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to award XP for ${actionName}:`, error.message);
  }
};
```

---

## 📦 Quick Setup

### 1. Seed Actions to Database
```bash
node seed-actions.js
```

### 2. Verify Actions Created
```bash
# MongoDB Shell
db.actions.find().pretty()

# Or via API
GET http://localhost:5000/api/admin/actions
```

### 3. Test XP Award
```bash
POST http://localhost:5000/api/admin/users/{userId}/add-xp
{
  "actionName": "add-expense"
}
```

---

## 📊 Expected XP Progression

### Daily Active User
- 1x `daily-check-in`: 10 XP
- 3x `add-expense`: 30 XP
- **Daily Total: ~40 XP**

### Weekly Engaged User
- 7x Daily (280 XP)
- 1x `track-expenses-week`: 35 XP
- 1x `create-budget`: 25 XP
- 1x `create-goal`: 30 XP
- **Weekly Total: ~370 XP**

### Monthly Consistent User
- 30x Daily (1200 XP)
- 4x Weekly bonuses (140 XP)
- 1x `complete-budget-month`: 50 XP
- 1x `achieve-goal`: 100 XP
- 1x `budget-streak-month`: 200 XP
- **Monthly Total: ~1690 XP**

---

## 🎮 Level Design Based on Actions

**Recommended Level Thresholds:**

| Level | XP Required | Achievable Through |
|-------|-------------|-------------------|
| 1 → 2 | 100 XP | 10 daily expenses OR 1 week active use |
| 2 → 3 | 250 XP | 2 weeks active use |
| 3 → 4 | 500 XP | 1 month casual use |
| 4 → 5 | 1000 XP | 1 month consistent use |
| 5 → 6 | 1500 XP | Achieving first goal |
| 6+ | +500 XP each | Long-term engagement |

---

🎯 **Total Available Actions: 43**  
💰 **Total XP Range: 5 - 250 per action**  
🎮 **Total Possible XP: ~3,000+ per month**

**Happy Gamifying! 🚀**
