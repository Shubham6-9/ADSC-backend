import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: [true, "User name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    password: {
      type: String,
      required: [true, "Password is required "],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      trim: true,
      uppercase: true,
    },
    currencySymbol: {
      type: String,
      required: [true, "Currency symbol is required"],
      trim: true,
    },

    // ---------- Gamification fields ----------
    level: {
      type: Number,
      default: 1,
      min: [1, "Level must be at least 1"],
    },
    xp: {
      type: Number,
      default: 0,
      min: [0, "XP cannot be negative"],
    },
    xpForNextLevel: {
      type: Number,
      default: 100, // fallback default; will be overridden at signup from admin setting
      min: [1, "xpForNextLevel must be at least 1"],
    },
    
    // ---------- Streak fields ----------
    currentStreak: {
      type: Number,
      default: 0,
      min: [0, "Streak cannot be negative"],
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: [0, "Longest streak cannot be negative"],
    },
    lastExpenseDate: {
      type: Date,
      default: null,
    },
    streakGraceUsed: {
      type: Boolean,
      default: false, // true if grace period (1 day) was used
    },
    
    // inside your User schema definition, add:
    completedChallenges: [
      {
        challenge: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Challenge",
          required: true,
        },
        completedAt: {
          type: Date,
          default: () => new Date(),
        },
        xpReward: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    
    // ---------- Virtual Currency ----------
    virtualCurrency: {
      type: Number,
      default: 0,
      min: [0, "Virtual currency cannot be negative"],
    },
    
    // ---------- Friends fields ----------
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequestsSent: [
      {
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        sentAt: {
          type: Date,
          default: () => new Date(),
        },
      },
    ],
    friendRequestsReceived: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        receivedAt: {
          type: Date,
          default: () => new Date(),
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
