const express = require("express");
const router = express.Router();
const {
    changeOwnPassword,
    adminChangePassword,
    adminChangeOwnPassword
} = require("../controllers/passwordController");

router.post("/change-own", changeOwnPassword);          // USER
router.post("/admin-change", adminChangePassword);       // ADMIN changes others
router.post("/admin-change-own", adminChangeOwnPassword); // ADMIN changes own password

module.exports = router;
