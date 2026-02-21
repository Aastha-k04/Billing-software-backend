
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { authenticateToken, isAdmin, SECRET } = require("./src/middleware/auth");

const User = require("./src/models/User");
const Product = require("./src/models/Product");
const Item = require("./src/models/Item");

// ====================== EXPRESS APP ===========================
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================== MONGODB CONNECTION ========================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ MongoDB connected");

    try {
      await User.collection.dropIndex("email_1");
      console.log("✅ Dropped old email index");
    } catch (err) {
      if (err.message.includes("index not found")) {
        console.log("ℹ️ No email index to drop (OK)");
      }
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

mongoose.connection.on("connected", () => console.log("🟢 Mongoose connected"));
mongoose.connection.on("error", (err) => console.log("🔴 Mongoose error:", err));
mongoose.connection.on("disconnected", () => console.log("🟡 Mongoose disconnected"));

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("👋 MongoDB disconnected");
  process.exit(0);
});

// ==================== ADD DUMMY SALES USER ====================
(async () => {
  try {
    const exists = await User.findOne({ username: "user1" });
    if (!exists) {
      const dummy = new User({
        username: "user1",
        password: "password123",
        role: "sales"
      });
      await dummy.save();
      console.log("✅ Dummy user1 (sales) created");
    }
  } catch (err) {
    console.log("ℹ️ Dummy user creation:", err.message);
  }
})();

// ======================= JWT MIDDLEWARES ======================

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
}

// ====================== AUTH ROUTES ===========================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password, role, phone, email } = req.body;
    console.log("📝 Signup Attempt:", { username, role, phone, email });

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: "Username, password and role are required." });
    }

    if (role === "customer" && !phone) {
      return res.status(400).json({ success: false, message: "Phone number is required for customers." });
    }

    const existingUser = await User.findOne({
      $or: [
        { username },
        { phone: phone || undefined },
        { email: email || undefined }
      ].filter(q => Object.values(q)[0] !== undefined)
    });

    if (existingUser) {
      console.warn("⚠️ Signup Conflict:", { username, phone, email });
      return res.status(400).json({ success: false, message: "User with this username, phone or email already exists." });
    }

    const normalizedPhone = (phone && phone.trim()) || undefined;
    const normalizedEmail = (email && email.trim()) || undefined;

    const user = new User({
      username,
      password,
      role,
      phone: role === "customer" ? normalizedPhone : undefined,
      email: normalizedEmail
    });

    await user.save();
    console.log("✅ User Registered:", username);

    res.status(201).json({ success: true, message: "Registration successful." });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ success: false, message: "Signup error", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Find user by username, email, or phone
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username },
        { phone: username }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // Role check if provided
    if (role && user.role !== role) {
      return res.status(401).json({ success: false, message: `Access denied for role: ${role}` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
      phone: user?.phone
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: "24h" });

    res.json({ success: true, token, user: payload });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during login", error: err.message });
  }
});

// ================== BASIC TEST ROUTES =========================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Quantile Server Running",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    time: new Date(),
  });
});

app.get("/api/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

const productRoutes = require("./src/routes/productRoutes.js");
const adminRoutes = require("./src/routes/adminRoutes.js");
const itemRoutes = require("./src/routes/itemRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const customerRoutes = require("./src/routes/customerRoutes.js");
const reviewRoutes = require("./src/routes/reviewRoutes.js");

app.use("/api/products", productRoutes);
app.use("/api/items", itemRoutes);
app.use("/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/reviews", reviewRoutes);

// ===================== ERROR HANDLERS ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    route: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message,
  });
});

// ===================== START SERVER ============================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});