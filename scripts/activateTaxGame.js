import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../models/Game.js";
import User from "../models/User.js";

dotenv.config();

const activateTaxGame = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Activate tax simulator game
    const game = await Game.findOne({ gameType: "tax_simulator" });
    if (game) {
      game.isActive = true;
      await game.save();
      console.log("\n✅ Activated Tax Filing Challenge!");
      console.log(`   Name: ${game.name}`);
      console.log(`   Required Level: ${game.minimumLevel}`);
      console.log(`   Entry Fee: ${game.minEntryFee}-${game.maxEntryFee} coins`);
      console.log(`   Difficulty: ${game.difficulty}`);
    } else {
      console.log("\n❌ Tax simulator game not found in database");
    }
    
    // Update user level to 3 (required for tax game)
    const user = await User.findOne().sort({ createdAt: -1 });
    if (user) {
      const oldLevel = user.level;
      user.level = Math.max(user.level || 1, 3);
      await user.save();
      console.log(`\n✅ Updated User: ${user.email}`);
      console.log(`   Level: ${oldLevel} → ${user.level}`);
      console.log(`   Coins: ${user.virtualCurrency}`);
    }
    
    console.log("\n📋 Tax Filing Challenge is now playable!");
    console.log("\n🎮 Available Games:");
    console.log("   1. ✅ Financial Trivia Showdown (Level 1)");
    console.log("   2. ✅ Financial Escape Room (Level 2)");
    console.log("   3. ✅ Tax Filing Challenge (Level 3)");
    console.log("   4. ✅ Cryptocurrency Mining Game (Level 5)");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

activateTaxGame();
