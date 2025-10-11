// routes/levelConfig.routes.js
import express from "express";
import { listLevels, upsertLevel, deleteLevel } from "../controllers/levelConfig.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
// import roleMiddleware from "../middlewares/role.middleware.js"; // Admin-only middleware

const router = express.Router();

// All routes protected and admin-only
router.get("/",  listLevels);
router.post("/", upsertLevel);
router.delete("/:level", deleteLevel);

export default router;
