const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const itemRoutes = require("./itemRoutes");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const customerRoutes = require("./customerRoutes");
const reviewRoutes = require("./reviewRoutes");
const passwordRoutes = require("./passwordRoutes");

const purchaseRoutes = require("./purchaseRoutes");

module.exports = (app) => {
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/items", itemRoutes);
    app.use("/admin", adminRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/customer", customerRoutes);
    app.use("/api/reviews", reviewRoutes);
    app.use("/api/password", passwordRoutes);
    app.use("/api/purchase", purchaseRoutes);
};
