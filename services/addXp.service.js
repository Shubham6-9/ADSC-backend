// services/addXp.service.js
import User from "../models/User.js";
import LevelConfig from "../models/LevelConfig.js";
import getXpForNextLevel from "./getXpForNextLevel.service.js";

/**
 * Add XP to a user and automatically handle level-ups.
 * 
 * This function:
 * 1. Adds the specified XP amount to the user
 * 2. Checks if user has enough XP to level up
 * 3. Handles multiple level-ups if user has enough XP
 * 4. Updates xpForNextLevel based on new level
 * 
 * @param {String} userId - The user's _id
 * @param {Number} xpAmount - Amount of XP to add (must be positive)
 * @returns {Promise<Object>} Updated user data with level-up info
 */
export default async function addXpToUser(userId, xpAmount) {
  if (!userId) {
    throw new Error("userId is required");
  }
  
  if (!Number.isFinite(xpAmount) || xpAmount <= 0) {
    throw new Error("xpAmount must be a positive number");
  }

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Add XP (accumulate, don't reset)
  let totalXp = Number(user.xp || 0) + xpAmount;
  let currentLevel = Number(user.level || 1);
  let levelsGained = 0;
  const levelUps = [];

  // Keep checking if user can level up
  while (true) {
    // Get the XP required for NEXT level (to level up from current to next)
    const nextLevel = currentLevel + 1;
    const levelConfig = await LevelConfig.findOne({ level: nextLevel });
    
    if (!levelConfig) {
      // No more level configs available, stop leveling
      break;
    }

    const xpRequired = Number(levelConfig.xpRequired);

    // Check if user has enough TOTAL XP to reach next level
    if (totalXp >= xpRequired) {
      // Level up!
      currentLevel = nextLevel;
      levelsGained += 1;
      
      levelUps.push({
        fromLevel: currentLevel - 1,
        toLevel: currentLevel,
        xpRequired: xpRequired,
        currentTotalXp: totalXp
      });
    } else {
      // Not enough XP to level up further
      break;
    }
  }

  // Get XP required for the next level from current level
  const xpForNextLevel = await getXpForNextLevel(currentLevel, user.xpForNextLevel || 100);

  // Update user in database
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        xp: totalXp,
        level: currentLevel,
        xpForNextLevel: xpForNextLevel
      }
    },
    { new: true, runValidators: true }
  ).select('-password'); // Don't return password

  return {
    user: updatedUser,
    xpAdded: xpAmount,
    levelsGained: levelsGained,
    levelUps: levelUps,
    previousLevel: user.level,
    currentLevel: currentLevel
  };
}
