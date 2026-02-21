const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "secret_key";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ success: false, message: "Authentication token required" });

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid or expired token" });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ success: false, message: "Administrative access required" });
    }
};

module.exports = { authenticateToken, isAdmin, SECRET };
