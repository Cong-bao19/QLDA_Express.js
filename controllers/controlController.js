const ProductModel = require("../models/productModel");
const OrderModel = require("../models/orderModel");
// Giả sử userModel.js export UserModel như sau, và UserModel có phương thức getAllUsers
// Nếu userModel.js có cấu trúc export khác, bạn cần điều chỉnh dòng require này
const { UserModel } = require("../models/userModel");
const pool = require("../db"); // Cần pool để query trực tiếp nếu model không có sẵn hàm

const controlController = {
  getTotalProducts: async (req, res) => {
    try {
      const result = await ProductModel.getTotalProducts(); // Hàm này đã có trong productModel.js
      res.json(result); // Expects { total_products: XX }
    } catch (error) {
      console.error("Error fetching total products:", error);
      res.status(500).json({ message: "Lỗi server khi lấy tổng sản phẩm" });
    }
  },

  getTotalOrders: async (req, res) => {
    try {
      const result = await OrderModel.getTotalOrders(); // Hàm này đã có trong orderModel.js
      res.json(result); // Expects { total_orders: XX }
    } catch (error) {
      console.error("Error fetching total orders:", error);
      res.status(500).json({ message: "Lỗi server khi lấy tổng đơn hàng" });
    }
  },

  getTotalRevenue: async (req, res) => {
    try {
      const result = await OrderModel.getTotalRevenue(); // Hàm mới thêm vào orderModel.js
      res.json({ total_revenue: result.total_revenue || 0 });
    } catch (error) {
      console.error("Error fetching total revenue:", error);
      res.status(500).json({ message: "Lỗi server khi lấy tổng doanh thu" });
    }
  },

  getLowStockProducts: async (req, res) => {
    try {
      // productModel.getLowStockProducts() trả về danh sách sản phẩm
      // Frontend control.html chỉ cần số lượng sản phẩm sắp hết hàng
      const lowStockProducts = await ProductModel.getLowStockProducts(); // Hàm này đã có
      res.json({ count: lowStockProducts.length, products: lowStockProducts }); // Trả về count để frontend dễ dùng
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res
        .status(500)
        .json({ message: "Lỗi server khi lấy sản phẩm sắp hết hàng" });
    }
  },

  // API cho bảng "TÌNH TRẠNG ĐƠN HÀNG"
  getRecentOrders: async (req, res) => {
    try {
      // Sử dụng lại hàm getOrderStatusForAdmin từ orderModel
      // Hàm này trả về: o.orderId AS id, u.full_name AS customer_name, o.totalmoney AS total_amount, o.status
      // Frontend control.html mong muốn: orderId, full_name, totalmoney, status
      // Cần alias lại cho phù hợp với frontend
      const orders = await OrderModel.getOrderStatusForAdmin();
      const formattedOrders = orders.map((order) => ({
        orderId: order.id, // Alias từ 'id' của model
        full_name: order.customer_name, // Alias từ 'customer_name'
        totalmoney: order.total_amount, // Alias từ 'total_amount'
        status: order.status,
      }));
      res.json(formattedOrders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res
        .status(500)
        .json({ message: "Lỗi server khi lấy danh sách đơn hàng gần đây" });
    }
  },

  // API cho bảng "KHÁCH HÀNG"
  getCustomers: async (req, res) => {
    try {
      // Giả định UserModel.getAllUsers() trả về danh sách user với các trường cần thiết
      // Frontend control.html mong muốn: customerId, full_name, address, uPhone
      const users = await UserModel.getAllUsers(); // Phương thức này cần tồn tại trong userModel.js

      // Bạn có thể cần map lại tên trường nếu tên trong DB khác với frontend
      const formattedCustomers = users.map((user) => ({
        customerId: user.userid, // Ví dụ: nếu ID trong DB là 'userid'
        full_name: user.fullname || user.full_name, // Tùy thuộc vào tên trường trong DB
        address: user.address,
        uPhone: user.uPhone || user.phone,
      }));
      res.json(formattedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res
        .status(500)
        .json({ message: "Lỗi server khi lấy danh sách khách hàng" });
    }
  },

  // API cho biểu đồ đường (DỮ LIỆU 6 THÁNG ĐẦU VÀO)
  getFirst6MonthsOrders: async (req, res) => {
    try {
      console.log("Fetching first 6 months orders"); // Log bước lấy dữ liệu
      const data = await OrderModel.getOrdersForDateChartFirstXMonths(6);
      console.log("Raw order data from model:", data); // Log dữ liệu thô
      if (!data || data.length === 0) {
        console.log("No order data found for first 6 months"); // Log nếu không có dữ liệu
      }
      const chartData = data.map((order) => ({
        date: order.date,
        totalmoney: order.totalmoney,
      }));
      console.log("Formatted chart data (orders):", chartData); // Log dữ liệu đã format
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching first 6 months orders data:", error);
      res
        .status(500)
        .json({ message: "Lỗi server khi lấy dữ liệu đơn hàng 6 tháng đầu" });
    }
  },

  getFirst6MonthsSales: async (req, res) => {
    try {
      console.log("Fetching first 6 months sales"); // Log bước lấy dữ liệu
      const data = await OrderModel.getMonthlySalesRevenueFirstXMonths(6);
      console.log("Raw sales data from model:", data); // Log dữ liệu thô
      if (!data || data.length === 0) {
        console.log("No sales data found for first 6 months"); // Log nếu không có dữ liệu
      }
      const chartData = data.map((sale) => ({
        month: String(sale.month),
        total_sales: sale.total_sales,
      }));
      console.log("Formatted chart data (sales):", chartData); // Log dữ liệu đã format
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching first 6 months sales data:", error);
      res
        .status(500)
        .json({ message: "Lỗi server khi lấy dữ liệu doanh thu 6 tháng đầu" });
    }
  },
};

module.exports = controlController;
