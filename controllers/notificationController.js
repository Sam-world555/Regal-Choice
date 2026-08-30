const Notification = require("../models/Notification");

// GET /api/notifications — latest first, admin only
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("order")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (error) {
    console.log("GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/notifications/unread-count — for the bell badge
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ count });
  } catch (error) {
    console.log("GET UNREAD COUNT ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/notifications/:id/read — mark one as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.log("MARK AS READ ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/notifications/mark-all-read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.log("MARK ALL AS READ ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};