// controllers/friends.controller.js
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * POST /api/user/friends/request/:userId
 * Send a friend request to another user
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { userId: targetUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: "Cannot send friend request to yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "Already friends with this user" });
    }

    // Check if request already sent
    const alreadySent = currentUser.friendRequestsSent.some(req => req.to.toString() === targetUserId);
    if (alreadySent) {
      return res.status(400).json({ success: false, message: "Friend request already sent" });
    }

    // Check if request already received from target (they sent to us first)
    const alreadyReceived = currentUser.friendRequestsReceived.some(req => req.from.toString() === targetUserId);
    if (alreadyReceived) {
      return res.status(400).json({ success: false, message: "This user has already sent you a friend request. Please accept it instead." });
    }

    // Add to sent requests
    currentUser.friendRequestsSent.push({ to: targetUserId });
    // Add to target's received requests
    targetUser.friendRequestsReceived.push({ from: currentUserId });

    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.status(200).json({
      success: true,
      message: "Friend request sent successfully"
    });
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    return res.status(500).json({ success: false, message: "Failed to send friend request" });
  }
};

/**
 * POST /api/user/friends/accept/:requestId
 * Accept a friend request (requestId is the sender's user ID)
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { requestId: senderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const [currentUser, senderUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(senderId)
    ]);

    if (!senderUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if request exists
    const requestIndex = currentUser.friendRequestsReceived.findIndex(
      req => req.from.toString() === senderId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: "Friend request not found" });
    }

    // Remove from received requests
    currentUser.friendRequestsReceived.splice(requestIndex, 1);

    // Remove from sender's sent requests
    const sentIndex = senderUser.friendRequestsSent.findIndex(
      req => req.to.toString() === currentUserId
    );
    if (sentIndex !== -1) {
      senderUser.friendRequestsSent.splice(sentIndex, 1);
    }

    // Add to friends lists
    if (!currentUser.friends.includes(senderId)) {
      currentUser.friends.push(senderId);
    }
    if (!senderUser.friends.includes(currentUserId)) {
      senderUser.friends.push(currentUserId);
    }

    await Promise.all([currentUser.save(), senderUser.save()]);

    return res.status(200).json({
      success: true,
      message: "Friend request accepted"
    });
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    return res.status(500).json({ success: false, message: "Failed to accept friend request" });
  }
};

/**
 * POST /api/user/friends/reject/:requestId
 * Reject a friend request (requestId is the sender's user ID)
 */
export const rejectFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { requestId: senderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const [currentUser, senderUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(senderId)
    ]);

    if (!senderUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Remove from received requests
    const requestIndex = currentUser.friendRequestsReceived.findIndex(
      req => req.from.toString() === senderId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: "Friend request not found" });
    }

    currentUser.friendRequestsReceived.splice(requestIndex, 1);

    // Remove from sender's sent requests
    const sentIndex = senderUser.friendRequestsSent.findIndex(
      req => req.to.toString() === currentUserId
    );
    if (sentIndex !== -1) {
      senderUser.friendRequestsSent.splice(sentIndex, 1);
    }

    await Promise.all([currentUser.save(), senderUser.save()]);

    return res.status(200).json({
      success: true,
      message: "Friend request rejected"
    });
  } catch (err) {
    console.error("rejectFriendRequest error:", err);
    return res.status(500).json({ success: false, message: "Failed to reject friend request" });
  }
};

/**
 * DELETE /api/user/friends/cancel/:userId
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { userId: targetUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Remove from sent requests
    const sentIndex = currentUser.friendRequestsSent.findIndex(
      req => req.to.toString() === targetUserId
    );

    if (sentIndex === -1) {
      return res.status(404).json({ success: false, message: "Friend request not found" });
    }

    currentUser.friendRequestsSent.splice(sentIndex, 1);

    // Remove from target's received requests
    const receivedIndex = targetUser.friendRequestsReceived.findIndex(
      req => req.from.toString() === currentUserId
    );
    if (receivedIndex !== -1) {
      targetUser.friendRequestsReceived.splice(receivedIndex, 1);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.status(200).json({
      success: true,
      message: "Friend request cancelled"
    });
  } catch (err) {
    console.error("cancelFriendRequest error:", err);
    return res.status(500).json({ success: false, message: "Failed to cancel friend request" });
  }
};

/**
 * DELETE /api/user/friends/:friendId
 * Remove a friend
 */
export const removeFriend = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { friendId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: "Invalid friend ID" });
    }

    const [currentUser, friendUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(friendId)
    ]);

    if (!friendUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Remove from both friends lists
    currentUser.friends = currentUser.friends.filter(id => id.toString() !== friendId);
    friendUser.friends = friendUser.friends.filter(id => id.toString() !== currentUserId);

    await Promise.all([currentUser.save(), friendUser.save()]);

    return res.status(200).json({
      success: true,
      message: "Friend removed successfully"
    });
  } catch (err) {
    console.error("removeFriend error:", err);
    return res.status(500).json({ success: false, message: "Failed to remove friend" });
  }
};

/**
 * GET /api/user/friends
 * Get user's friends list
 */
export const getFriends = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(currentUserId)
      .populate('friends', 'username email level xp country currencySymbol currentStreak')
      .lean();

    return res.status(200).json({
      success: true,
      friends: user.friends || []
    });
  } catch (err) {
    console.error("getFriends error:", err);
    return res.status(500).json({ success: false, message: "Failed to get friends" });
  }
};

/**
 * GET /api/user/friends/requests/received
 * Get received friend requests
 */
export const getReceivedRequests = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(currentUserId)
      .populate('friendRequestsReceived.from', 'username email level xp country currencySymbol')
      .lean();

    return res.status(200).json({
      success: true,
      requests: user.friendRequestsReceived || []
    });
  } catch (err) {
    console.error("getReceivedRequests error:", err);
    return res.status(500).json({ success: false, message: "Failed to get friend requests" });
  }
};

/**
 * GET /api/user/friends/requests/sent
 * Get sent friend requests
 */
export const getSentRequests = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(currentUserId)
      .populate('friendRequestsSent.to', 'username email level xp country currencySymbol')
      .lean();

    return res.status(200).json({
      success: true,
      requests: user.friendRequestsSent || []
    });
  } catch (err) {
    console.error("getSentRequests error:", err);
    return res.status(500).json({ success: false, message: "Failed to get sent requests" });
  }
};

/**
 * GET /api/user/friends/search?q=username
 * Search users by username
 */
export const searchUsers = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Search query must be at least 2 characters" });
    }

    const currentUser = await User.findById(currentUserId).select('friends friendRequestsSent friendRequestsReceived');

    // Search users (exclude current user)
    const users = await User.find({
      _id: { $ne: currentUserId },
      username: { $regex: q.trim(), $options: 'i' }
    })
      .select('username email level xp country currencySymbol currentStreak')
      .limit(20)
      .lean();

    // Add relationship status to each user
    const usersWithStatus = users.map(user => {
      const userId = user._id.toString();
      let relationshipStatus = 'none';

      if (currentUser.friends.some(id => id.toString() === userId)) {
        relationshipStatus = 'friends';
      } else if (currentUser.friendRequestsSent.some(req => req.to.toString() === userId)) {
        relationshipStatus = 'request_sent';
      } else if (currentUser.friendRequestsReceived.some(req => req.from.toString() === userId)) {
        relationshipStatus = 'request_received';
      }

      return {
        ...user,
        relationshipStatus
      };
    });

    return res.status(200).json({
      success: true,
      users: usersWithStatus
    });
  } catch (err) {
    console.error("searchUsers error:", err);
    return res.status(500).json({ success: false, message: "Failed to search users" });
  }
};

/**
 * GET /api/user/friends/profile/:userId
 * Get public profile of a user
 */
export const getUserPublicProfile = async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const [targetUser, currentUser] = await Promise.all([
      User.findById(userId).select('username email level xp country currencySymbol currentStreak longestStreak createdAt friends').lean(),
      User.findById(currentUserId).select('friends friendRequestsSent friendRequestsReceived')
    ]);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Determine relationship status
    const targetUserId = userId.toString();
    let relationshipStatus = 'none';

    if (currentUserId === targetUserId) {
      relationshipStatus = 'self';
    } else if (currentUser.friends.some(id => id.toString() === targetUserId)) {
      relationshipStatus = 'friends';
    } else if (currentUser.friendRequestsSent.some(req => req.to.toString() === targetUserId)) {
      relationshipStatus = 'request_sent';
    } else if (currentUser.friendRequestsReceived.some(req => req.from.toString() === targetUserId)) {
      relationshipStatus = 'request_received';
    }

    return res.status(200).json({
      success: true,
      user: {
        ...targetUser,
        friendsCount: targetUser.friends.length,
        relationshipStatus
      }
    });
  } catch (err) {
    console.error("getUserPublicProfile error:", err);
    return res.status(500).json({ success: false, message: "Failed to get user profile" });
  }
};
