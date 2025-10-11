// controllers/challenge.controller.js
import Challenge from "../models/Challenge.js";

/* Create challenge (Admin) */
export const createChallenge = async (req, res) => {
  try {
    const { challengeName, challengeDescription = "", xpReward } = req.body;
    if (!challengeName || challengeName.trim() === "") {
      return res.status(400).json({ success:false, message:"challengeName is required" });
    }
    if (xpReward == null || !Number.isFinite(xpReward) || xpReward < 0) {
      return res.status(400).json({ success:false, message:"xpReward must be a non-negative number" });
    }

    const ch = new Challenge({
      challengeName: challengeName.trim(),
      challengeDescription,
      xpReward
    });
    await ch.save();
    return res.status(201).json({ success:true, message:"Challenge created", challenge: ch });
  } catch (err) {
    console.error("createChallenge:", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.challengeName) {
      return res.status(409).json({ success:false, message:"challengeName already exists" });
    }
    return res.status(500).json({ success:false, message:"Internal server error", error: err.message });
  }
};

/* List all challenges */
export const listChallenges = async (req, res) => {
  try {
    const list = await Challenge.find().sort({ createdAt: 1 }).select("-__v");
    return res.status(200).json({ success:true, challenges: list });
  } catch (err) {
    console.error("listChallenges:", err);
    return res.status(500).json({ success:false, message:"Failed to fetch challenges", error: err.message });
  }
};

/* Get challenge by id */
export const getChallenge = async (req, res) => {
  try {
    const id = req.params.id;
    const challenge = await Challenge.findById(id).select("-__v");
    if (!challenge) return res.status(404).json({ success:false, message:"Challenge not found" });
    return res.status(200).json({ success:true, challenge });
  } catch (err) {
    console.error("getChallenge:", err);
    return res.status(500).json({ success:false, message:"Failed to fetch challenge", error: err.message });
  }
};
export const updateChallenge = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "id param required" });

    const { challengeName, challengeDescription, xpReward } = req.body;

    // Basic validation
    const update = {};
    if (challengeName !== undefined) {
      if (typeof challengeName !== "string" || challengeName.trim() === "") {
        return res.status(400).json({ success: false, message: "challengeName must be a non-empty string" });
      }
      update.challengeName = challengeName.trim();
    }
    if (challengeDescription !== undefined) {
      if (typeof challengeDescription !== "string") {
        return res.status(400).json({ success: false, message: "challengeDescription must be a string" });
      }
      update.challengeDescription = challengeDescription;
    }
    if (xpReward !== undefined) {
      if (!Number.isFinite(xpReward) || xpReward < 0) {
        return res.status(400).json({ success: false, message: "xpReward must be a non-negative number" });
      }
      update.xpReward = xpReward;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided to update" });
    }

    // find and update
    const updated = await Challenge.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Challenge not found" });

    // NOTE: we do NOT modify users' historical completed records here.
    // If you want to also sync/update users who haven't completed the challenge yet,
    // implement separate logic (see notes below).

    return res.status(200).json({ success: true, message: "Challenge updated", challenge: updated });
  } catch (err) {
    console.error("updateChallenge error:", err);
    // handle duplicate name error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.challengeName) {
      return res.status(409).json({ success: false, message: "challengeName already exists" });
    }
    return res.status(500).json({ success: false, message: "Failed to update challenge", error: err.message });
  }
};

/* Delete challenge (Admin) */
export const deleteChallenge = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Challenge.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success:false, message:"Challenge not found" });
    return res.status(200).json({ success:true, message:"Challenge deleted", challenge: deleted });
  } catch (err) {
    console.error("deleteChallenge:", err);
    return res.status(500).json({ success:false, message:"Failed to delete", error: err.message });
  }
};
