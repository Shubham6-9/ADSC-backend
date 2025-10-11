// routes/streak.routes.js
import express from 'express';
import { getMyStreak } from '../controllers/streak.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get current user's streak info
router.get('/', authMiddleware, getMyStreak);

export default router;
