# 🎮 Actions & XP Rewards System

Complete list of gamified actions and their XP rewards for the budgeting app.

---

## 📊 Actions Overview

### Budget Management Actions

| Action Name | XP Reward | Description |
|------------|-----------|-------------|
| `create-budget` | 25 XP | User creates their first budget |
| `create-budget-category` | 20 XP | User creates a category-specific budget |
| `create-budget-overall` | 20 XP | User creates an overall budget |
| `complete-budget-month` | 50 XP | User completes a full month staying within budget |
| `budget-savings` | 30 XP | User saves money from a budget (unspent amount) |
| `create-multiple-budgets` | 40 XP | User creates 3 or more budgets |

### Expense Tracking Actions

| Action Name | XP Reward | Description |
|------------|-----------|-------------|
| `add-expense` | 10 XP | User logs an expense |
| `add-expense-daily` | 5 XP | User logs an expense for 7 consecutive days |
| `add-expense-notes` | 15 XP | User adds detailed notes to an expense |
| `categorize-expense` | 5 XP | User properly categorizes an expense |
| `emergency-expense` | 20 XP | User correctly marks an emergency expense |
| `track-expenses-week` | 35 XP | User tracks expenses for 7 consecutive days |
| `track-expenses-month` | 100 XP | User tracks expenses for 30 consecutive days |

### Goal Setting Actions

| Action Name | XP Reward | Description |
|------------|-----------|-------------|
| `create-goal` | 30 XP | User creates a savings goal |
| `add-savings-to-goal` | 20 XP | User manually adds savings to a goal |
| `achieve-goal` | 100 XP | User achieves/completes a savings goal |
| `create-emergency-fund` | 50 XP | User creates an emergency fund goal |
| `goal-50-percent` | 40 XP | User reaches 50% of a goal |
| `goal-75-percent` | 60 XP | User reaches 75% of a goal |
| `create-multiple-goals` | 45 XP | User creates 3 or more goals |

### Financial Discipline Actions

| Action Name | XP Reward | Description |
|------------|-----------|-------------|
| `stay-under-budget` | 35 XP | User stays under budget for the week |
| `no-impulse-spending` | 40 XP | User has no expenses for 3 consecutive days |
| `save-daily` | 25 XP | User saves money daily for 7 days |
| `review-expenses` | 20 XP | User reviews and filters expenses |
| `set-budget-limit` | 25 XP | User sets a realistic budget limit |
| `allocate-budget-savings` | 30 XP | User allocates expired budget savings to a goal |

### Milestone Actions

| Action Name | XP Reward | Description |
|------------|-----------|-------------|
| `first-login` | 50 XP | User completes first login after signup |
| `complete-profile` | 30 XP | User completes their profile information |
| `savings-milestone-1000` | 75 XP | User saves ₹1,000 total across all goals |
| `savings-milestone-5000` | 150 XP | User saves ₹5,000 total across all goals |
| `savings-milestone-10000` | 250 XP | User saves ₹10,000 total across all goals |
| `budget-streak-week` | 60 XP | User maintains budget for 7 consecutive days |
| `budget-streak-month` | 200 XP | User maintains budget for 30 consecutive days |

### Consistency Actions

| Action Name | XP Reward | Description |
|------------|-----------|-------------|
| `daily-check-in` | 10 XP | User logs in daily |
| `weekly-review` | 30 XP | User reviews their financial summary weekly |
| `monthly-planning` | 50 XP | User plans budget for upcoming month |
| `expense-consistency` | 40 XP | User logs expenses 5 days in a row |
| `budget-update` | 15 XP | User updates an existing budget |

### Learning & Growth Actions

| Action Name | XP Reward | Description |
|------------|-----------|-------------|
| `explore-dashboard` | 20 XP | User visits dashboard |
| `view-leaderboard` | 15 XP | User checks their rank on leaderboard |
| `compare-spending` | 25 XP | User compares spending across categories |
| `analyze-trends` | 30 XP | User filters and analyzes expense trends |

---

## 🎯 XP Tiers

### Low Tier (5-15 XP)
- Basic daily actions
- Simple tracking activities
- Exploratory actions

### Medium Tier (20-50 XP)
- Goal creation
- Budget management
- Consistent behavior over days

### High Tier (60-100 XP)
- Weekly streaks
- Goal achievements
- Major milestones

### Legendary Tier (100+ XP)
- Monthly achievements
- Major financial milestones
- Exceptional discipline

---

## 🔄 How to Seed Actions

### Method 1: Manual via Postman

```http
POST http://localhost:5000/api/admin/actions
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "actionName": "add-expense",
  "xpReward": 10
}
```

### Method 2: Bulk Seed Script

Create a file `seed-actions.js` in your backend:

```javascript
import mongoose from 'mongoose';
import Action from './models/Action.js';

const actions = [
  { actionName: 'add-expense', xpReward: 10 },
  { actionName: 'create-budget', xpReward: 25 },
  { actionName: 'create-goal', xpReward: 30 },
  { actionName: 'achieve-goal', xpReward: 100 },
  { actionName: 'add-savings-to-goal', xpReward: 20 },
  { actionName: 'complete-budget-month', xpReward: 50 },
  { actionName: 'track-expenses-week', xpReward: 35 },
  { actionName: 'budget-savings', xpReward: 30 },
  { actionName: 'stay-under-budget', xpReward: 35 },
  { actionName: 'first-login', xpReward: 50 },
  { actionName: 'daily-check-in', xpReward: 10 },
  { actionName: 'weekly-review', xpReward: 30 },
  { actionName: 'savings-milestone-1000', xpReward: 75 },
  { actionName: 'savings-milestone-5000', xpReward: 150 },
  { actionName: 'goal-50-percent', xpReward: 40 },
  { actionName: 'goal-75-percent', xpReward: 60 },
  { actionName: 'allocate-budget-savings', xpReward: 30 },
  { actionName: 'emergency-expense', xpReward: 20 },
  { actionName: 'expense-consistency', xpReward: 40 },
  { actionName: 'create-multiple-budgets', xpReward: 40 },
  { actionName: 'create-multiple-goals', xpReward: 45 },
];

async function seedActions() {
  try {
    await mongoose.connect('YOUR_MONGODB_URI');
    
    // Clear existing actions (optional)
    // await Action.deleteMany({});
    
    // Insert actions
    for (const action of actions) {
      await Action.findOneAndUpdate(
        { actionName: action.actionName },
        { $set: { xpReward: action.xpReward } },
        { upsert: true, new: true }
      );
      console.log(`✅ Created/Updated: ${action.actionName} (${action.xpReward} XP)`);
    }
    
    console.log('🎉 All actions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding actions:', error);
    process.exit(1);
  }
}

seedActions();
```

**Run the seed script:**
```bash
node seed-actions.js
```

---

## 📝 Integration Guide

### When to Award XP

#### In Expense Controller
```javascript
// After successfully adding expense
await axios.post('/api/admin/users/:userId/add-xp', {
  actionName: 'add-expense'
});
```

#### In Budget Controller
```javascript
// After creating budget
await axios.post('/api/admin/users/:userId/add-xp', {
  actionName: 'create-budget'
});
```

#### In Goals Controller
```javascript
// After achieving goal
if (goal.isAchieved) {
  await axios.post('/api/admin/users/:userId/add-xp', {
    actionName: 'achieve-goal'
  });
}

// After adding savings
await axios.post('/api/admin/users/:userId/add-xp', {
  actionName: 'add-savings-to-goal'
});
```

---

## 🎮 Recommended Priority Actions (Start with these)

### Essential Core Actions (Implement First)
1. `add-expense` - 10 XP
2. `create-budget` - 25 XP
3. `create-goal` - 30 XP
4. `add-savings-to-goal` - 20 XP
5. `achieve-goal` - 100 XP
6. `first-login` - 50 XP
7. `daily-check-in` - 10 XP
8. `stay-under-budget` - 35 XP

### Secondary Actions (Implement After Core)
9. `track-expenses-week` - 35 XP
10. `complete-budget-month` - 50 XP
11. `budget-savings` - 30 XP
12. `allocate-budget-savings` - 30 XP
13. `goal-50-percent` - 40 XP
14. `savings-milestone-1000` - 75 XP

### Advanced Actions (Future Enhancement)
15. `budget-streak-month` - 200 XP
16. `track-expenses-month` - 100 XP
17. `savings-milestone-10000` - 250 XP

---

## 💡 Tips for Balance

- **Daily Actions**: 5-15 XP (encourage frequent engagement)
- **Weekly Goals**: 30-50 XP (reward consistency)
- **Monthly Achievements**: 50-100 XP (major milestones)
- **One-time Milestones**: 100+ XP (exceptional achievements)

**Level Design Recommendation:**
- Level 1→2: 100 XP (10 daily actions)
- Level 2→3: 250 XP 
- Level 3→4: 500 XP
- Level 4→5: 1000 XP
- Each subsequent level: +500 XP

---

## 🔍 Monitoring Actions

### Get All Actions
```http
GET /api/admin/actions
```

### Check Specific Action
```http
GET /api/admin/actions/:id
```

### Update Action Reward
```http
PATCH /api/admin/actions/:id
Content-Type: application/json

{
  "xpReward": 15
}
```

---

## 📊 Analytics to Track

1. **Most Triggered Actions** - Which actions users perform most
2. **Average XP per User** - Overall engagement level
3. **Action Completion Rate** - % of users completing each action
4. **Time to Level Up** - Average time users take to level up
5. **Popular Goal Types** - Which goals users create most

---

## 🎯 Future Action Ideas

- Social actions (compare with friends)
- Challenge completion actions
- Seasonal/holiday saving actions
- Investment tracking actions
- Debt reduction actions
- Financial education completion actions

🎮 **Happy Gamifying!**
