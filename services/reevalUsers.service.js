// services/reevalUsers.service.js
import User from "../models/User.js";
import LevelConfig from "../models/LevelConfig.js";
import getXpForNextLevel from "./getXpForNextLevel.service.js";

/**
 * Re-evaluate users for a given targetLevel change OR for all users.
 * - If targetLevel provided: re-eval users whose level >= targetLevelStart (or exactly equal; below we show exact match).
 * - newXp = xpRequired for that level.
 *
 * This function does a batched bulkWrite for performance.
 *
 * Example usage:
 *   await reevalUsersForLevelChange(2) // re-evaluate users at level 2
 */
export default async function reevalUsersForLevelChange(targetLevel, { batchSize = 500 } = {}) {
  if (!Number.isInteger(targetLevel) || targetLevel < 1) {
    throw new Error("targetLevel must be integer >= 1");
  }

  const summary = { processed: 0, updatedCount: 0, errors: [] };

  // Cursor for users at the targetLevel (or you can choose >=, or all users)
  const cursor = User.find({ level: targetLevel }).cursor();

  let bulkOps = [];
  let batchCount = 0;

  for await (const user of cursor) {
    summary.processed++;

    try {
      let userXp = Number(user.xp || 0);
      let userLevel = Number(user.level || 1);

      // Re-evaluate using LevelConfig table
      // Loop until userXp < xpRequired for current userLevel
      let leveledUp = false;
      while (true) {
        const cfg = await LevelConfig.findOne({ level: userLevel });
        const required = cfg ? Number(cfg.xpRequired) : null;
        if (!required) break; // no config for this level -> stop leveling

        if (userXp >= required) {
          userXp -= required;
          userLevel += 1;
          leveledUp = true;
        } else {
          break;
        }
      }

      // Get xpRequired for the user's NEXT level (current level + 1)
      const xpForNextLevel = await getXpForNextLevel(userLevel, user.xpForNextLevel || 100);

      bulkOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { xp: userXp, level: userLevel, xpForNextLevel } }
        }
      });

      batchCount++;
    } catch (err) {
      console.error("reeval error for user", user._id, err);
      summary.errors.push({ userId: user._id, error: err.message });
    }

    // execute batch
    if (batchCount >= batchSize) {
      try {
        const result = await User.bulkWrite(bulkOps, { ordered: false });
        summary.updatedCount += result.modifiedCount ?? result.nModified ?? 0;
      } catch (bulkErr) {
        console.error("bulkWrite error:", bulkErr);
        summary.errors.push({ bulkError: bulkErr.message });
      }
      // reset batch
      bulkOps = [];
      batchCount = 0;
    }
  }

  // final flush
  if (bulkOps.length > 0) {
    try {
      const result = await User.bulkWrite(bulkOps, { ordered: false });
      summary.updatedCount += result.modifiedCount ?? result.nModified ?? 0;
    } catch (bulkErr) {
      console.error("bulkWrite final error:", bulkErr);
      summary.errors.push({ bulkError: bulkErr.message });
    }
  }

  return summary;
}
