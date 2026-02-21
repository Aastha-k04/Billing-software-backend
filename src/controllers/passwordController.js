// const User = require("../models/User");
// const bcrypt = require("bcrypt");

// // 🔐 Change Own Password (Both Sales & Admin can use this)
// exports.changeOwnPassword = async (req, res) => {
//     try {
//         const { currentPassword, newPassword } = req.body;
//         const userId = req.user.id; // From JWT token

//         // Validation
//         if (!currentPassword || !newPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Current password and new password are required"
//             });
//         }

//         if (newPassword.length < 6) {
//             return res.status(400).json({
//                 success: false,
//                 message: "New password must be at least 6 characters long"
//             });
//         }

//         // Find user
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         // Verify current password
//         const isMatch = await user.comparePassword(currentPassword);
//         if (!isMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Current password is incorrect"
//             });
//         }

//         // Update password (will be hashed by pre-save hook)
//         user.password = newPassword;
//         await user.save();

//         console.log(`✅ User ${user.username} (${user.role}) changed their own password`);

//         res.status(200).json({
//             success: true,
//             message: "Password changed successfully"
//         });

//     } catch (error) {
//         console.error("❌ Change own password error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Server error",
//             error: error.message
//         });
//     }
// };

// // 🔐 Admin Changes Any User's Password
// exports.changeUserPassword = async (req, res) => {
//     try {
//         const { userId, newPassword } = req.body;
//         const adminId = req.user.id; // From JWT token
//         const adminRole = req.user.role;

//         // Double-check admin role (middleware already checks this)
//         if (adminRole !== "admin") {
//             return res.status(403).json({
//                 success: false,
//                 message: "Only admins can change other users' passwords"
//             });
//         }

//         // Validation
//         if (!userId || !newPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User ID and new password are required"
//             });
//         }

//         if (newPassword.length < 6) {
//             return res.status(400).json({
//                 success: false,
//                 message: "New password must be at least 6 characters long"
//             });
//         }

//         // Find target user
//         const targetUser = await User.findById(userId);
//         if (!targetUser) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Target user not found"
//             });
//         }

//         // Update password (will be hashed by pre-save hook)
//         targetUser.password = newPassword;
//         await targetUser.save();

//         console.log(`✅ Admin ${req.user.username} changed password for user ${targetUser.username} (${targetUser.role})`);

//         res.status(200).json({
//             success: true,
//             message: `Password changed successfully for user: ${targetUser.username}`,
//             user: {
//                 id: targetUser._id,
//                 username: targetUser.username,
//                 role: targetUser.role
//             }
//         });

//     } catch (error) {
//         console.error("❌ Admin change user password error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Server error",
//             error: error.message
//         });
//     }
// };


const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ---------------------------------------
// USER -> CHANGE OWN PASSWORD
// ---------------------------------------
exports.changeOwnPassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields required"
            });
        }

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Match old password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Save new password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: "Password changed successfully" });

    } catch (error) {
        console.error("Change own password error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------------------------------------
// ADMIN -> CHANGE ANY USER'S PASSWORD
// ---------------------------------------
exports.adminChangeOwnPassword = async (req, res) => {
    try {
        const { adminId, currentPassword, newPassword } = req.body;

        if (!adminId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const user = await User.findById(adminId);
        if (!user) return res.status(404).json({ success: false, message: "Admin not found" });

        // Check role
        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can use this API"
            });
        }

        // Check old password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Save new password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: "Admin password updated successfully" });

    } catch (error) {
        console.error("Admin Change Own Password error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
