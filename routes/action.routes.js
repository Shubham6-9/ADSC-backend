// routes/action.routes.js
import express from "express";
import {
  createAction,
  listActions,
  getAction,
  deleteAction
} from "../controllers/action.controller.js";


const router = express.Router();

// Create action (Admin only)
router.post("/",  createAction);

// List actions (public or admin; here protected - remove middlewares if you want public)
router.get("/",listActions);

// Get single action by MongoDB _id
router.get("/:id",  getAction);

// Delete action (Admin)
router.delete("/:id",  deleteAction);

export default router;
