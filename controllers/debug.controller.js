import User from "../models/User.js";
import Game from "../models/Game.js";

/**
 * GET /api/user/debug/check-game-ready
 * Check if user is ready to play games
 */
export const checkGameReady = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).lean();
    const triviaGame = await Game.findOne({ gameType: "trivia" }).lean();

    const debug = {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        level: user.level,
        virtualCurrency: user.virtualCurrency,
        hasLevel: typeof user.level !== 'undefined',
        hasCurrency: typeof user.virtualCurrency !== 'undefined',
      },
      game: {
        found: !!triviaGame,
        name: triviaGame?.name,
        isActive: triviaGame?.isActive,
        minEntryFee: triviaGame?.minEntryFee,
        minimumLevel: triviaGame?.minimumLevel,
      },
      checks: {
        userHasLevel: user.level >= 1,
        userHasEnoughCoins: user.virtualCurrency >= (triviaGame?.minEntryFee || 10),
        gameExists: !!triviaGame,
        gameIsActive: triviaGame?.isActive === true,
        userMeetsLevelRequirement: user.level >= (triviaGame?.minimumLevel || 1),
      },
      readyToPlay: 
        user.level >= 1 && 
        user.virtualCurrency >= (triviaGame?.minEntryFee || 10) &&
        triviaGame?.isActive === true,
    };

    return res.status(200).json(debug);
  } catch (err) {
    console.error("Debug check error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Debug check failed",
      error: err.message 
    });
  }
};
