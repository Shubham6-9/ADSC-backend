import express from "express";
import { getXpSetting, setXpSetting } from "../controllers/settings.controller.js";
// import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Add roleMiddleware("Admin") later when you add roles
router.get("/xp",  getXpSetting);
router.put("/xp",  setXpSetting);

export default router;
