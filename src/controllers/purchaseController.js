const PurchaseRequest = require("../models/PurchaseRequest");
const User = require("../models/User");
const Item = require("../models/Item");

exports.createRequest = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!itemId) {
            return res.status(400).json({ success: false, message: "Item ID is required" });
        }

        // Check if item exists
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Check if already requested (optional, but good for UX)
        const existing = await PurchaseRequest.findOne({ customer: userId, item: itemId, status: "pending" });
        if (existing) {
            return res.status(400).json({ success: false, message: "Purchase request already pending for this item" });
        }

        const request = new PurchaseRequest({
            customer: userId,
            item: itemId,
        });

        await request.save();

        res.status(201).json({ success: true, message: "Purchase request sent to sales team", request });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error creating purchase request", error: err.message });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        // Only Sales/Admin should call this usually, but we'll enforce that in routes
        const requests = await PurchaseRequest.find({ status: "pending" })
            .populate("customer", "username email phone address")
            .populate("item", "name nrp mrp image description")
            .sort({ createdAt: -1 });

        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching requests", error: err.message });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await PurchaseRequest.findByIdAndUpdate(id, { status }, { new: true });
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        res.json({ success: true, message: `Request status updated to ${status}`, request });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating request", error: err.message });
    }
};
