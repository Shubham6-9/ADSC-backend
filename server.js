import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import levelConfigRoutes from "./routes/levelConfig.routes.js";
import userRoutes from "./routes/user.routes.js";
import cors from "cors";
import adminRoutes from "./routes/admin.routes.js";
import actionRoutes from "./routes/action.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import userChallengeRoutes from "./routes/userChallenge.routes.js";
import dailyChallengeRoutes from "./routes/dailyChallenge.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import goalsRoutes from "./routes/goals.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import streakRoutes from "./routes/streak.routes.js";
import friendsRoutes from "./routes/friends.routes.js";
import friendChallengeRoutes from "./routes/friendChallenge.routes.js";
import gameRoutes from "./routes/game.routes.js";
import debugRoutes from "./routes/debug.routes.js";
import companyRoutes from "./routes/company.routes.js";









dotenv.config();

const app = express();
app.use(cors());  // allow all origins (for dev)


// Middleware
app.use(express.json());

//Routes
    app.use("/api/user/auth", authRoutes);
    app.use("/api/user/my-challenges", userChallengeRoutes); // or whatever path you prefer
    app.use("/api/user/daily-challenges", dailyChallengeRoutes); // Daily challenges routes
    app.use("/api/user/budget", budgetRoutes);
    app.use("/api/user/expense", expenseRoutes);
    app.use("/api/user/goals", goalsRoutes);
    app.use("/api/user/leaderboard", leaderboardRoutes); // Leaderboard routes
    app.use("/api/user/streak", streakRoutes); // Streak routes
    app.use("/api/user/friends", friendsRoutes); // Friends routes
    app.use("/api/user/friend-challenges", friendChallengeRoutes); // Friend challenge routes
    app.use("/api/user/games", gameRoutes); // Games routes
    app.use("/api/user/companies", companyRoutes); // Company management routes
    app.use("/api/user/debug", debugRoutes); // Debug routes
    app.use("/api/user", userRoutes); // User profile routes (must come AFTER specific routes)

    //admin
    app.use("/api/admin/settings", settingsRoutes);
    app.use("/api/admin/levels", levelConfigRoutes);
    app.use("/api/admin/users", userRoutes);
    app.use("/api/admin/actions", actionRoutes);
    app.use("/api/admin/challenges", challengeRoutes);
    app.use("/api/admin", adminRoutes);



// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Base route
app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
