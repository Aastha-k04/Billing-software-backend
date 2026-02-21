const express = require("express");
const router = express.Router();
const {
    registerCustomer,
    loginCustomer,
    getMe,
    updateCustomer,
    deleteAccount,
    getMyQuotations
} = require("../controllers/customerController");
const { authenticateToken } = require("../middleware/auth");

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.get("/me", authenticateToken, getMe);
router.put("/update", authenticateToken, updateCustomer);
router.delete("/delete", authenticateToken, deleteAccount);
router.get("/quotations", authenticateToken, getMyQuotations);

module.exports = router;
