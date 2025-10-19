import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../models/Game.js";
import User from "../models/User.js";

dotenv.config();

const activateCryptoGame = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Activate crypto mining game
    const game = await Game.findOne({ gameType: "crypto_mining" });
    if (game) {
      game.isActive = true;
      await game.save();
      console.log("\n✅ Activated Cryptocurrency Mining Game!");
      console.log(`   Name: ${game.name}`);
      console.log(`   Required Level: ${game.minimumLevel}`);
      console.log(`   Entry Fee: ${game.minEntryFee}-${game.maxEntryFee} coins`);
    } else {
      console.log("\n❌ Crypto mining game not found in database");
    }
    
    // Give user level 5
    const user = await User.findOne().sort({ createdAt: -1 });
    if (user) {
      const oldLevel = user.level;
      user.level = Math.max(user.level || 1, 5);
      await user.save();
      console.log(`\n✅ Updated User: ${user.email}`);
      console.log(`   Level: ${oldLevel} → ${user.level}`);
      console.log(`   Coins: ${user.virtualCurrency}`);
    }
    
    console.log("\n🎮 Crypto Mining Game is now playable!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

activateCryptoGame();
