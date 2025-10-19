import mongoose from "mongoose";

const triviaQuestionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "stock_market",
        "income_tax",
        "gst",
        "mutual_funds",
        "banking",
        "insurance",
        "cryptocurrency",
        "real_estate",
        "financial_planning",
        "general_finance",
        'credit_cards',
        'real_estate',
        'investments',
        'retirement',
        'bonds',
        'debt',
        'savings',
        'budgeting',
        'entrepreneurship',
        'credit_score',
        'fintech',
        'payments',
        'RBI',
        'SEBI',
        'taxation',
        'startup_finance',
        'ESG',
        'fintech_payments',
        'loans',
        'home_loans',
        'car_loans',
        'education_finance',
        'wealth_management',
        'alternative_investments',
        'SIP',
        'NFO_IPO',
        'dividends',
        'stock_splits',
        'buyback',
        'index_funds',
        'ETFs',
        'arbitrage',
        'inflation',
        'interest_rates',
        'derivatives',
        'commodities',
        'forex',
        'accounting',
        'audits',
        'corporate_finance',
        'financial_markets',
        'risk_management',
        'compliance',
        'loans',
        'saving_instruments',
        'tax_procedures',
        'consumer_protection',
        'retirement_products',
        'wealth_protection',
        'banking_products',
        'credit_score',
        'finals',
        'financial_literacy',
      ],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
    explanation: {
      type: String,
      default: "",
    },
    points: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    timesAnswered: {
      type: Number,
      default: 0,
    },
    timesCorrect: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
triviaQuestionSchema.index({ category: 1, difficulty: 1, isActive: 1 });
triviaQuestionSchema.index({ isActive: 1 });

const TriviaQuestion = mongoose.model("TriviaQuestion", triviaQuestionSchema);
export default TriviaQuestion;
