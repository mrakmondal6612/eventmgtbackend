import express from "express";
import { getUserDetails, updateUserDetails, updateProfilePhoto, upload, fetchUserSuggestions, addUserConnection } from "../controllers/UserController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/details", authMiddleware, getUserDetails);
router.put("/details", authMiddleware, updateUserDetails);
router.put("/update-photo", authMiddleware, upload.single("photo"), updateProfilePhoto);
router.get("/suggestions", authMiddleware, fetchUserSuggestions);
router.post("/add-connection/:userId", authMiddleware, addUserConnection);

export default router;
