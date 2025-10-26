import express from "express";
import {
  verifyPassword,
  createHiddenCategory,
  getHiddenCategories,
  updateHiddenCategory,
  deleteHiddenCategory
} from "../controllers/hiddenCategory.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Password verification
router.post("/verify-password", verifyPassword);

// Hidden category CRUD operations
router.post("/", createHiddenCategory);
router.get("/", getHiddenCategories);
router.put("/:id", updateHiddenCategory);
router.delete("/:id", deleteHiddenCategory);

export default router;
