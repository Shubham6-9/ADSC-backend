// controllers/leaderboard.controller.js
import User from "../models/User.js";

/**
 * GET /api/user/leaderboard
 * Returns leaderboard with users sorted by XP (highest first)
 * Query params:
 *  - page (default 1)
 *  - limit (default 50, max 100)
 */
export const getLeaderboard = async (req, res) => {
  try {
    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    // Get total count
    const total = await User.countDocuments();

    // Fetch users sorted by XP (descending) and level (descending as tiebreaker)
    const users = await User.find()
      .select("username xp level country createdAt")
      .sort({ xp: -1, level: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate rank for each user
    const leaderboard = users.map((user, index) => ({
      rank: skip + index + 1,
      username: user.username,
      xp: user.xp,
      level: user.level,
      country: user.country,
      joinedAt: user.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      leaderboard,
    });
  } catch (err) {
    console.error("getLeaderboard error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
      error: err.message,
    });
  }
};

/**
 * GET /api/user/leaderboard/my-rank
 * Returns the authenticated user's rank on the leaderboard
 */
export const getMyRank = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Find current user
    const currentUser = await User.findById(userId).select("username xp level country").lean();
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Count how many users have more XP than the current user
    const rank = await User.countDocuments({
      $or: [
        { xp: { $gt: currentUser.xp } },
        { xp: currentUser.xp, level: { $gt: currentUser.level } },
      ],
    }) + 1;

    // Get total users
    const totalUsers = await User.countDocuments();

    return res.json({
      success: true,
      myRank: {
        rank,
        username: currentUser.username,
        xp: currentUser.xp,
        level: currentUser.level,
        country: currentUser.country,
        totalUsers,
        percentile: ((totalUsers - rank + 1) / totalUsers * 100).toFixed(2),
      },
    });
  } catch (err) {
    console.error("getMyRank error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rank",
      error: err.message,
    });
  }
};

/**
 * GET /api/user/leaderboard/top
 * Returns top N users (default top 10)
 * Query params:
 *  - limit (default 10, max 50)
 */
export const getTopUsers = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const topUsers = await User.find()
      .select("username xp level country createdAt")
      .sort({ xp: -1, level: -1 })
      .limit(limit)
      .lean();

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      xp: user.xp,
      level: user.level,
      country: user.country,
      joinedAt: user.createdAt,
    }));

    return res.json({
      success: true,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (err) {
    console.error("getTopUsers error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top users",
      error: err.message,
    });
  }
};
