const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const adminMiddleware = require("../../middleware/adminMiddleware");

router.get("/", adminMiddleware, orderController.getOrdersForAdmin);
router.get("/status", adminMiddleware, orderController.getOrderStatusForAdmin);
router.get("/total", adminMiddleware, orderController.getTotalOrders);
router.put("/status/:id", adminMiddleware, orderController.updateOrderStatus);
router.delete("/:id", adminMiddleware, orderController.deleteOrder);
router.get("/export", adminMiddleware, orderController.exportOrders);
router.get("/:orderId", adminMiddleware, orderController.getOrderByIdForAdmin);

module.exports = router;
