const pool = require("../db");

// Kiểm tra kết nối pool khi module được tải
pool
  .getConnection()
  .then((conn) => {
    console.log("Database connection successful at:", new Date().toISOString());
    console.log("Connection object details:", {
      threadId: conn.threadId,
      host: conn.config.host,
      database: conn.config.database,
    });
    conn.release();
  })
  .catch((err) => {
    console.error("Database connection failed at:", new Date().toISOString());
    console.error("Connection error details:", {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
  });

const OrderModel = {
  async createOrder(orderData) {
    const { user_id, total_amount, status } = orderData;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      console.log("Starting createOrder process at:", new Date().toISOString());
      const [result] = await connection.query(
        "INSERT INTO `order` (date, totalmoney, status, user_id) VALUES (?, ?, ?, ?)",
        [new Date().toISOString().slice(0, 10), total_amount, status, user_id]
      );
      const newOrderId = result.insertId;

      console.log("Order inserted with orderId:", newOrderId);
      for (const detail of orderData.order_details) {
        await this.createOrderDetail(
          connection, // ✅ truyền connection đang trong transaction
          newOrderId,
          detail.product_id,
          detail.quantity,
          detail.price
        );
      }

      await connection.commit();
      console.log("Order created successfully with orderId:", newOrderId);
      return newOrderId;
    } catch (err) {
      await connection.rollback();
      console.error("Error in createOrder at:", new Date().toISOString(), err);
      throw err;
    } finally {
      connection.release();
    }
  },

  async createOrderDetail(connection, orderId, productId, quantity, price) {
    try {
      const timestamp = new Date().toISOString();
      console.log(
        "Creating order detail for orderId:",
        orderId,
        "at:",
        timestamp
      );

      await connection.query(
        "INSERT INTO order_detail (product_id, quantity, price, order_id) VALUES (?, ?, ?, ?)",
        [productId, quantity, price, orderId]
      );
    } catch (err) {
      console.error(
        "Error in createOrderDetail at:",
        new Date().toISOString(),
        err
      );
      throw err;
    }
  },

  async getOrdersByUserId(userId, status = null) {
    try {
      console.log(
        "Starting getOrdersByUserId process at:",
        new Date().toISOString()
      );
      let query = `
        SELECT 
          o.orderId, 
          o.status, 
          o.totalmoney, 
          o.date, 
          od.product_id, 
          od.quantity, 
          od.price, 
          p.pname, 
          p.pprice,
          CASE 
            WHEN od.orderdetail_id = (
              SELECT MIN(od2.orderdetail_id)
              FROM order_detail od2
              WHERE od2.order_id = o.orderId
            ) THEN p.pimage
            ELSE NULL
          END AS pimage
        FROM \`order\` o
        JOIN order_detail od ON o.orderId = od.order_id
        JOIN product p ON od.product_id = p.pid
        WHERE o.user_id = ?
      `;
      let params = [userId];
      if (status) {
        query += " AND o.status = ?";
        params.push(status);
      }
      console.log("Preparing getOrdersByUserId query with params:", params);
      console.log("Executing getOrdersByUserId query:", query);
      const [rows] = await pool.query(query, params);
      console.log("getOrdersByUserId query executed, result:", rows);
      return rows;
    } catch (err) {
      console.error("Error in getOrdersByUserId at:", new Date().toISOString());
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getOrderById(orderId, userId) {
    try {
      console.log(
        "Starting getOrderById process at:",
        new Date().toISOString()
      );
      console.log("Executing getOrderById query with params:", [
        orderId,
        userId,
      ]);
      const query = `
        SELECT 
          o.orderId,
          o.status,
          o.totalmoney,
          o.date,
          o.user_id,
          od.product_id,
          od.quantity,
          od.price,
          p.pname,
          p.pimage,
          p.pprice,
          u.username,
          u.uPhone AS phone,
          u.address
        FROM \`order\` o
        JOIN order_detail od ON o.orderId = od.order_id
        JOIN product p ON od.product_id = p.pid
        JOIN user u ON o.user_id = u.userid
        WHERE o.orderId = ? AND o.user_id = ?
      `;
      console.log("Executing getOrderById query:", query);
      const [rows] = await pool.query(query, [orderId, userId]);
      console.log("getOrderById query executed, result:", rows);
      return rows;
    } catch (err) {
      console.error("Error in getOrderById at:", new Date().toISOString());
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getOrdersForAdmin() {
    try {
      console.log(
        "Starting getOrdersForAdmin process at:",
        new Date().toISOString()
      );
      console.log("Executing getOrdersForAdmin query");
      const [rows] = await pool.query(`
        SELECT o.orderId AS id, u.fullname AS customer_name, 
               GROUP_CONCAT(p.pname SEPARATOR ', ') AS products,
               SUM(od.quantity) AS quantity,
               o.totalmoney AS total_amount, o.status
        FROM \`order\` o
        JOIN user u ON o.user_id = u.userid
        JOIN order_detail od ON o.orderId = od.order_id
        JOIN product p ON od.product_id = p.pid
        GROUP BY o.orderId
      `);
      console.log("getOrdersForAdmin query executed, result:", rows);
      return rows;
    } catch (err) {
      console.error("Error in getOrdersForAdmin at:", new Date().toISOString());
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getOrderStatusForAdmin() {
    try {
      console.log(
        "Starting getOrderStatusForAdmin process at:",
        new Date().toISOString()
      );
      console.log("Executing getOrderStatusForAdmin query");
      const [rows] = await pool.query(`
        SELECT o.orderId AS id, u.fullname AS customer_name, o.totalmoney AS total_amount, o.status
        FROM \`order\` o
        JOIN user u ON o.user_id = u.userid
      `);
      console.log("getOrderStatusForAdmin query executed, result:", rows);
      return rows;
    } catch (err) {
      console.error(
        "Error in getOrderStatusForAdmin at:",
        new Date().toISOString()
      );
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getTotalOrders() {
    try {
      console.log(
        "Starting getTotalOrders process at:",
        new Date().toISOString()
      );
      console.log("Executing getTotalOrders query");
      const [rows] = await pool.query(
        "SELECT COUNT(*) AS total_orders FROM `order`"
      );
      console.log("getTotalOrders query executed, result:", rows);
      return rows[0];
    } catch (err) {
      console.error("Error in getTotalOrders at:", new Date().toISOString());
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async updateOrderStatus(orderId, status, shipping_cost = 0) {
    try {
      console.log(
        "Starting updateOrderStatus process at:",
        new Date().toISOString()
      );
      console.log("Executing updateOrderStatus query with params:", [
        status,
        shipping_cost,
        orderId,
      ]);
      await pool.query(
        "UPDATE `order` SET status = ?, shipping_cost = ? WHERE orderId = ?",
        [status, shipping_cost, orderId]
      );
      console.log("updateOrderStatus query executed successfully");
      console.log("Order status updated successfully for orderId:", orderId);
    } catch (err) {
      console.error("Error in updateOrderStatus at:", new Date().toISOString());
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async deleteOrder(id) {
    try {
      console.log("Starting deleteOrder process at:", new Date().toISOString());
      console.log("Deleting order details for orderId:", id);
      await pool.query("DELETE FROM order_detail WHERE order_id = ?", [id]);
      console.log("Order details deletion query executed successfully");
      console.log("Deleting order for orderId:", id);
      await pool.query("DELETE FROM `order` WHERE orderId = ?", [id]);
      console.log("Order deletion query executed successfully");
      console.log("Order deleted successfully for orderId:", id);
    } catch (err) {
      console.error("Error in deleteOrder at:", new Date().toISOString());
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getOrderByIdForAdmin(orderId) {
    try {
      console.log(
        "Starting getOrderByIdForAdmin process at:",
        new Date().toISOString()
      );
      console.log("Executing getOrderByIdForAdmin query for orderId:", orderId);
      const [orderRows] = await pool.query(
        `
        SELECT o.orderId, o.totalmoney, o.status, o.date, o.user_id
        FROM \`order\` o
        WHERE o.orderId = ?
      `,
        [orderId]
      );
      console.log(
        "getOrderByIdForAdmin order query executed, result:",
        orderRows
      );
      const [itemRows] = await pool.query(
        `
        SELECT od.quantity, od.price, p.pname, p.pimage
        FROM order_detail od
        JOIN product p ON od.product_id = p.pid
        WHERE od.order_id = ?
      `,
        [orderId]
      );
      console.log(
        "getOrderByIdForAdmin items query executed, result:",
        itemRows
      );
      const [userRows] = await pool.query(
        `
        SELECT u.username, u.full_name, u.uPhone, u.address
        FROM user u
        WHERE u.userid = (SELECT user_id FROM \`order\` WHERE orderId = ?)
      `,
        [orderId]
      );
      console.log(
        "getOrderByIdForAdmin user query executed, result:",
        userRows
      );
      return { order: { ...orderRows[0], items: itemRows }, user: userRows[0] };
    } catch (err) {
      console.error(
        "Error in getOrderByIdForAdmin at:",
        new Date().toISOString()
      );
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getTotalRevenue() {
    try {
      console.log(
        "Starting getTotalRevenue process at:",
        new Date().toISOString()
      );
      console.log("Executing getTotalRevenue query");
      const [rows] = await pool.query(
        "SELECT SUM(totalmoney) AS total_revenue FROM `order` WHERE status = 'Đã giao hàng'"
      );
      console.log("getTotalRevenue query executed, result:", rows);
      return rows[0];
    } catch (err) {
      console.error("Error in getTotalRevenue at:", new Date().toISOString());
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getOrdersForDateChartFirstXMonths(numberOfMonths) {
    try {
      console.log(
        "Starting getOrdersForDateChartFirstXMonths process at:",
        new Date().toISOString()
      );
      const [statuses] = await pool.query(
        `SELECT DISTINCT status FROM \`order\``
      );
      console.log("Fetched statuses from DB:", statuses);
      console.log("Fetching max year for orders");
      const [yearRows] = await pool.query(
        `SELECT MAX(YEAR(date)) as maxYear FROM \`order\` WHERE status = 'Đã giao hàng'`
      );
      console.log("Max year query for orders executed, result:", yearRows);
      const year = yearRows[0].maxYear || new Date().getFullYear();
      console.log("Using year for orders query:", year);

      console.log(
        "Executing getOrdersForDateChartFirstXMonths query with params:",
        [year, numberOfMonths]
      );
      const [rows] = await pool.query(
        `SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, totalmoney 
         FROM \`order\` 
         WHERE YEAR(date) = ? AND MONTH(date) >= 1 AND MONTH(date) <= ? AND status = 'Đã giao hàng'
         ORDER BY date ASC`,
        [year, numberOfMonths]
      );
      console.log(
        "getOrdersForDateChartFirstXMonths query executed, result:",
        rows
      );
      return rows;
    } catch (err) {
      console.error(
        "Error in getOrdersForDateChartFirstXMonths at:",
        new Date().toISOString()
      );
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },

  async getMonthlySalesRevenueFirstXMonths(numberOfMonths) {
    try {
      console.log(
        "Starting getMonthlySalesRevenueFirstXMonths process at:",
        new Date().toISOString()
      );
      console.log("Fetching max year for sales");
      const [yearRows] = await pool.query(
        `SELECT MAX(YEAR(date)) as maxYear FROM \`order\` WHERE status = 'Đã giao hàng'`
      );
      console.log("Max year query for sales executed, result:", yearRows);
      const year = yearRows[0].maxYear || new Date().getFullYear();
      console.log("Using year for sales query:", year);

      console.log(
        "Executing getMonthlySalesRevenueFirstXMonths query with params:",
        [year, numberOfMonths]
      );
      const [rows] = await pool.query(
        `SELECT MONTH(date) as month, SUM(totalmoney) as total_sales
         FROM \`order\`
         WHERE YEAR(date) = ? AND MONTH(date) >= 1 AND MONTH(date) <= ? AND status = 'Đã giao hàng'
         GROUP BY MONTH(date)
         ORDER BY MONTH(date) ASC`,
        [year, numberOfMonths]
      );
      console.log(
        "getMonthlySalesRevenueFirstXMonths query executed, result:",
        rows
      );
      return rows;
    } catch (err) {
      console.error(
        "Error in getMonthlySalesRevenueFirstXMonths at:",
        new Date().toISOString()
      );
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  },
};

module.exports = OrderModel;
