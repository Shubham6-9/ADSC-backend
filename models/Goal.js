// models/Goal.js
import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  // This will be set by backend from req.user.username. Frontend MUST NOT provide.
  username: { type: String, required: true, trim: true },

  title: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },

  // target total for the goal
  targetAmount: { type: Number, required: true, min: 0 },

  // amount currently saved toward the goal (backend-updated via contributions)
  savedAmount: { type: Number, default: 0, min: 0 },

  // progress is percentage 0-100 computed from savedAmount / targetAmount (kept in sync)
  progress: { type: Number, default: 0, min: 0, max: 100 },

  // optional target date
  targetDate: { type: Date },

  // simple priority
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },

  category: { type: String, default: "General", trim: true },

  // mark completed
  isAchieved: { type: Boolean, default: false },
}, { timestamps: true });

// keep progress and isAchieved consistent before save
goalSchema.pre("save", function (next) {
  try {
    // avoid division by zero
    if (!this.targetAmount || this.targetAmount === 0) {
      this.progress = 0;
    } else {
      const pct = (Number(this.savedAmount || 0) / Number(this.targetAmount)) * 100;
      this.progress = Math.min(100, Math.max(0, Math.round(pct * 100) / 100)); // store up to 2 decimals
    }
    this.isAchieved = (Number(this.savedAmount || 0) >= Number(this.targetAmount || 0)) && (this.targetAmount > 0);
    next();
  } catch (err) {
    next(err);
  }
});

goalSchema.index({ user: 1, isAchieved: 1 });
goalSchema.index({ user: 1, category: 1, priority: 1 });

export default mongoose.model("Goal", goalSchema);
