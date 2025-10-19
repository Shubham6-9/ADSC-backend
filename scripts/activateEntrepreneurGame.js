import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../models/Game.js";
import User from "../models/User.js";

dotenv.config();

const activateEntrepreneurGame = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Activate entrepreneur game
    const game = await Game.findOne({ gameType: "entrepreneur" });
    if (game) {
      game.isActive = true;
      await game.save();
      console.log("\n✅ Activated Entrepreneur Simulator!");
      console.log(`   Name: ${game.name}`);
      console.log(`   Required Level: ${game.minimumLevel}`);
      console.log(`   Entry Fee: ${game.minEntryFee}-${game.maxEntryFee} coins`);
      console.log(`   Difficulty: ${game.difficulty}`);
      console.log(`   Turns: ${game.gameSettings.turnsPerGame}`);
    } else {
      console.log("\n❌ Entrepreneur game not found in database");
    }
    
    // Update user level to 10 (required for entrepreneur game)
    const user = await User.findOne().sort({ createdAt: -1 });
    if (user) {
      const oldLevel = user.level;
      user.level = Math.max(user.level || 1, 10);
      await user.save();
      console.log(`\n✅ Updated User: ${user.email}`);
      console.log(`   Level: ${oldLevel} → ${user.level}`);
      console.log(`   Coins: ${user.virtualCurrency}`);
    }
    
    console.log("\n🏗️ Entrepreneur Simulator is now playable!");
    console.log("\n🎉 ALL 5 GAMES ARE NOW ACTIVE!");
    console.log("\n🎮 Complete Game Collection:");
    console.log("   1. ✅ Financial Trivia Showdown (Level 1)");
    console.log("   2. ✅ Financial Escape Room (Level 2)");
    console.log("   3. ✅ Tax Filing Challenge (Level 3)");
    console.log("   4. ✅ Cryptocurrency Mining Game (Level 5)");
    console.log("   5. ✅ Entrepreneur Simulator (Level 10)");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

activateEntrepreneurGame();
