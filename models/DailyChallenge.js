// models/DailyChallenge.js
import mongoose from "mongoose";

const DailyChallengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  challengeType: {
    type: String,
    required: true,
    enum: [
      'add-expense',
      'add-expense-with-notes',
      'stay-under-budget',
      'check-streak',
      'create-budget',
      'create-goal',
      'add-multiple-expenses',
      'track-daily',
      'save-money'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  xpReward: {
    type: Number,
    required: true,
    min: 0
  },
  targetValue: {
    type: Number,
    default: 1 // e.g., add 3 expenses, save $50, etc.
  },
  currentProgress: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Compound index for efficient queries
DailyChallengeSchema.index({ user: 1, date: 1 });
DailyChallengeSchema.index({ user: 1, isCompleted: 1 });

const DailyChallenge = mongoose.model("DailyChallenge", DailyChallengeSchema);
export default DailyChallenge;
