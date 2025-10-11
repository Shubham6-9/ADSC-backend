// seed-levels.js
// Run this script to populate the database with gamification levels
// Usage: node seed-levels.js

import mongoose from 'mongoose';
import LevelConfig from './models/LevelConfig.js';
import dotenv from 'dotenv';

dotenv.config();

const levels = [
  // Early Levels (1-5) - Learning Phase
  { 
    level: 1, 
    levelName: "Savings Newbie", 
    xpRequired: 0, 
    levelBadge: "🌱", 
    levelReward: "Welcome Bonus" 
  },
  { 
    level: 2, 
    levelName: "Budget Beginner", 
    xpRequired: 100, 
    levelBadge: "🔰", 
    levelReward: "+5% savings bonus" 
  },
  { 
    level: 3, 
    levelName: "Money Tracker", 
    xpRequired: 250, 
    levelBadge: "📊", 
    levelReward: "Unlock expense trends" 
  },
  { 
    level: 4, 
    levelName: "Smart Saver", 
    xpRequired: 500, 
    levelBadge: "💰", 
    levelReward: "+10% savings bonus" 
  },
  { 
    level: 5, 
    levelName: "Goal Setter", 
    xpRequired: 1000, 
    levelBadge: "🎯", 
    levelReward: "Unlock advanced goals" 
  },
  
  // Mid Levels (6-10) - Growth Phase
  { 
    level: 6, 
    levelName: "Budget Master", 
    xpRequired: 1500, 
    levelBadge: "🏅", 
    levelReward: "Premium budget templates" 
  },
  { 
    level: 7, 
    levelName: "Financial Warrior", 
    xpRequired: 2500, 
    levelBadge: "⚔️", 
    levelReward: "+15% savings bonus" 
  },
  { 
    level: 8, 
    levelName: "Savings Champion", 
    xpRequired: 4000, 
    levelBadge: "🏆", 
    levelReward: "Unlock investment tips" 
  },
  { 
    level: 9, 
    levelName: "Money Mentor", 
    xpRequired: 6000, 
    levelBadge: "🎓", 
    levelReward: "Unlock mentorship" 
  },
  { 
    level: 10, 
    levelName: "Financial Guru", 
    xpRequired: 8500, 
    levelBadge: "🧙", 
    levelReward: "+20% savings bonus" 
  },
  
  // Advanced Levels (11-15) - Mastery Phase
  { 
    level: 11, 
    levelName: "Wealth Builder", 
    xpRequired: 11500, 
    levelBadge: "🏗️", 
    levelReward: "Premium reports" 
  },
  { 
    level: 12, 
    levelName: "Investment Sage", 
    xpRequired: 15000, 
    levelBadge: "💎", 
    levelReward: "Advanced analytics" 
  },
  { 
    level: 13, 
    levelName: "Budget Legend", 
    xpRequired: 19000, 
    levelBadge: "🌟", 
    levelReward: "+25% savings bonus" 
  },
  { 
    level: 14, 
    levelName: "Financial Elite", 
    xpRequired: 24000, 
    levelBadge: "👑", 
    levelReward: "VIP features" 
  },
  { 
    level: 15, 
    levelName: "Money Maestro", 
    xpRequired: 30000, 
    levelBadge: "🎭", 
    levelReward: "Custom themes" 
  },
  
  // Elite Levels (16-20) - Legend Phase
  { 
    level: 16, 
    levelName: "Savings Titan", 
    xpRequired: 37000, 
    levelBadge: "🗿", 
    levelReward: "+30% savings bonus" 
  },
  { 
    level: 17, 
    levelName: "Wealth Wizard", 
    xpRequired: 45000, 
    levelBadge: "🔮", 
    levelReward: "Predictive insights" 
  },
  { 
    level: 18, 
    levelName: "Financial Oracle", 
    xpRequired: 54000, 
    levelBadge: "🔱", 
    levelReward: "AI-powered advice" 
  },
  { 
    level: 19, 
    levelName: "Budget Emperor", 
    xpRequired: 64000, 
    levelBadge: "🏛️", 
    levelReward: "+35% savings bonus" 
  },
  { 
    level: 20, 
    levelName: "Money God", 
    xpRequired: 75000, 
    levelBadge: "⚡", 
    levelReward: "All features unlocked" 
  }
];

async function seedLevels() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gamified-budget';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    let created = 0;
    let updated = 0;
    let failed = 0;
    
    // Insert/Update levels
    for (const levelData of levels) {
      try {
        const existing = await LevelConfig.findOne({ level: levelData.level });
        
        if (existing) {
          // Check if any field changed
          const hasChanges = 
            existing.levelName !== levelData.levelName ||
            existing.xpRequired !== levelData.xpRequired ||
            existing.levelBadge !== levelData.levelBadge ||
            existing.levelReward !== levelData.levelReward;
          
          if (hasChanges) {
            await LevelConfig.findOneAndUpdate(
              { level: levelData.level },
              { 
                $set: { 
                  levelName: levelData.levelName,
                  xpRequired: levelData.xpRequired,
                  levelBadge: levelData.levelBadge,
                  levelReward: levelData.levelReward
                } 
              }
            );
            console.log(`🔄 Updated: Level ${levelData.level} - ${levelData.levelName} (${levelData.xpRequired} XP)`);
            updated++;
          } else {
            console.log(`⏭️  Skipped: Level ${levelData.level} - ${levelData.levelName} (no changes)`);
          }
        } else {
          await LevelConfig.create(levelData);
          console.log(`✅ Created: Level ${levelData.level} - ${levelData.levelName} (${levelData.xpRequired} XP) ${levelData.levelBadge}`);
          created++;
        }
      } catch (err) {
        console.error(`❌ Failed: Level ${levelData.level} - ${err.message}`);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 Level Seeding Complete!');
    console.log('='.repeat(70));
    console.log(`✅ Created: ${created} levels`);
    console.log(`🔄 Updated: ${updated} levels`);
    console.log(`⏭️  Skipped: ${levels.length - created - updated - failed} levels`);
    console.log(`❌ Failed: ${failed} levels`);
    console.log(`📊 Total Levels: ${await LevelConfig.countDocuments()}`);
    console.log('='.repeat(70) + '\n');
    
    // Display all levels in a nice table
    const allLevels = await LevelConfig.find().sort({ level: 1 });
    console.log('📋 All Levels in Database:');
    console.log('='.repeat(70));
    console.log('Level | Name                  | XP Required | Badge | Reward');
    console.log('-'.repeat(70));
    allLevels.forEach((level) => {
      const lvl = String(level.level).padEnd(5);
      const name = level.levelName.padEnd(21);
      const xp = String(level.xpRequired).padEnd(11);
      const badge = level.levelBadge.padEnd(5);
      const reward = level.levelReward.substring(0, 30);
      console.log(`${lvl} | ${name} | ${xp} | ${badge} | ${reward}`);
    });
    console.log('='.repeat(70));
    
    // Show progression milestones
    console.log('\n🎯 Key Milestones:');
    console.log('='.repeat(70));
    console.log(`Level 1 → 5:   0 → ${allLevels[4]?.xpRequired || 1000} XP (Learning Phase)`);
    console.log(`Level 6 → 10:  ${allLevels[5]?.xpRequired || 1500} → ${allLevels[9]?.xpRequired || 8500} XP (Growth Phase)`);
    console.log(`Level 11 → 15: ${allLevels[10]?.xpRequired || 11500} → ${allLevels[14]?.xpRequired || 30000} XP (Mastery Phase)`);
    console.log(`Level 16 → 20: ${allLevels[15]?.xpRequired || 37000} → ${allLevels[19]?.xpRequired || 75000} XP (Legend Phase)`);
    console.log('='.repeat(70));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding levels:', error);
    process.exit(1);
  }
}

// Run the seed function
seedLevels();
