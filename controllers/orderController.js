const OrderModel = require("../models/orderModel");
const { UserModel } = require("../models/userModel"); // Sửa cách importconst ExcelJS = require("exceljs");

const orderController = {
  async checkout(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const { products } = req.body;
      console.log("Received products:", products); // Thêm log để kiểm tra
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res
          .status(400)
          .json({ message: "Không có sản phẩm nào được chọn" });
      }

      const userInfo = await UserModel.getUserById(userId);
      if (!userInfo) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy thông tin người dùng" });
      }

      const totalAmount = products.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        console.log(
          `Product ${item.productId}: price=${price}, quantity=${quantity}`
        ); // Log từng sản phẩm
        return sum + price * quantity;
      }, 0);

      if (isNaN(totalAmount) || totalAmount < 0) {
        return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
      }

      const orderData = {
        user_id: userId,
        total_amount: totalAmount,
        status: "Chờ xác nhận",
        order_details: products.map((item) => ({
          product_id: parseInt(item.productId) || 0,
          quantity: parseInt(item.quantity) || 0,
          price: parseFloat(item.price) || 0,
        })),
      };

      console.log("Order data:", orderData); // Thêm log để kiểm tra
      const orderId = await OrderModel.createOrder(orderData);

      // Sau khi lưu đơn hàng -> Xóa sản phẩm trong giỏ hàng
      const CartModel = require("../models/cartModel"); // đảm bảo đã require

      for (const item of products) {
        await CartModel.removeItemFromCart(userId, item.productId);
      }

      res.json({ orderId });
    } catch (err) {
      console.error("Lỗi khi thanh toán:", err);
      res.status(500).json({ message: "Lỗi server", details: err.message });
    }
  },
  async getOrdersByUser(req, res) {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const status = req.query.status || null;
    try {
      const orders = await OrderModel.getOrdersByUserId(userId, status);
      if (!orders || orders.length === 0) {
        return res
          .status(200)
          .json({ orders: [], message: "Không có đơn hàng nào" });
      }

      const groupedOrders = orders.reduce((acc, order) => {
        const { orderId, status, totalmoney, date, pimage } = order;
        if (!orderId || !totalmoney) {
          console.warn("Invalid order data from DB:", order);
          return acc;
        }
        if (!acc[orderId]) {
          acc[orderId] = {
            orderId: Number(orderId),
            status,
            totalmoney: Number(totalmoney),
            date,
            pimage: pimage || null,
            items: [],
          };
        }
        acc[orderId].items.push({
          productId: order.product_id,
          pname: order.pname,
          pprice: Number(order.pprice || 0),
          quantity: Number(order.quantity || 0),
          price: Number(order.price || 0),
        });
        return acc;
      }, {});

      const orderList = Object.values(groupedOrders);
      console.log("Grouped orders:", orderList);
      res.status(200).json({ orders: orderList });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({
        message: "Lỗi khi lấy danh sách đơn hàng",
        error: error.message,
      });
    }
  },

  async getOrderDetails(req, res) {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const orderId = req.params.orderId;
    try {
      const orderDetails = await OrderModel.getOrderById(orderId, userId);
      if (!orderDetails || orderDetails.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      const order = {
        orderId: Number(orderDetails[0].orderId),
        status: orderDetails[0].status,
        totalmoney: Number(orderDetails[0].totalmoney),
        date: orderDetails[0].date,
        user_id: orderDetails[0].user_id,
        items: orderDetails.map((item) => ({
          productId: item.product_id,
          pname: item.pname,
          pimage: item.pimage,
          pprice: Number(item.pprice || 0),
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
        })),
      };

      const user = {
        username: orderDetails[0].username,
        phone: orderDetails[0].phone,
        address: orderDetails[0].address,
      };

      console.log("Order details sent:", { order, user });
      res.status(200).json({ order, user });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({
        message: "Lỗi khi lấy chi tiết đơn hàng",
        error: error.message,
      });
    }
  },

  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const order = await OrderModel.getOrderById(orderId, userId);
      if (!order || order.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      const formattedOrder = {
        orderId: Number(order[0].orderId),
        status: order[0].status,
        totalmoney: Number(order[0].totalmoney),
        date: order[0].date,
        customer_name: order[0].username,
        phone: order[0].phone,
        address: order[0].address,
        order_details: order.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.pname,
          pimage: item.pimage,
        })),
      };
      res.json(formattedOrder);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin đơn hàng:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async confirmOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { shipping_cost } = req.body;
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const order = await OrderModel.getOrderById(orderId, userId);
      if (!order || order.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }
      await OrderModel.updateOrderStatus(
        orderId,
        "Đang vận chuyển",
        shipping_cost
      );
      res.status(200).json({ message: "Xác nhận đơn hàng thành công" });
    } catch (err) {
      console.error("Lỗi khi xác nhận đơn hàng:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async getOrdersForAdmin(req, res) {
    try {
      const orders = await OrderModel.getOrdersForAdmin();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders for admin:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async getOrderStatusForAdmin(req, res) {
    try {
      const orders = await OrderModel.getOrderStatusForAdmin();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching order status for admin:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async getTotalOrders(req, res) {
    try {
      const total = await OrderModel.getTotalOrders();
      res.json(total);
    } catch (error) {
      console.error("Error fetching total orders:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async updateOrderStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await OrderModel.updateOrderStatus(id, status);
      res.json({ message: "Cập nhật trạng thái đơn hàng thành công" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async deleteOrder(req, res) {
    const { id } = req.params;
    try {
      await OrderModel.deleteOrder(id);
      res.json({ message: "Xóa đơn hàng thành công" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async exportOrders(req, res) {
    try {
      const orders = await OrderModel.getOrdersForAdmin();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Orders");
      worksheet.columns = [
        { header: "Mã đơn hàng", key: "id", width: 15 },
        { header: "Tên khách hàng", key: "customer_name", width: 25 },
        { header: "Sản phẩm", key: "products", width: 40 },
        { header: "Số lượng", key: "quantity", width: 15 },
        { header: "Thành tiền", key: "total_amount", width: 20 },
        { header: "Tình trạng", key: "status", width: 20 },
      ];

      // Định dạng header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };

      // Thêm viền cho các ô
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      orders.forEach((order) => worksheet.addRow(order));
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="orders.xlsx"'
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting orders:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  async getOrderByIdForAdmin(req, res) {
    const { orderId } = req.params;
    try {
      const order = await OrderModel.getOrderByIdForAdmin(orderId);
      if (!order.order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order for admin:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};

module.exports = orderController;
