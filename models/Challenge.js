// models/Challenge.js
import mongoose from "mongoose";

const ChallengeSchema = new mongoose.Schema({
  challengeName: {
    type: String,
    required: [true, "challengeName is required"],
    unique: true,
    trim: true,
    minlength: [2, "challengeName too short"]
  },
  challengeDescription: {
    type: String,
    default: ""
  },
  xpReward: {
    type: Number,
    required: [true, "xpReward is required"],
    min: [0, "xpReward cannot be negative"]
  }
}, { timestamps: true });

const Challenge = mongoose.model("Challenge", ChallengeSchema);
export default Challenge;
