import express from "express";
import multer from "multer";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  likeEvent,
  addComment,
  enrollEvent,
  unenrollEvent,
  eventUpload,
} from "../controllers/eventController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: "File upload error: " + err.message });
  } else if (err) {
    return res.status(500).json({ msg: "Upload error: " + err.message });
  }
  next();
};

// Create an event
router.post("/create", authMiddleware, eventUpload.single("thumbnail"), handleMulterError, createEvent);

// Get all events
router.get("/getevent", getEvents);

// Update an event by its ID
router.put("/:id", authMiddleware, eventUpload.single("thumbnail"), handleMulterError, updateEvent);

// Delete an event by its ID
router.delete("/:id", authMiddleware, deleteEvent);

// Like an event by its ID
router.put("/:id/like", authMiddleware, likeEvent);

// Add a comment to an event by its ID
router.post("/:id/comment", authMiddleware, addComment);

// Enroll in an event
router.post("/:id/enroll", authMiddleware, enrollEvent);

// Unenroll from an event
router.post("/:id/unenroll", authMiddleware, unenrollEvent);

export default router;
