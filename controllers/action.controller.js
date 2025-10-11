// controllers/action.controller.js
import Action from "../models/Action.js";

/**
 * Create a new action (Admin)
 * Body: { actionName: String, xpReward: Number }
 */
export const createAction = async (req, res) => {
  try {
    const { actionName, xpReward } = req.body;

    if (!actionName || actionName.trim() === "") {
      return res.status(400).json({ success: false, message: "actionName is required" });
    }
    if (xpReward == null || !Number.isFinite(xpReward) || xpReward < 0) {
      return res.status(400).json({ success: false, message: "xpReward must be a non-negative number" });
    }

    const action = new Action({ actionName: actionName.trim(), xpReward });
    await action.save();

    return res.status(201).json({ success: true, message: "Action created", action });
  } catch (err) {
    console.error("createAction error:", err);
    // duplicate key (actionName) error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.actionName) {
      return res.status(409).json({ success: false, message: "Action name already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

export const listActions = async (req, res) => {
  try {
    const actions = await Action.find().sort({ createdAt: 1 }).select("-__v");
    return res.status(200).json({ success: true, actions });
  } catch (err) {
    console.error("listActions error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch actions", error: err.message });
  }
};

export const getAction = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "id param required" });

    const action = await Action.findById(id).select("-__v");
    if (!action) return res.status(404).json({ success: false, message: "Action not found" });

    return res.status(200).json({ success: true, action });
  } catch (err) {
    console.error("getAction error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch action", error: err.message });
  }
};

export const deleteAction = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "id param required" });

    const deleted = await Action.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Action not found" });

    return res.status(200).json({ success: true, message: "Action deleted", action: deleted });
  } catch (err) {
    console.error("deleteAction error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete action", error: err.message });
  }
};
