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

// Get Reviews for an Item
exports.getItemReviews = async (req, res) => {
    try {
        const { itemId } = req.params;
        const reviews = await Review.find({ item: itemId }).populate("user", "username");
        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching reviews", error: err.message });
    }
};

// Delete Review (Only by owner)
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found." });
        }

        if (review.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this review." });
        }

        await Review.findByIdAndDelete(reviewId);

        res.json({ success: true, message: "Review deleted successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting review", error: err.message });
    }
};
