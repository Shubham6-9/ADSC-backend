import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema(
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
    entryFee: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned", "expired"],
      default: "in_progress",
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    gameData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
gameSessionSchema.index({ user: 1, gameType: 1, createdAt: -1 });
gameSessionSchema.index({ status: 1, createdAt: -1 });
gameSessionSchema.index({ user: 1, status: 1 });

const GameSession = mongoose.model("GameSession", gameSessionSchema);
export default GameSession;
