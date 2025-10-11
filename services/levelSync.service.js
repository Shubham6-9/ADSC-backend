// services/levelSync.service.js
import User from "../models/User.js";

/**
 * Sync xpForNextLevel for all users who are currently at `levelNumber - 1`
 * to be `xpRequired` (the XP required for levelNumber).
 * 
 * This is called when admin creates/updates a level config.
 * Example: If admin sets level 2 to require 200 XP, 
 * all users at level 1 should have xpForNextLevel = 200.
 *
 * Returns summary: { matchedCount, modifiedCount }
 */
export default async function syncUsersXpForNextLevel(levelNumber, xpRequired, { batchSize = 1000 } = {}) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1) throw new Error("invalid levelNumber");
  if (!Number.isFinite(xpRequired) || xpRequired < 1) throw new Error("invalid xpRequired");

  // Update users at (levelNumber - 1) because they need to know XP required for NEXT level
  const previousLevel = levelNumber - 1;
  
  // If levelNumber is 1, don't sync anyone (no users at level 0)
  if (previousLevel < 1) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  const filter = { level: previousLevel };
  const update = { $set: { xpForNextLevel: xpRequired } };

  try {
    const result = await User.updateMany(filter, update);
    return { 
      matchedCount: result.matchedCount ?? result.n ?? 0, 
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
      affectedLevel: previousLevel
    };
  } catch (err) {
    console.error("syncUsersXpForNextLevel error:", err);
    throw err;
  }
}
