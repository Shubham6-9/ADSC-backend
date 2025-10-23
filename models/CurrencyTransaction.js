import mongoose from "mongoose";

const currencyTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true, // Positive for credit, negative for debit
    },
    type: {
      type: String,
      required: true,
      enum: [
        "daily_challenge_reward",
        "challenge_win",
        "challenge_loss",
        "challenge_wager",
        "challenge_refund",
        "admin_adjustment",
        "game_entry",
        "game_reward",
        "company_investment",
        "company_income",
        "company_tax",
        "company_slot_unlock",
        "company_upgrade",
        "crypto_deposit",
        "crypto_withdraw",
        "debit",
        "credit",
      ],
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedChallenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FriendChallenge",
      default: null,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // For tracking opponent in challenge
    },
  },
  { timestamps: true }
);

// Index for efficient queries
currencyTransactionSchema.index({ user: 1, createdAt: -1 });
currencyTransactionSchema.index({ type: 1 });

const CurrencyTransaction = mongoose.model("CurrencyTransaction", currencyTransactionSchema);
export default CurrencyTransaction;
