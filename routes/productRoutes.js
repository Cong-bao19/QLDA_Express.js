const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const adminMiddleware = require("../middleware/adminMiddleware");
const methodOverride = require("method-override");

// Sử dụng method-override để hỗ trợ PUT từ form

router.get("/", productController.getAllProducts);
router.get("/page", productController.getProductsByPage);
router.get("/search", productController.searchProducts);
router.get("/:id", productController.getProductById);

router.post("/", adminMiddleware, productController.createProduct);
router.delete("/:id", adminMiddleware, productController.deleteProduct);
router.put("/:id", adminMiddleware, productController.updateProduct);

module.exports = router;
