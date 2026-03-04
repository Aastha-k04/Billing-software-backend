const User = require("../models/User");
const fs = require("fs");
const path = require("path");

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Delete old image if it exists
        if (user.profileImage) {
            const oldImagePath = path.join(__dirname, "../../", user.profileImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update user with new image path
        const imagePath = `uploads/profiles/${req.file.filename}`;
        user.profileImage = imagePath;
        await user.save();

        res.json({
            success: true,
            message: "Profile image uploaded successfully",
            profileImage: imagePath
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: "Failed to upload profile image" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, email, phone, address, firstName, lastName, company } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (company !== undefined) user.company = company;

        await user.save();
        res.json({ success: true, message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};
