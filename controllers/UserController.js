import { User } from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage Configuration for Profile Photos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "campus-connekt/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 500, height: 500, crop: "fill" },
    ],
  },
});

const upload = multer({ storage });

// 🔹 Get User Details
const getUserDetails = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }

    // Select the photo field along with other details
    const user = await User.findById(userId).select("firstName lastName email photo");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Construct full URL for the photo if it exists
    const photoUrl = user.photo
      ? `${req.protocol}://${req.get("host")}/uploads/${user.photo}`
      : null;

    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photoUrl, // Return full URL in photoUrl
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// 🔹 Update User Profile (Text Fields Only)
const updateUserDetails = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized: No user ID found" });

    const { firstName, lastName, email } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "First name, last name, and email are required" });
    }

    console.log(`Updating details for user: ${userId}`);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔹 Update Profile Photo (Using Cloudinary)
const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized: No user ID found" });

    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Delete old photo from Cloudinary if exists
    if (user.photo && user.photo.includes("cloudinary.com")) {
      const publicId = user.photo.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`campus-connekt/profiles/${publicId}`);
    }

    // Update and save new photo URL from Cloudinary
    user.photo = req.file.path;
    await user.save();

    res.status(200).json({
      message: "Profile photo updated successfully",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photo: user.photo,
      },
    });
  } catch (error) {
    console.error("Error updating profile photo:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔹 Fetch User Suggestions (Full Name & Profile Photo)
const fetchUserSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("connections");
    const connectedUserIds = currentUser?.connections || [];
    
    const users = await User.find(
      { 
        _id: { $ne: req.user.id, $nin: connectedUserIds }, 
        type: { $ne: "organizer" } 
      },
      "firstName lastName email photo" // Select only required fields
    );

    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching suggestions:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 🔹 Add User to Connections
const addUserConnection = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    // Prevent adding self
    if (currentUserId === userId) {
      return res.status(400).json({ error: "Cannot add yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already connected
    if (currentUser.connections.includes(userId)) {
      return res.status(400).json({ error: "Already connected" });
    }

    // Add to connections
    currentUser.connections.push(userId);
    await currentUser.save();

    res.status(200).json({ message: "User added to connections successfully" });
  } catch (err) {
    console.error("❌ Error adding user connection:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const fetchData = async(req, res)=>{
  try{
     console.log("get users");
  }
  catch(err){
    console.log(err);
  }
}

export {
  getUserDetails,
  updateUserDetails,
  updateProfilePhoto,
  upload,
  fetchUserSuggestions,
  addUserConnection,
};
