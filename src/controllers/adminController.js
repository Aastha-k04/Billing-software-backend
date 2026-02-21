require("dotenv").config(); // make sure dotenv is installed
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // fallback password

// 🔐 Verify Admin Password
exports.verifyAdminPassword = async (req, res) => {
  try {
    console.log("🔓 Admin Verification Attempt:");
    console.log("   Body:", req.body);
    console.log("   Headers:", req.headers["content-type"]);

    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
        hint: "Ensure you are sending a JSON body with a 'password' field and 'Content-Type: application/json' header."
      });
    }

    if (password === ADMIN_PASSWORD) {
      return res.status(200).json({ success: true, message: "Access granted" });
    } else {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }
  } catch (error) {
    console.error("❌ Admin Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
