import express from "express";
import {
  getAvailableGames,
  getGameDetails,
  startGameSession,
  completeGameSession,
  getGameLeaderboard,
  getMyGameSessions,
} from "../controllers/game.controller.js";
import {
  getTriviaQuestions,
  submitTriviaAnswers,
  getTriviaCategories,
  getTriviaSets,
  getSetQuestions,
  completeSet,
} from "../controllers/trivia.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// General game routes (root and specific paths first)
router.get("/", authMiddleware, getAvailableGames);
router.get("/my-sessions", authMiddleware, getMyGameSessions);

// Trivia-specific routes (MUST come before /:gameType routes)
router.get("/trivia/sets", authMiddleware, getTriviaSets);
router.get("/trivia/set/:setNumber/questions", authMiddleware, getSetQuestions);
router.post("/trivia/set/complete", authMiddleware, completeSet);
router.get("/trivia/questions", authMiddleware, getTriviaQuestions);
router.post("/trivia/submit", authMiddleware, submitTriviaAnswers);
router.get("/trivia/categories", authMiddleware, getTriviaCategories);

// Generic game routes with params (MUST come last)
router.get("/:gameType", authMiddleware, getGameDetails);
router.post("/:gameType/start", authMiddleware, startGameSession);
router.post("/:gameType/complete", authMiddleware, completeGameSession);
router.get("/:gameType/leaderboard", authMiddleware, getGameLeaderboard);

export default router;
