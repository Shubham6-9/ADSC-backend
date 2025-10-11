// controllers/userChallenge.controller.js
import Challenge from "../models/Challenge.js";
import User from "../models/User.js";
import addXp from "../services/addXp.service.js";

export const completeChallenge = async (req, res) => {
  try {
    const userId = req.user.id; // requires authMiddleware
    const challengeId = req.params.id;

    // validate challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ success:false, message:"Challenge not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success:false, message:"User not found" });

    // Prevent double completion
    const already = user.completedChallenges?.some(c => c.challenge.toString() === challengeId.toString());
    if (already) {
      return res.status(409).json({ success:false, message:"Challenge already completed by user" });
    }

    // 1) add entry to user's completedChallenges
    const entry = {
      challenge: challenge._id,
      completedAt: new Date(),
      xpReward: challenge.xpReward
    };
    user.completedChallenges = user.completedChallenges || [];
    user.completedChallenges.push(entry);

    // 2) persist user and add XP (use your xp service so level-up logic runs)
    await user.save(); // save completed challenge first (so if xp service fails, you still have record)
    // then add xp via service which handles level-ups & saving user state
    const xpResult = await addXp(userId, challenge.xpReward); // adjust if your addXp expects different args

    return res.status(200).json({
      success: true,
      message: "Challenge marked complete. XP awarded.",
      challenge: { 
        id: challenge._id, 
        challengeName: challenge.challengeName,
        challengeDescription: challenge.challengeDescription,
        xpReward: challenge.xpReward
      },
      xpResult
    });
  } catch (err) {
    console.error("completeChallenge error:", err);
    return res.status(500).json({ success:false, message:"Failed to complete challenge", error: err.message });
  }
};

export const listUserCompleted = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: "completedChallenges.challenge",
      select: "challengeName challengeDescription xpReward"
    }).select("completedChallenges");
    if (!user) return res.status(404).json({ success:false, message:"User not found" });

    return res.status(200).json({ success:true, completed: user.completedChallenges || [] });
  } catch (err) {
    console.error("listUserCompleted:", err);
    return res.status(500).json({ success:false, message:"Failed to fetch completed challenges", error: err.message });
  }
};
