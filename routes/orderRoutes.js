const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }
  req.userId = req.session.userId;
  next();
};

router.post("/checkout", authMiddleware, orderController.checkout); // Thêm route này
router.get("/", authMiddleware, orderController.getOrders);
router.get("/:orderId", authMiddleware, orderController.getOrderDetails);
router.post(
  "/orders/:orderId/confirm",
  authMiddleware,
  orderController.confirmOrder
);
module.exports = router;
