import TriviaQuestion from "../models/TriviaQuestion.js";
import GameSession from "../models/GameSession.js";
import mongoose from "mongoose";

/**
 * GET /api/user/games/trivia/questions
 * Get random trivia questions for a game session
 */
export const getTriviaQuestions = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { sessionId, count = 10 } = req.query;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID required" });
    }

    // Verify session belongs to user
    const session = await GameSession.findById(sessionId);
    if (!session || session.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Invalid session" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ success: false, message: "Session not active" });
    }

    // Get random questions (mix of difficulties)
    const questionCount = parseInt(count);
    const easyCount = Math.floor(questionCount * 0.4); // 40% easy
    const mediumCount = Math.floor(questionCount * 0.4); // 40% medium
    const hardCount = questionCount - easyCount - mediumCount; // 20% hard

    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      TriviaQuestion.aggregate([
        { $match: { difficulty: "easy", isActive: true } },
        { $sample: { size: easyCount } },
      ]),
      TriviaQuestion.aggregate([
        { $match: { difficulty: "medium", isActive: true } },
        { $sample: { size: mediumCount } },
      ]),
      TriviaQuestion.aggregate([
        { $match: { difficulty: "hard", isActive: true } },
        { $sample: { size: hardCount } },
      ]),
    ]);

    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    
    // Shuffle questions
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // Remove correct answer flag from options (send to client without revealing answer)
    const sanitizedQuestions = allQuestions.map(q => ({
      _id: q._id,
      category: q.category,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options.map(opt => ({ text: opt.text })),
      points: q.points,
    }));

    return res.status(200).json({
      success: true,
      questions: sanitizedQuestions,
      totalQuestions: sanitizedQuestions.length,
    });
  } catch (err) {
    console.error("getTriviaQuestions error:", err);
    return res.status(500).json({ success: false, message: "Failed to get questions" });
  }
};

/**
 * POST /api/user/games/trivia/submit
 * Submit trivia answers and get results
 */
export const submitTriviaAnswers = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { sessionId, answers, timeSpentSeconds } = req.body;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "Invalid submission" });
    }

    // Verify session
    const session = await GameSession.findById(sessionId);
    if (!session || session.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Invalid session" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ success: false, message: "Session not active" });
    }

    // Get all questions and verify answers
    const questionIds = answers.map(a => a.questionId);
    const questions = await TriviaQuestion.find({ _id: { $in: questionIds } });

    let correctCount = 0;
    let totalPoints = 0;
    const results = [];

    for (const answer of answers) {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (!question) continue;

      const selectedOption = question.options.find(opt => opt.text === answer.selectedAnswer);
      const correctOption = question.options.find(opt => opt.isCorrect);
      const isCorrect = selectedOption && selectedOption.isCorrect;

      if (isCorrect) {
        correctCount++;
        totalPoints += question.points;
      }

      results.push({
        questionId: question._id,
        question: question.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: correctOption.text,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0,
      });

      // Update question statistics
      question.timesAnswered += 1;
      if (isCorrect) question.timesCorrect += 1;
      await question.save();
    }

    const wrongCount = answers.length - correctCount;
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    return res.status(200).json({
      success: true,
      results,
      summary: {
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        totalQuestions: answers.length,
        score: totalPoints,
        maxScore,
        accuracy: ((correctCount / answers.length) * 100).toFixed(1),
        timeSpent: timeSpentSeconds,
      },
    });
  } catch (err) {
    console.error("submitTriviaAnswers error:", err);
    return res.status(500).json({ success: false, message: "Failed to submit answers" });
  }
};

/**
 * GET /api/user/games/trivia/categories
 * Get available trivia categories with question counts
 */
export const getTriviaCategories = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const categories = await TriviaQuestion.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          easyCount: { $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] } },
          mediumCount: { $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] } },
          hardCount: { $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (err) {
    console.error("getTriviaCategories error:", err);
    return res.status(500).json({ success: false, message: "Failed to get categories" });
  }
};
