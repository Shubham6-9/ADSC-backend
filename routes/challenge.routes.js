// routes/challenge.routes.js
import express from "express";
import {
  createChallenge,
  listChallenges,
  getChallenge,
  deleteChallenge,
  updateChallenge ,
} from "../controllers/challenge.controller.js";
// import { authMiddleware } from "../middlewares/auth.middleware.js";
// import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", createChallenge);
router.get("/", listChallenges);
router.get("/:id", getChallenge);
router.put("/:id", updateChallenge); // <-- update route
router.delete("/:id", deleteChallenge);

export default router;
