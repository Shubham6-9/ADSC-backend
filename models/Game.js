import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
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
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "🎮",
    },
    minEntryFee: {
      type: Number,
      required: true,
      min: 1,
    },
    maxEntryFee: {
      type: Number,
      required: true,
      min: 1,
    },
    defaultEntryFee: {
      type: Number,
      required: true,
      min: 1,
    },
    maxRewardMultiplier: {
      type: Number,
      required: true,
      default: 2,
    },
    houseEdgePercent: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
      max: 50,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dailyPlayLimit: {
      type: Number,
      default: 10,
    },
    cooldownMinutes: {
      type: Number,
      default: 5,
    },
    minimumLevel: {
      type: Number,
      default: 1,
    },
    rules: {
      type: [String],
      default: [],
    },
    gameSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", gameSchema);
export default Game;
