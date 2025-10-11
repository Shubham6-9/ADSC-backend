// seed-actions.js
// Run this script to populate the database with gamification actions
// Usage: node seed-actions.js

import mongoose from 'mongoose';
import Action from './models/Action.js';
import dotenv from 'dotenv';

dotenv.config();

const actions = [
  // Core Actions (Priority 1)
  { actionName: 'add-expense', xpReward: 10 },
  { actionName: 'create-budget', xpReward: 25 },
  { actionName: 'create-goal', xpReward: 30 },
  { actionName: 'add-savings-to-goal', xpReward: 20 },
  { actionName: 'achieve-goal', xpReward: 100 },
  { actionName: 'first-login', xpReward: 50 },
  { actionName: 'daily-check-in', xpReward: 10 },
  { actionName: 'stay-under-budget', xpReward: 35 },
  
  // Budget Actions
  { actionName: 'create-budget-category', xpReward: 20 },
  { actionName: 'create-budget-overall', xpReward: 20 },
  { actionName: 'complete-budget-month', xpReward: 50 },
  { actionName: 'budget-savings', xpReward: 30 },
  { actionName: 'create-multiple-budgets', xpReward: 40 },
  { actionName: 'allocate-budget-savings', xpReward: 30 },
  { actionName: 'budget-update', xpReward: 15 },
  { actionName: 'budget-streak-week', xpReward: 60 },
  { actionName: 'budget-streak-month', xpReward: 200 },
  
  // Expense Actions
  { actionName: 'add-expense-daily', xpReward: 5 },
  { actionName: 'add-expense-notes', xpReward: 15 },
  { actionName: 'categorize-expense', xpReward: 5 },
  { actionName: 'emergency-expense', xpReward: 20 },
  { actionName: 'track-expenses-week', xpReward: 35 },
  { actionName: 'track-expenses-month', xpReward: 100 },
  { actionName: 'expense-consistency', xpReward: 40 },
  { actionName: 'review-expenses', xpReward: 20 },
  
  // Goal Actions
  { actionName: 'create-emergency-fund', xpReward: 50 },
  { actionName: 'goal-50-percent', xpReward: 40 },
  { actionName: 'goal-75-percent', xpReward: 60 },
  { actionName: 'create-multiple-goals', xpReward: 45 },
  
  // Milestone Actions
  { actionName: 'complete-profile', xpReward: 30 },
  { actionName: 'savings-milestone-1000', xpReward: 75 },
  { actionName: 'savings-milestone-5000', xpReward: 150 },
  { actionName: 'savings-milestone-10000', xpReward: 250 },
  
  // Consistency Actions
  { actionName: 'weekly-review', xpReward: 30 },
  { actionName: 'monthly-planning', xpReward: 50 },
  { actionName: 'save-daily', xpReward: 25 },
  { actionName: 'no-impulse-spending', xpReward: 40 },
  { actionName: 'set-budget-limit', xpReward: 25 },
  
  // Learning Actions
  { actionName: 'explore-dashboard', xpReward: 20 },
  { actionName: 'view-leaderboard', xpReward: 15 },
  { actionName: 'compare-spending', xpReward: 25 },
  { actionName: 'analyze-trends', xpReward: 30 },
];

async function seedActions() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gamified-budget';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    let created = 0;
    let updated = 0;
    let failed = 0;
    
    // Insert/Update actions
    for (const action of actions) {
      try {
        const existing = await Action.findOne({ actionName: action.actionName });
        
        if (existing) {
          if (existing.xpReward !== action.xpReward) {
            await Action.findOneAndUpdate(
              { actionName: action.actionName },
              { $set: { xpReward: action.xpReward } }
            );
            console.log(`🔄 Updated: ${action.actionName} (${existing.xpReward} → ${action.xpReward} XP)`);
            updated++;
          } else {
            console.log(`⏭️  Skipped: ${action.actionName} (already exists with ${action.xpReward} XP)`);
          }
        } else {
          await Action.create(action);
          console.log(`✅ Created: ${action.actionName} (${action.xpReward} XP)`);
          created++;
        }
      } catch (err) {
        console.error(`❌ Failed: ${action.actionName} - ${err.message}`);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Seeding Complete!');
    console.log('='.repeat(50));
    console.log(`✅ Created: ${created} actions`);
    console.log(`🔄 Updated: ${updated} actions`);
    console.log(`⏭️  Skipped: ${actions.length - created - updated - failed} actions`);
    console.log(`❌ Failed: ${failed} actions`);
    console.log(`📊 Total Actions: ${await Action.countDocuments()}`);
    console.log('='.repeat(50) + '\n');
    
    // Display all actions
    const allActions = await Action.find().sort({ xpReward: -1 });
    console.log('📋 All Actions in Database:');
    console.log('='.repeat(50));
    allActions.forEach((action, index) => {
      console.log(`${index + 1}. ${action.actionName.padEnd(30)} - ${action.xpReward} XP`);
    });
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding actions:', error);
    process.exit(1);
  }
}

// Run the seed function
seedActions();
