// routes/friends.routes.js
import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
  getReceivedRequests,
  getSentRequests,
  searchUsers,
  getUserPublicProfile
} from "../controllers/friends.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Friend management
router.get("/", getFriends);                                    // Get friends list
router.delete("/:friendId", removeFriend);                      // Remove friend
router.get("/profile/:userId", getUserPublicProfile);           // Get public profile

// Friend requests
router.post("/request/:userId", sendFriendRequest);             // Send friend request
router.post("/accept/:requestId", acceptFriendRequest);         // Accept friend request
router.post("/reject/:requestId", rejectFriendRequest);         // Reject friend request
router.delete("/cancel/:userId", cancelFriendRequest);          // Cancel sent request

// Get requests
router.get("/requests/received", getReceivedRequests);          // Get received requests
router.get("/requests/sent", getSentRequests);                  // Get sent requests

// Search
router.get("/search", searchUsers);                             // Search users

export default router;
