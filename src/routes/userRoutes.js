const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const { authenticateToken, isAdmin } = require("../middleware/auth");

// ==================== ROUTES ==================== //

// GET ALL USERS
router.get("/", async (req, res) => {
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
// REGISTER USER
router.post("/register", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password required" });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        const newUser = new User({ username, password, role: role || "sales" });
        await newUser.save();

        res.status(201).json({ success: true, message: "User created" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create user" });
    }
});

// DELETE USER
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

// CHANGE PASSWORD
router.post("/password/change", async (req, res) => {
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
