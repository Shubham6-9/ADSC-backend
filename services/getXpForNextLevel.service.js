// services/getXpForNextLevel.service.js
import LevelConfig from "../models/LevelConfig.js";

/**
 * Get the XP required for the next level given a user's current level.
 * 
 * Example: If user is at level 1, this returns the xpRequired for level 2.
 * 
 * @param {Number} currentLevel - The user's current level
 * @param {Number} fallbackDefault - Default value if no config found (default: 100)
 * @returns {Promise<Number>} The XP required for the next level
 */
export default async function getXpForNextLevel(currentLevel, fallbackDefault = 100) {
  if (!Number.isInteger(currentLevel) || currentLevel < 1) {
    throw new Error("currentLevel must be an integer >= 1");
  }

  const nextLevel = currentLevel + 1;
  const levelConfig = await LevelConfig.findOne({ level: nextLevel });
  
  if (levelConfig && levelConfig.xpRequired) {
    return Number(levelConfig.xpRequired);
  }
  
  // No config found for next level, return fallback
  return fallbackDefault;
}
