import mongoose from "mongoose";
import dotenv from "dotenv";
import GameLeaderboard from "../models/GameLeaderboard.js";

dotenv.config();

const fixLeaderboardIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Get collection
    const collection = mongoose.connection.collection('gameleaderboards');
    
    // List current indexes
    console.log("\n📋 Current Indexes:");
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log("  -", idx.name, ":", JSON.stringify(idx.key));
    });
    
    // Drop the old incorrect unique index
    try {
      console.log("\n🗑️  Dropping old index: user_1_gameType_1_period_1");
      await collection.dropIndex("user_1_gameType_1_period_1");
      console.log("✅ Old index dropped");
    } catch (err) {
      if (err.code === 27 || err.message.includes('index not found')) {
        console.log("ℹ️  Index already removed or doesn't exist");
      } else {
        throw err;
      }
    }
    
    // Force MongoDB to recreate indexes from the model
    console.log("\n🔨 Creating new indexes...");
    await GameLeaderboard.syncIndexes();
    console.log("✅ New indexes created");
    
    // List updated indexes
    console.log("\n📋 Updated Indexes:");
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log("  -", idx.name, ":", JSON.stringify(idx.key));
      if (idx.unique) console.log("    (UNIQUE)");
    });
    
    console.log("\n🎉 Index fix complete! Games should work now.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixLeaderboardIndex();
