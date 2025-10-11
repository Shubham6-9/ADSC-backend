// controllers/levelConfig.controller.js
import LevelConfig from "../models/LevelConfig.js";
import syncUsersXpForNextLevel from "../services/levelSync.service.js";
import reevalUsersForLevelChange from "../services/reevalUsers.service.js";

/**
 * GET /api/levels
 * Returns all level configs sorted by level
 */
export const listLevels = async (req, res) => {
  try {
    const levels = await LevelConfig.find().sort({ level: 1 });
    return res.status(200).json({ success: true, levels });
  } catch (err) {
    console.error("listLevels:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch levels",
        error: err.message,
      });
  }
};

/**
 * POST /api/levels
 * Body: { level: Number, levelName: String, xpRequired: Number, levelReward: String (optional), levelBadge: String, syncExisting: Boolean (optional default true) }
 * Creates or updates a level config (upsert). Automatically syncs existing users' xpForNextLevel.
 */
export const upsertLevel = async (req, res) => {
  try {
    const { level, levelName, xpRequired, levelReward, levelBadge, syncExisting = true } = req.body;

    // Validate level
    if (!Number.isInteger(level) || level < 1) {
      return res
        .status(400)
        .json({ success: false, message: "level must be an integer >= 1" });
    }

    // Validate levelName
    if (!levelName || typeof levelName !== "string" || !levelName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "levelName is required and must be a non-empty string" });
    }

    // Validate xpRequired
    if (!Number.isFinite(xpRequired) || xpRequired < 1) {
      return res
        .status(400)
        .json({ success: false, message: "xpRequired must be a number >= 1" });
    }

    // Validate levelBadge
    if (!levelBadge || typeof levelBadge !== "string" || !levelBadge.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "levelBadge is required and must be a non-empty string" });
    }

    const updateData = {
      levelName: levelName.trim(),
      xpRequired,
      levelBadge: levelBadge.trim(),
    };

    // levelReward is optional
    if (levelReward !== undefined && levelReward !== null) {
      updateData.levelReward = String(levelReward).trim();
    }

    const levelConfig = await LevelConfig.findOneAndUpdate(
      { level },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    let syncResult = null;
    let reevalResult = null;
    
    if (syncExisting) {
      // Sync users at (level - 1) so their xpForNextLevel reflects this new level's requirement
      syncResult = await syncUsersXpForNextLevel(level, xpRequired);
      
      // Re-evaluate users at the previous level in case they now have enough XP to level up
      if (level > 1) {
        reevalResult = await reevalUsersForLevelChange(level - 1);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Level saved and users synced",
      levelConfig,
      syncResult,
      reevalResult,
    });
  } catch (err) {
    console.error("upsertLevel:", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Level already exists (conflict)." });
    }
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to save level",
        error: err.message,
      });
  }
};

/**
 * DELETE /api/levels/:level
 * Deletes a level configuration. Admin must consider consequences.
 */
export const deleteLevel = async (req, res) => {
  try {
    const level = Number(req.params.level);
    if (!Number.isInteger(level) || level < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid level param" });
    }

    const deleted = await LevelConfig.findOneAndDelete({ level });
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Level not found" });

    // NOTE: We do NOT auto-change users here. Admin can run a separate sync if desired.
    return res
      .status(200)
      .json({ success: true, message: "Level deleted", deleted });
  } catch (err) {
    console.error("deleteLevel:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete level",
        error: err.message,
      });
  }
};
