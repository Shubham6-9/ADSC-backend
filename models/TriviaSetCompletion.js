import mongoose from "mongoose";

const triviaSetCompletionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  setNumber: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    default: 10,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index to track user's completed sets
triviaSetCompletionSchema.index({ user: 1, setNumber: 1 });

const TriviaSetCompletion = mongoose.model("TriviaSetCompletion", triviaSetCompletionSchema);

export default TriviaSetCompletion;
