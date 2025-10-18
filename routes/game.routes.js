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
} from "../controllers/trivia.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// General game routes
router.get("/", authMiddleware, getAvailableGames);
router.get("/my-sessions", authMiddleware, getMyGameSessions);
router.get("/:gameType", authMiddleware, getGameDetails);
router.post("/:gameType/start", authMiddleware, startGameSession);
router.post("/:gameType/complete", authMiddleware, completeGameSession);
router.get("/:gameType/leaderboard", authMiddleware, getGameLeaderboard);

// Trivia-specific routes
router.get("/trivia/questions", authMiddleware, getTriviaQuestions);
router.post("/trivia/submit", authMiddleware, submitTriviaAnswers);
router.get("/trivia/categories", authMiddleware, getTriviaCategories);

export default router;
