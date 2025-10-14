import mongoose from "mongoose";

const friendChallengeSchema = new mongoose.Schema(
  {
    challenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    challenged: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    challengeType: {
      type: String,
      required: true,
      enum: [
        "expense_tracking",
        "budget_creation",
        "savings_goal",
        "streak_maintain",
        "daily_challenge_complete",
        "custom"
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    wagerAmount: {
      type: Number,
      required: true,
      min: [1, "Wager amount must be at least 1"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "failed", "expired", "cancelled"],
      default: "pending",
    },
    acceptDeadline: {
      type: Date,
      required: true, // Must accept within 24 hours
    },
    completionDeadline: {
      type: Date,
      required: true, // Challenge completion deadline
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetValue: {
      type: Number, // e.g., number of expenses, days streak, etc.
      default: null,
    },
    currentProgress: {
      type: Number,
      default: 0,
    },
    proofData: {
      type: mongoose.Schema.Types.Mixed, // Can store any completion proof
      default: null,
    },
    // Baseline data stored when challenge is accepted (for verification)
    xpAtStart: {
      type: Number,
      default: null,
    },
    levelAtStart: {
      type: Number,
      default: null,
    },
    friendsCountAtStart: {
      type: Number,
      default: null,
    },
    verificationCriteria: {
      type: mongoose.Schema.Types.Mixed, // Stores the challenge verification requirements
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
friendChallengeSchema.index({ challenger: 1, status: 1 });
friendChallengeSchema.index({ challenged: 1, status: 1 });
friendChallengeSchema.index({ acceptDeadline: 1 });
friendChallengeSchema.index({ completionDeadline: 1 });

const FriendChallenge = mongoose.model("FriendChallenge", friendChallengeSchema);
export default FriendChallenge;
