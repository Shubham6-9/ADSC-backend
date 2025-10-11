// routes/user.routes.js
import express from "express";
import { addXp, listUsers, getUserById, getUserDashboardData, updateProfile } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User profile routes (authenticated)
router.put("/profile", authMiddleware, updateProfile);  // Update user profile

// Admin routes for user management
router.get("/", listUsers);                    // List all users

// Dashboard route (must come before /:userId to avoid conflicts)
router.get("/dashboard/:userId", getUserDashboardData);  // Get complete user dashboard data

router.get("/:userId", getUserById);           // Get single user
router.post("/:userId/add-xp", addXp);        // Add XP to user (triggers auto level-up)

export default router;
