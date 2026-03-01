const User = require("../models/User");
const Product = require("../models/Product");
const Item = require("../models/Item");
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "your-secret-key";

// Register Customer
exports.registerCustomer = async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        if (!username || !password || !phone) {
            return res.status(400).json({ success: false, message: "Username, password and phone are required." });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { phone }, { email: email || undefined }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this username, email or phone already exists." });
        }

        const user = new User({
            username,
            email,
            phone,
            password,
            role: "customer"
        });

        await user.save();

        res.status(201).json({ success: true, message: "Customer registered successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Registration error", error: err.message });
    }
};

// Login Customer
exports.loginCustomer = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be username, email or phone

        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier },
                { phone: identifier }
            ]
        });

        if (!user || user.role !== "customer" || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        const payload = { id: user._id, username: user.username, role: user.role, phone: user.phone };
        const token = jwt.sign(payload, SECRET, { expiresIn: "24h" });

        res.json({ success: true, token, user: payload });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login error", error: err.message });
    }
};

// Get Current Customer (Get Me)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching user data", error: err.message });
    }
};

// Update Customer
exports.updateCustomer = async (req, res) => {
    try {
        const { username, email, phone, address } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (username !== undefined) user.username = username;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;

        await user.save();
        res.json({ success: true, message: "Profile updated successfully", user: { id: user._id, username: user.username, email: user.email, phone: user.phone, address: user.address } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update error", error: err.message });
    }
};

// Delete Customer Account
exports.deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({ success: true, message: "Account deleted successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Deletion error", error: err.message });
    }
};

// Get Quotations for Customer (based on phone number OR customerId)
exports.getMyQuotations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log("⚠️ 400 Bad Request: User not found in database for ID:", req.user.id);
            return res.status(400).json({ success: false, message: "User not found." });
        }

        console.log("🔍 Fetching quotations for user:", user.username, "| Phone:", user.phone, "| ID:", user._id);

        // Build query conditions - match by customerId OR phone number
        const queryConditions = [{ customerId: user._id }];
        if (user.phone) {
            queryConditions.push({ number: user.phone });
        }

        const quotations = await Product.find({ $or: queryConditions })
            .populate("items.item")
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${quotations.length} quotations for user ${user.username}`);
        res.json({ success: true, quotations });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching quotations", error: err.message });
    }
};
