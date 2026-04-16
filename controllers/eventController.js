import Event from "../models/Event.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

// Load environment variables at module level
dotenv.config();

// Configure Cloudinary
let eventUpload;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Cloudinary Storage Configuration for Event Thumbnails
  const eventStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "campus-connekt/events",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 1200, height: 630, crop: "fill" },
      ],
    },
  });
  eventUpload = multer({
    storage: eventStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });
} else {
  console.warn("Cloudinary not configured. Using memory storage - file upload disabled.");
  eventUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });
}

// Create Event
const createEvent = async (req, res) => {
  const { title, description, thumbnail, date, time, schedule } = req.body;

  // Ensure that the user is authenticated and exists
  if (!req.user || !req.user._id) {
    return res.status(401).json({ msg: "Unauthorized: No user found" });
  }

  // Validate required fields
  if (!title || !description || !date || !time) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    // Use Cloudinary URL if file is uploaded, otherwise use thumbnail from body
    let eventThumbnail = thumbnail || "";
    if (req.file && req.file.path) {
      eventThumbnail = req.file.path;
    } else if (req.file && !process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(400).json({ msg: "Cloudinary not configured. Please provide a thumbnail URL instead of uploading a file." });
    }

    // Create a new event and associate it with the authenticated user (organizer and createdBy)
    const event = new Event({
      title,
      description,
      thumbnail: eventThumbnail,
      date,
      time,
      schedule,
      organizer: req.user._id,
      createdBy: req.user._id,
    });

    // Save the event to the database
    await event.save();

    // Respond with the created event
    res.status(201).json(event);
  } catch (err) {
    console.error("Error creating event:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};



// Get All Events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer", "firstName lastName email")
      .populate("comments.userId", "firstName lastName")
      .populate("enrolled", "firstName lastName email");

    res.json(events);
  } catch (err) {
    console.error("❌ Error fetching events:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


// Update Event
const updateEvent = async (req, res) => {
  try {
    const { title, description, date, time, schedule, thumbnail } = req.body;

    // Use Cloudinary URL if file is uploaded, otherwise use thumbnail from body
    const eventThumbnail = req.file ? req.file.path : thumbnail;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, time, schedule, thumbnail: eventThumbnail },
      { new: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ msg: "Event not found" });
    }
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Delete Event
 // Example in your eventController.js
const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ msg: "Event not found" });
    }
    res.status(200).json({ msg: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};


// Like or Unlike Event
const likeEvent = async (req, res) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ msg: "Unauthorized: No user ID found" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    if (event.likes.includes(req.userId)) {
      event.likes = event.likes.filter((userId) => userId.toString() !== req.userId);
    } else {
      event.likes.push(req.userId);
    }

    await event.save();
    res.json(event);
  } catch (err) {
    console.error("❌ Error liking event:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Add Comment to Event
const addComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!req.userId) {
    return res.status(401).json({ msg: "Unauthorized: No user ID found" });
  }

  if (!text) {
    return res.status(400).json({ msg: "Comment text is required" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    event.comments.push({ userId: req.userId, text, date: new Date() });
    await event.save();

    res.json(event);
  } catch (err) {
    console.error("❌ Error adding comment:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Enroll in Event
const enrollEvent = async (req, res) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ msg: "Unauthorized: No user ID found" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    if (event.enrolled.includes(req.userId)) {
      return res.status(400).json({ msg: "Already enrolled in this event" });
    }

    event.enrolled.push(req.userId);
    await event.save();

    // Create notification for the event organizer
    const { Notification } = await import("../models/Notification.js");
    await Notification.create({
      userId: event.organizer,
      title: "New Enrollment",
      message: `Someone enrolled in your event: ${event.title}`,
      type: "event",
      eventId: event._id,
    });

    res.json(event);
  } catch (err) {
    console.error("Error enrolling in event:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Unenroll from Event
const unenrollEvent = async (req, res) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ msg: "Unauthorized: No user ID found" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    if (!event.enrolled) {
      event.enrolled = [];
    }

    event.enrolled = event.enrolled.filter((userId) => userId.toString() !== req.userId);
    await event.save();

    res.json(event);
  } catch (err) {
    console.error("Error unenrolling from event:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export { createEvent, getEvents, updateEvent, deleteEvent, likeEvent, addComment, enrollEvent, unenrollEvent, eventUpload };
