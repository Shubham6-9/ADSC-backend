import express from "express";
import {
    startHiLoGame,
    makeHiLoGuess,
    skipHiLoCards,
    cashOutHiLo,
    abandonHiLo,
    getHiLoSession,
} from "../controllers/hiLo.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Hi-Lo game routes
router.post("/start", authMiddleware, startHiLoGame);
router.post("/guess", authMiddleware, makeHiLoGuess);
router.post("/skip", authMiddleware, skipHiLoCards);
router.post("/cashout", authMiddleware, cashOutHiLo);
router.post("/abandon", authMiddleware, abandonHiLo);
router.get("/session", authMiddleware, getHiLoSession);

export default router;
