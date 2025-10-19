import TriviaQuestion from "../models/TriviaQuestion.js";
import GameSession from "../models/GameSession.js";
import TriviaSetCompletion from "../models/TriviaSetCompletion.js";
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

/**
 * GET /api/user/games/trivia/sets
 * Get all question sets with completion status
 */
export const getTriviaSets = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Get total question count
    const totalQuestions = await TriviaQuestion.countDocuments({ isActive: true });
    const totalSets = Math.ceil(totalQuestions / 10);

    // Get all questions sorted by ID to create consistent sets
    const allQuestions = await TriviaQuestion.find({ isActive: true })
      .sort({ _id: 1 })
      .select('category difficulty');

    // Get user's completed sets
    const completedSets = await TriviaSetCompletion.find({ 
      user: userId,
      accuracy: { $gte: 70 }
    }).select('setNumber accuracy score');

    const completedSetNumbers = new Set(completedSets.map(cs => cs.setNumber));

    // Create set metadata
    const sets = [];
    for (let i = 0; i < totalSets; i++) {
      const setNumber = i + 1;
      const startIdx = i * 10;
      const endIdx = Math.min(startIdx + 10, totalQuestions);
      const setQuestions = allQuestions.slice(startIdx, endIdx);

      const categories = [...new Set(setQuestions.map(q => q.category))];
      const difficulties = {
        easy: setQuestions.filter(q => q.difficulty === 'easy').length,
        medium: setQuestions.filter(q => q.difficulty === 'medium').length,
        hard: setQuestions.filter(q => q.difficulty === 'hard').length,
      };

      const completion = completedSets.find(cs => cs.setNumber === setNumber);

      sets.push({
        setNumber,
        totalQuestions: setQuestions.length,
        categories,
        difficulties,
        isCompleted: completedSetNumbers.has(setNumber),
        completion: completion ? {
          accuracy: completion.accuracy,
          score: completion.score,
        } : null,
      });
    }

    return res.status(200).json({
      success: true,
      sets,
      totalSets,
    });
  } catch (err) {
    console.error("getTriviaSets error:", err);
    return res.status(500).json({ success: false, message: "Failed to get sets" });
  }
};

/**
 * GET /api/user/games/trivia/set/:setNumber/questions
 * Get questions for a specific set
 */
export const getSetQuestions = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { setNumber } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID required" });
    }

    // Verify session
    const session = await GameSession.findById(sessionId);
    if (!session || session.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Invalid session" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ success: false, message: "Session not active" });
    }

    // Get all questions sorted consistently
    const allQuestions = await TriviaQuestion.find({ isActive: true }).sort({ _id: 1 });
    
    // Calculate set range
    const setNum = parseInt(setNumber);
    const startIdx = (setNum - 1) * 10;
    const endIdx = startIdx + 10;
    
    const setQuestions = allQuestions.slice(startIdx, endIdx);

    // Sanitize questions (remove correct answers)
    const sanitizedQuestions = setQuestions.map(q => ({
      _id: q._id,
      category: q.category,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options.map(opt => ({ text: opt.text })),
      points: q.points,
    }));

    // Store set number in session metadata
    await GameSession.findByIdAndUpdate(sessionId, {
      $set: { 'gameData.setNumber': setNum }
    });

    return res.status(200).json({
      success: true,
      questions: sanitizedQuestions,
      setNumber: setNum,
      totalQuestions: sanitizedQuestions.length,
    });
  } catch (err) {
    console.error("getSetQuestions error:", err);
    return res.status(500).json({ success: false, message: "Failed to get set questions" });
  }
};

/**
 * POST /api/user/games/trivia/set/complete
 * Track completion of a trivia set
 */
export const completeSet = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { setNumber, accuracy, score, correctAnswers, totalQuestions } = req.body;

    if (!setNumber || accuracy === undefined) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // Only record if accuracy is 70% or higher
    if (accuracy >= 70) {
      // Check if user already completed this set
      const existing = await TriviaSetCompletion.findOne({ user: userId, setNumber });

      if (existing) {
        // Update if new score/accuracy is better
        if (accuracy > existing.accuracy) {
          existing.accuracy = accuracy;
          existing.score = score;
          existing.correctAnswers = correctAnswers;
          existing.totalQuestions = totalQuestions;
          await existing.save();
        }
      } else {
        // Create new completion record
        await TriviaSetCompletion.create({
          user: userId,
          setNumber,
          accuracy,
          score,
          correctAnswers,
          totalQuestions,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: accuracy >= 70 ? "Set completed!" : "Complete with 70%+ to mark as done",
      recorded: accuracy >= 70,
    });
  } catch (err) {
    console.error("completeSet error:", err);
    return res.status(500).json({ success: false, message: "Failed to record completion" });
  }
};
