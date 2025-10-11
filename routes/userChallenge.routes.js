// routes/userChallenge.routes.js
import express from "express";
import { completeChallenge, listUserCompleted } from "../controllers/userChallenge.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:id/complete", authMiddleware, completeChallenge);
router.get("/me", authMiddleware, listUserCompleted);

export default router;
