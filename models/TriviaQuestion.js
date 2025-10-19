import mongoose from "mongoose";

const triviaQuestionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        // Core / user-provided
        "stock_market",
        "income_tax",
        "gst",
        "mutual_funds",
        "banking",
        "insurance",
        "cryptocurrency",
        "financial_planning",
        "financial_literacy",

        // Categories introduced in your original array & added questions
        "credit_cards",
        "real_estate",
        "investments",
        "retirement",
        "bonds",
        "debt",
        "savings",
        "budgeting",
        "entrepreneurship",
        "credit_score",

        // Fintech / Payments / Platforms
        "fintech",
        "fintech_payments",
        "payments",
        "UPI",              // in case used as a category label somewhere
        "NFO_IPO",
        "SIP",
        "index_funds",
        "ETFs",

        // Loans / Home / Car / Education
        "loans",
        "home_loans",
        "car_loans",
        "education_finance",
        "student_loans",    // if you use this phrasing
        "loan_products",

        // Market types / instruments
        "derivatives",
        "commodities",
        "forex",
        "arbitrage",
        "inflation",
        "interest_rates",
        "dividends",
        "stock_splits",
        "buyback",
        "index_funds",
        "stock_splits",

        // Corporate / Accounting / Audit
        "accounting",
        "audits",
        "corporate_finance",
        "financial_markets",
        "risk_management",
        "compliance",
        "governance",

        // Regulators / Institutions / Schemes
        "RBI",
        "SEBI",
        "taxation",
        "tax_procedures",
        "TDS",              // optional label
        "PAN",              // optional label
        "PF",               // optional label (Provident Fund)
        "saving_instruments",
        "saving_schemes",
        "sustainable_finance",
        "ESG",
        "green_finance",
        "startup_finance",
        "venture_capital",

        // Wealth / Protection / Management
        "wealth_management",
        "wealth_protection",
        "retirement_products",
        "saving_instruments",
        "alternative_investments",
        "private_equity",

        // Consumer / Protection / Services
        "consumer_protection",
        "banking_products",
        "finserv",          // optional
        "credit_services",

        // Misc / utility / catch-all
        "finals",
        "financial_markets",
        "financial_goals",
        "personal_finance",
        "payments",         // duplicate-safe
        "misc"

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
