const express = require("express");
const router = express.Router();
const {
    addReview,
    getLatestReviews,
    getAllReviews,
    getMyReviews,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Public routes
router.get("/latest", getLatestReviews);

// Protected routes
router.post("/", authenticateToken, addReview);
router.get("/my", authenticateToken, getMyReviews);
router.get("/all", authenticateToken, isAdmin, getAllReviews);
router.put("/:reviewId", authenticateToken, updateReview);
router.delete("/:reviewId", authenticateToken, deleteReview);

module.exports = router;
