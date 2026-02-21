
const express = require("express");
const router = express.Router();
const {
  addProduct,
  getProducts,
  getProductById,
  editProduct,
  deleteProduct,
} = require("../controllers/productController");
const { downloadQuotationPDF } = require("../controllers/pdfController");

// ✅ Product Routes
router.post("/add", addProduct);           // POST /api/products/add
router.get("/", getProducts);              // GET /api/products/
router.get("/download-pdf/:id", downloadQuotationPDF); // GET /api/products/download-pdf/:id
router.get("/:id", getProductById);        // GET /api/products/:id
router.put("/edit/:id", editProduct);      // PUT /api/products/edit/:id
router.delete("/delete/:id", deleteProduct); // DELETE /api/products/delete/:id

// Log routes for debugging
console.log("📋 Product routes loaded:");
console.log("   POST   /api/products/add");
console.log("   GET    /api/products/");
console.log("   GET    /api/products/:id");
console.log("   PUT    /api/products/edit/:id");
console.log("   DELETE /api/products/delete/:id");

module.exports = router;
