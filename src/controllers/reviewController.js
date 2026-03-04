const Review = require("../models/Review");
const Item = require("../models/Item");

// Add Review
exports.addReview = async (req, res) => {
    try {
        const { itemId, rating, comment } = req.body;
        const userId = req.user.id;

        if (!itemId || !rating) {
            return res.status(400).json({ success: false, message: "Item ID and rating are required." });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found." });
        }

        // Check if user already reviewed this item
        const existingReview = await Review.findOne({ item: itemId, user: userId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "You have already reviewed this item." });
        }

        const review = new Review({
            item: itemId,
            user: userId,
            rating,
            comment
        });

        await review.save();

        res.status(201).json({ success: true, message: "Review added successfully.", review });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error adding review", error: err.message });
    }
};

// Get Latest Reviews (Public for Landing Page)
exports.getLatestReviews = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate({
                path: "user",
                select: "username profileImage role firstName lastName company"
            })
            .populate("item", "name");

        // Format for Landing Page expected structure
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            customer: {
                firstName: review.user ? (review.user.firstName || review.user.username) : "Anonymous",
                lastName: review.user ? (review.user.lastName || "") : "",
                company: review.user ? (review.user.company || "Verified Customer") : "Verified Customer",
                role: review.user ? review.user.role : "customer",
                profileImage: review.user ? review.user.profileImage : null
            },
            comment: review.comment,
            rating: review.rating,
            itemName: review.item ? review.item.name : "Product"
        }));

        res.json({ success: true, data: { reviews: formattedReviews } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching latest reviews", error: err.message });
    }
};

// Get All Reviews (Admin only)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .populate("user", "username email role firstName lastName")
            .populate("item", "name price");
        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching all reviews", error: err.message });
    }
};

// Get My Reviews (Customer only)
exports.getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviews = await Review.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate("item", "name price image");
        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching your reviews", error: err.message });
    }
};

// Update Review (Only by owner)
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found." });
        }

        if (review.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to update this review." });
        }

        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        await review.save();

        res.json({ success: true, message: "Review updated successfully.", review });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating review", error: err.message });
    }
};

// Delete Review (Owner or Admin)
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found." });
        }

        // Check if admin or owner
        if (review.user.toString() !== userId && userRole !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized to delete this review." });
        }

        await Review.findByIdAndDelete(reviewId);

        res.json({ success: true, message: "Review deleted successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting review", error: err.message });
    }
};
