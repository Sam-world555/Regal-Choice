const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// adjust these to match your existing auth middleware names/paths
const { protect, isAdmin } = require("../middleware/authMiddleware");

router.get("/", protect, isAdmin, getNotifications);
router.get("/unread-count", protect, isAdmin, getUnreadCount);
router.patch("/:id/read", protect, isAdmin, markAsRead);
router.patch("/mark-all-read", protect, isAdmin, markAllAsRead);

module.exports = router;