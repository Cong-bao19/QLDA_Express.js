const db = require("../db");

const Cart = {
  getCartByUserId: async (userId) => {
    try {
      const [rows] = await db.query("SELECT * FROM cart WHERE user_id = ?", [
        userId,
      ]);
      return rows[0];
    } catch (err) {
      console.error("Lỗi trong getCartByUserId:", err);
      throw err;
    }
  },

  createCart: async (userId) => {
    try {
      const [rows] = await db.query("SELECT MAX(id) as maxId FROM cart");
      const maxId = rows[0].maxId || 0;
      const newId = maxId + 1;

      const [result] = await db.query(
        "INSERT INTO cart (id, user_id) VALUES (?, ?)",
        [newId, userId]
      );
      return newId;
    } catch (err) {
      console.error("Lỗi trong createCart:", err);
      throw err;
    }
  },

  addProductToCart: async (cartId, productId, quantity, totalMoney) => {
    try {
      const [existing] = await db.query(
        `SELECT c_quantity FROM cart_detail WHERE cart_id = ? AND product_id = ?`,
        [cartId, productId]
      );

      if (existing.length > 0) {
        const newQuantity = existing[0].c_quantity + quantity;
        const newTotalMoney = newQuantity * (totalMoney / quantity);
        const [result] = await db.query(
          `UPDATE cart_detail 
           SET c_quantity = ?, totalmoney = ? 
           WHERE cart_id = ? AND product_id = ?`,
          [newQuantity, newTotalMoney, cartId, productId]
        );
        return result.insertId || existing[0].id;
      } else {
        const [result] = await db.query(
          `INSERT INTO cart_detail (cart_id, product_id, c_quantity, totalmoney) 
           VALUES (?, ?, ?, ?)`,
          [cartId, productId, quantity, totalMoney]
        );
        return result.insertId;
      }
    } catch (err) {
      console.error("Lỗi trong addProductToCart:", err);
      throw err;
    }
  },

  getCartDetailsByUserId: async (userId) => {
    try {
      const [rows] = await db.query(
        `SELECT cd.*, p.pid, p.pname, p.pdesc, p.pimage, p.pprice 
         FROM cart_detail cd 
         JOIN cart c ON cd.cart_id = c.id 
         JOIN product p ON cd.product_id = p.pid 
         WHERE c.user_id = ?`,
        [userId]
      );
      return rows.map((detail) => ({
        product: {
          pid: detail.pid,
          pname: detail.pname,
          pdesc: detail.pdesc,
          pimage: detail.pimage,
          pprice: detail.pprice,
        },
        quantity: detail.c_quantity,
      }));
    } catch (err) {
      console.error("Lỗi trong getCartDetailsByUserId:", err);
      throw err;
    }
  },

  // ✅ Hàm mới thêm để xóa sản phẩm trong giỏ hàng sau khi đặt hàng
  removeItemFromCart: async (userId, productId) => {
    try {
      const [cartRows] = await db.query(
        "SELECT id FROM cart WHERE user_id = ?",
        [userId]
      );
      if (cartRows.length === 0) return;

      const cartId = cartRows[0].id;

      await db.query(
        "DELETE FROM cart_detail WHERE cart_id = ? AND product_id = ?",
        [cartId, productId]
      );
    } catch (err) {
      console.error("Lỗi trong removeItemFromCart:", err);
      throw err;
    }
  },
};

module.exports = Cart;
