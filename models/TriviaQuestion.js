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
        "general_finance"
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
