const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const { authenticateToken, isAdmin } = require("../middleware/auth");
const userController = require("../controllers/userController");
const path = require("path");
const multer = require("multer");

// Configure Multer for Profile Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/profiles/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
    }
});

// ==================== ROUTES ==================== //

// GET CURRENT USER PROFILE
router.get("/me", authenticateToken, userController.getMe);

// UPDATE PROFILE
router.put("/update", authenticateToken, userController.updateProfile);

// UPLOAD PROFILE IMAGE
router.post("/upload-profile-image", authenticateToken, upload.single("profileImage"), userController.uploadProfileImage);

// GET ALL USERS (Admin Only)
router.get("/", authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
});
// REGISTER USER (Admin Only)
router.post("/register", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, email, password, role, phone, address } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ success: false, message: "Username, email and password required" });
        }

        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(400).json({ success: false, message: "Username or email already exists" });
        }

        const newUser = new User({ username, email, password, role: role || "sales", phone, address });
        await newUser.save();

        res.status(201).json({ success: true, message: "User created" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create user" });
    }
});

// DELETE USER (Admin Only)
router.delete("/:userId", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account" });
        }

        const deleted = await User.findByIdAndDelete(userId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
});

// CHANGE PASSWORD (Admin Only)
router.post("/password/change", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: "Password updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update password" });
    }
});

module.exports = router;
