import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../models/Game.js";
import User from "../models/User.js";

dotenv.config();

const activateEscapeRoom = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Activate escape room game
    const game = await Game.findOne({ gameType: "escape_room" });
    if (game) {
      game.isActive = true;
      await game.save();
      console.log("\n✅ Activated Financial Escape Room!");
      console.log(`   Name: ${game.name}`);
      console.log(`   Required Level: ${game.minimumLevel}`);
      console.log(`   Entry Fee: ${game.minEntryFee}-${game.maxEntryFee} coins`);
      console.log(`   Puzzles: ${game.gameSettings.roomsPerGame} rooms`);
      console.log(`   Time Limit: ${game.gameSettings.timeLimit / 60} minutes`);
    } else {
      console.log("\n❌ Escape room game not found in database");
    }
    
    // Update user level to 2 (required for escape room)
    const user = await User.findOne().sort({ createdAt: -1 });
    if (user) {
      const oldLevel = user.level;
      user.level = Math.max(user.level || 1, 2);
      await user.save();
      console.log(`\n✅ Updated User: ${user.email}`);
      console.log(`   Level: ${oldLevel} → ${user.level}`);
      console.log(`   Coins: ${user.virtualCurrency}`);
    }
    
    console.log("\n🚪 Financial Escape Room is now playable!");
    console.log("\n🎮 Available Games:");
    console.log("   1. ✅ Financial Trivia Showdown (Level 1)");
    console.log("   2. ✅ Cryptocurrency Mining Game (Level 5)");
    console.log("   3. ✅ Financial Escape Room (Level 2)");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

activateEscapeRoom();
