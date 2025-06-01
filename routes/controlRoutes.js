const express = require("express");
const router = express.Router();
const controlController = require("../controllers/controlController");
const adminMiddleware = require("../middleware/adminMiddleware"); // Đảm bảo bạn đã có middleware này

// Các API cho phần hiển thị thông tin chung trên control panel
router.get(
  "/control/total-products",
  adminMiddleware,
  controlController.getTotalProducts
);
router.get(
  "/control/total-orders",
  adminMiddleware,
  controlController.getTotalOrders
);
router.get(
  "/control/total-revenue",
  adminMiddleware,
  controlController.getTotalRevenue
);
// Frontend control.html gọi /api/control/low-stock-products và chỉ dùng data.length
// Sửa lại để controller trả về trực tiếp mảng, frontend sẽ lấy length
router.get("/control/low-stock-products", adminMiddleware, async (req, res) => {
  try {
    const lowStockProducts =
      await require("../models/productModel").getLowStockProducts();
    res.json(lowStockProducts); // Trả về mảng sản phẩm, frontend sẽ tính length
  } catch (error) {
    console.error("Error fetching low stock products for API:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// API cho bảng Tình trạng đơn hàng
router.get(
  "/control/orders",
  adminMiddleware,
  controlController.getRecentOrders
);

// API cho bảng Khách hàng
router.get(
  "/control/customers",
  adminMiddleware,
  controlController.getCustomers
);

// API cho biểu đồ (theo newchart.js đã tích hợp vào control.html)
// Frontend control.html gọi: /api/first-6-months-orders
router.get(
  "/first-6-months-orders",
  adminMiddleware,
  controlController.getFirst6MonthsOrders
);
// Frontend control.html gọi: /api/first-6-months-sales
router.get(
  "/first-6-months-sales",
  adminMiddleware,
  controlController.getFirst6MonthsSales
);

module.exports = router;
