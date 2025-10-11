// models/Action.js
import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema({
  actionName: {
    type: String,
    required: [true, "Action name is required"],
    unique: true,
    trim: true,
    minlength: [2, "Action name too short"]
  },
  xpReward: {
    type: Number,
    required: [true, "xpReward is required"],
    min: [0, "xpReward cannot be negative"]
  }
}, { timestamps: true });

// Export model (we use MongoDB _id automatically)
const Action = mongoose.model("Action", ActionSchema);
export default Action;
