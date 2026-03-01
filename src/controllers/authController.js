const User = require("../models/User");
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET; // Use strong .env key in production

exports.signup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, role, phone } = req.body;
        console.log(req.body, "body data");

        // Required fields check
        if (!username || !email || !password || !confirmPassword || !role) {
            return res.status(400).json({ success: false, message: "All fields are required (username, email, password, confirmPassword, role)." });
        }

        // Password match check
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        // Role check
        if (!["admin", "sales", "customer"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role." });
        }

        // Check existing user by username or email
        const existing = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (existing) {
            if (existing.username === username) {
                return res.status(400).json({ success: false, message: "Username already exists." });
            }
            if (existing.email === email) {
                return res.status(400).json({ success: false, message: "Email already exists." });
            }
        }

        // Save user
        const user = new User({ username, email, password, role, phone });
        await user.save();

        res.status(201).json({ success: true, message: "User registered successfully." });

    } catch (err) {
        res.status(500).json({ success: false, message: "Signup error", error: err.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        // Role check: If user is admin, allow login regardless of selected role.
        // Otherwise, the selected role must match the user's actual role.
        const { role } = req.body;
        if (user.role !== "admin" && role && user.role !== role) {
            return res.status(401).json({ success: false, message: `Access denied for role: ${role}` });
        }
        const payload = { id: user._id, username: user.username, email: user.email, role: user.role, phone: user.phone };
        const token = jwt.sign(payload, SECRET, { expiresIn: "24h" });
        res.json({ success: true, token, user: payload });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login error", error: err.message });
    }
};
