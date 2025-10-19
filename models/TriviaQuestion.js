import mongoose from "mongoose";

const triviaQuestionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        // Core / original
        "stock_market",
        "income_tax",
        "gst",
        "mutual_funds",
        "banking",
        "insurance",
        "cryptocurrency",
        "financial_planning",
        "financial_literacy",
        // added / common variations
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
        // fintech / payments / platforms
        "fintech",
        "fintech_payments",
        "payments",
        "UPI",
        "NFO_IPO",
        "SIP",
        "index_funds",
        "ETFs",
        // loans / types
        "loans",
        "home_loans",
        "car_loans",
        "education_finance",
        "student_loans",
        "loan_products",
        // market instruments / trading
        "derivatives",
        "commodities",
        "forex",
        "arbitrage",
        "inflation",
        "interest_rates",
        "dividends",
        "stock_splits",
        "buyback",
        // corporate / accounting / audits
        "accounting",
        "audits",
        "corporate_finance",
        "financial_markets",
        "risk_management",
        "compliance",
        "governance",
        // regulators / schemes / institutions
        "RBI",
        "SEBI",
        "taxation",
        "tax_procedures",
        "tax_planning",
        "TDS",
        "PAN",
        "PF",
        "saving_instruments",
        "saving_schemes",
        "sustainable_finance",
        "ESG",
        "green_finance",
        "startup_finance",
        "venture_capital",
        // wealth / protection / management
        "wealth_management",
        "wealth_protection",
        "retirement_products",
        "alternative_investments",
        "private_equity",
        // consumer / services
        "consumer_protection",
        "banking_products",
        "finserv",
        "credit_services",
        // misc / utility / catch-all
        "finals",
        "financial_goals",
        "personal_finance",
        "misc",
        // synonyms & safe extras (in case of small typos in seed)
        "taxes",
        "tax_plan",
        "taxplanning",
        "credit cards",
        "real-estate",
        "stock market",
        "financial markets",
        "saving instruments",
        "saving schemes",
        "wealth_protection",
        "financial_literacy_alt"
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
