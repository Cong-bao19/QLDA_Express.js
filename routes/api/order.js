const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const authMiddleware = require("../../middleware/authMiddleware");

router.post("/checkout", authMiddleware, orderController.checkout); // Thêm route này
router.get("/", authMiddleware, orderController.getOrdersByUser);
router.get("/:orderId", authMiddleware, orderController.getOrderDetails);

module.exports = router;
