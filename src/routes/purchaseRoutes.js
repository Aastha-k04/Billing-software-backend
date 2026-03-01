const express = require("express");
const router = express.Router();
const { createRequest, getPendingRequests, updateRequestStatus } = require("../controllers/purchaseController");
const { authenticateToken, isAdmin } = require("../middleware/auth"); // Assuming this exists based on common patterns

// Customer creates a request
router.post("/add", authenticateToken, createRequest);

// Sales/Admin fetches pending requests
router.get("/pending", authenticateToken, getPendingRequests);

// Update status (e.g., when quotation is generated)
router.put("/update/:id", authenticateToken, updateRequestStatus);

module.exports = router;
