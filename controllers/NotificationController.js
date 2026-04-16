import { Notification } from "../models/Notification.js";
import Event from "../models/Event.js";
import { User } from "../models/User.js";

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .populate("eventId", "title date")
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Create notification (for testing)
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, eventId } = req.body;
    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "event",
      eventId,
    });
    res.status(201).json(notification);
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json(notification);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ msg: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Create notification for upcoming events
const createUpcomingEventNotifications = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find events happening tomorrow
    const upcomingEvents = await Event.find({
      date: {
        $gte: now,
        $lt: tomorrow
      }
    });

    for (const event of upcomingEvents) {
      // Create notification for all users (students and organizers)
      const { User } = await import("../models/User.js");
      const users = await User.find({});

      for (const user of users) {
        const existingNotification = await Notification.findOne({
          userId: user._id,
          eventId: event._id,
          type: "event"
        });

        if (!existingNotification) {
          await Notification.create({
            userId: user._id,
            title: "Upcoming Event",
            message: `${event.title} is happening tomorrow at ${event.time}`,
            type: "event",
            eventId: event._id
          });
          console.log(`✅ Created notification for user ${user.email}`);
        }
      }
    }
  } catch (err) {
    console.error("Error creating upcoming event notifications:", err);
  }
};

export {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createUpcomingEventNotifications
};
