import mongoose from "mongoose";

const gameLeaderboardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameType: {
      type: String,
      required: true,
      enum: [
        "trivia",
        "crypto_mining",
        "entrepreneur",
        "tax_simulator",
        "escape_room"
      ],
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "all_time"],
      required: true,
    },
    periodDate: {
      type: Date,
      required: true,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    totalGamesPlayed: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
    totalCoinsWon: {
      type: Number,
      default: 0,
    },
    totalCoinsLost: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    fastestCompletionSeconds: {
      type: Number,
      default: null,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound indexes for leaderboard queries
gameLeaderboardSchema.index({ gameType: 1, period: 1, highestScore: -1 });
gameLeaderboardSchema.index({ gameType: 1, period: 1, netProfit: -1 });
gameLeaderboardSchema.index({ user: 1, gameType: 1, period: 1 }, { unique: true });
gameLeaderboardSchema.index({ period: 1, periodDate: 1 });

const GameLeaderboard = mongoose.model("GameLeaderboard", gameLeaderboardSchema);
export default GameLeaderboard;
