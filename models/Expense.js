// models/Expense.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: Date, required: true, index: true },
  category: { type: String, required: true, trim: true, index: true }, // e.g. "Food", "Transport"
  amount: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true, default: "" },
  isHidden: { type: Boolean, default: false, index: true }, // Flag for hidden category expenses
  hiddenCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "HiddenCategory", default: null }, // Reference to hidden category
}, { timestamps: true });

// Compound index to speed common queries for a user's expenses in a date range or by category
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
