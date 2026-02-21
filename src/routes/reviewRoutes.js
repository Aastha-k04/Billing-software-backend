const express = require("express");
const router = express.Router();
const {
    addReview,
    getItemReviews,
    deleteReview
} = require("../controllers/reviewController");
const { authenticateToken } = require("../middleware/auth");
const jwt = require("jsonwebtoken");


router.post("/", authenticateToken, addReview);
router.get("/:itemId", getItemReviews);
router.delete("/:reviewId", authenticateToken, deleteReview);

module.exports = router;
