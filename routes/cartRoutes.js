const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCart,
} = require("../controllers/cartController");

// Route thêm sản phẩm vào giỏ hàng
router.post("/add", addToCart);

// Route lấy giỏ hàng và chi tiết
router.get("/", getCart);

// Route cập nhật giỏ hàng (tăng/giảm số lượng, xóa sản phẩm)
router.post("/update", updateCart);

module.exports = router;
