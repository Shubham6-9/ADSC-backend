import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const giveCoins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Get the most recent user (or specify by email)
    const user = await User.findOne().sort({ createdAt: -1 });
    
    if (!user) {
      console.log("❌ No users found in database");
      process.exit(1);
    }
    
    console.log(`\n📊 Current User: ${user.email}`);
    console.log(`   Level: ${user.level || 0}`);
    console.log(`   Current Coins: ${user.virtualCurrency || 0}`);
    
    // Give 100 coins and ensure level is at least 1
    user.virtualCurrency = (user.virtualCurrency || 0) + 100;
    if (!user.level || user.level < 1) {
      user.level = 1;
    }
    
    await user.save();
    
    console.log(`\n✅ Updated User:`);
    console.log(`   Level: ${user.level}`);
    console.log(`   New Coins: ${user.virtualCurrency}`);
    console.log(`\n🎮 You can now play games!`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

giveCoins();
