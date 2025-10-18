import express from "express";
import { checkGameReady } from "../controllers/debug.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Debug endpoint to check if user is ready for games
router.get("/check-game-ready", authMiddleware, checkGameReady);

export default router;
