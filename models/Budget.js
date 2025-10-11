// models/Budget.js
import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Username for easy identification
  username: {
    type: String,
    required: true,
    trim: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  // budgetType: only 'overall' or 'category'
  budgetType: {
    type: String,
    enum: ["overall", "category"],
    required: true,
  },

  // only required when budgetType === "category"
  categoryName: {
    type: String,
    required: function () {
      return this.budgetType === "category";
    },
    trim: true,
  },

  budgetAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  // tracked by backend when transactions occur
  spent: {
    type: Number,
    default: 0,
    min: 0,
  },

  // provided by frontend, represents savings for this specific budget
  savings: {
    type: Number,
    default: 0,
    min: 0,
  },

  // start/end required for all budgets
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },

  // renamed from frequency -> budgetDuration
  budgetDuration: {
    type: String,
    enum: ["weekly", "monthly", "yearly", "custom"],
    default: "custom",
  },
}, { timestamps: true });

// Unique index: For "overall" budgets, startDate and endDate must be unique per user
budgetSchema.index(
  { user: 1, budgetType: 1, startDate: 1, endDate: 1, budgetDuration: 1 },
  { 
    unique: true,
    partialFilterExpression: { budgetType: "overall" }
  }
);

// Unique index: For "category" budgets, categoryName must be unique per user per duration
// Same category can't have multiple budgets of same duration (e.g., can't have 2 yearly "groceries")
budgetSchema.index(
  { user: 1, budgetType: 1, categoryName: 1, budgetDuration: 1 },
  { 
    unique: true,
    partialFilterExpression: { budgetType: "category" }
  }
);

export default mongoose.model("Budget", budgetSchema);
