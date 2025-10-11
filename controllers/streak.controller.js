// controllers/streak.controller.js
import { getUserStreak } from '../services/streak.service.js';

/**
 * GET /api/user/streak
 * Get current user's streak information
 */
export const getMyStreak = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const streakInfo = await getUserStreak(userId);

    if (!streakInfo.success) {
      return res.status(500).json({ 
        success: false, 
        message: streakInfo.message 
      });
    }

    return res.json({
      success: true,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      lastExpenseDate: streakInfo.lastExpenseDate,
      streakGraceUsed: streakInfo.streakGraceUsed,
      streakStatus: streakInfo.streakStatus
    });

  } catch (err) {
    console.error('getMyStreak error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error' 
    });
  }
};

export default { getMyStreak };
