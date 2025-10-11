// models/TotalSavings.js
import mongoose from "mongoose";

const totalSavingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  totalSaved: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model("TotalSavings", totalSavingsSchema);
