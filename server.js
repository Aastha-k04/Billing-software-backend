
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
// Auth routes are moved to src/routes/authRoutes.js and used via app.use("/api/auth", authRoutes)

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
const authRoutes = require("./src/routes/authRoutes.js");

app.use("/api/auth", authRoutes);
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