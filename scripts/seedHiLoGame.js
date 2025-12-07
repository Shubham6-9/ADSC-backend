import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../models/Game.js";

dotenv.config();

const seedHiLoGame = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");

        // Check if Hi-Lo game already exists
        const existingGame = await Game.findOne({ gameType: "hi_lo" });

        if (existingGame) {
            console.log("⚠️  Hi-Lo game already exists. Updating...");

            existingGame.name = "Hi-Lo Card Game";
            existingGame.description = "Guess if the next card is higher, lower, or same! Multipliers increase with consecutive wins. Cash out anytime!";
            existingGame.icon = "🎴";
            existingGame.minEntryFee = 20;
            existingGame.maxEntryFee = 999999; // No maximum (limited by user balance)
            existingGame.defaultEntryFee = 50;
            existingGame.maxRewardMultiplier = 10;
            existingGame.houseEdgePercent = 0; // No house edge
            existingGame.difficulty = "medium";
            existingGame.isActive = true;
            existingGame.dailyPlayLimit = 999; // No daily limit
            existingGame.cooldownMinutes = 0; // No cooldown
            existingGame.minimumLevel = 1;
            existingGame.rules = [
                "Wager coins to start playing (minimum 20 coins)",
                "Guess if the next card will be higher, lower, or same rank",
                "Correct guesses multiply your winnings",
                "Consecutive correct answers increase the multiplier (1.05x → 1.10x → 1.20x...)",
                "Skip cards to reset multiplier but keep current winnings",
                "Cash out anytime to keep your winnings",
                "Wrong guess loses all wagered coins",
                "Leaving mid-game loses your wagered coins",
            ];
            existingGame.gameSettings = {
                maxScore: 100,
                baseMultiplier: 1.05,
                deckSize: 52,
            };

            await existingGame.save();
            console.log("✅ Hi-Lo game updated successfully!");
        } else {
            const hiLoGame = await Game.create({
                gameType: "hi_lo",
                name: "Hi-Lo Card Game",
                description: "Guess if the next card is higher, lower, or same! Multipliers increase with consecutive wins. Cash out anytime!",
                icon: "🎴",
                minEntryFee: 20,
                maxEntryFee: 999999, // No maximum (limited by user balance)
                defaultEntryFee: 50,
                maxRewardMultiplier: 10,
                houseEdgePercent: 0, // No house edge
                difficulty: "medium",
                isActive: true,
                dailyPlayLimit: 999, // No daily limit
                cooldownMinutes: 0, // No cooldown
                minimumLevel: 1,
                rules: [
                    "Wager coins to start playing (minimum 20 coins)",
                    "Guess if the next card will be higher, lower, or same rank",
                    "Correct guesses multiply your winnings",
                    "Consecutive correct answers increase the multiplier (1.05x → 1.10x → 1.20x...)",
                    "Skip cards to reset multiplier but keep current winnings",
                    "Cash out anytime to keep your winnings",
                    "Wrong guess loses all wagered coins",
                    "Leaving mid-game loses your wagered coins",
                ],
                gameSettings: {
                    maxScore: 100,
                    baseMultiplier: 1.05,
                    deckSize: 52,
                },
            });

            console.log("✅ Hi-Lo game created successfully!");
            console.log(hiLoGame);
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding Hi-Lo game:", err);
        process.exit(1);
    }
};

seedHiLoGame();
