import express from "express";
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/NotificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create notification (for testing)
router.post("/create", authMiddleware, createNotification);

// Get all notifications for a user
router.get("/", authMiddleware, getNotifications);

// Mark notification as read
router.put("/:notificationId/read", authMiddleware, markAsRead);

// Mark all notifications as read
router.put("/read-all", authMiddleware, markAllAsRead);

// Delete notification
router.delete("/:notificationId", authMiddleware, deleteNotification);

export default router;
