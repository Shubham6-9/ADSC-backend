import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../models/Game.js";
import TriviaQuestion from "../models/TriviaQuestion.js";

dotenv.config();

const verifyDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const games = await Game.find({});
    const questions = await TriviaQuestion.find({});

    console.log(`\n📊 Database Status:`);
    console.log(`   Games: ${games.length}`);
    console.log(`   Trivia Questions: ${questions.length}\n`);

    if (games.length === 0 || questions.length === 0) {
      console.log("❌ Database not seeded!");
      console.log("   Run: node scripts/seedGames.js\n");
    } else {
      console.log("✅ Database is seeded and ready!\n");
      console.log("Active Games:");
      games.forEach(game => {
        console.log(`   - ${game.name} (${game.gameType}): ${game.isActive ? '✅ Active' : '🔒 Inactive'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

verifyDatabase();
