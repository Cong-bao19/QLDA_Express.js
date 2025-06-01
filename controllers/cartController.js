const db = require("../db");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log("ProductId nhận được:", productId);

    if (!req.session || !req.session.username) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }
    const username = req.session.username;
    console.log("Username từ session:", username);

    const userId = await getUserIdByUsername(username);
    if (!userId) {
      console.log("Không tìm thấy userId cho username:", username);
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    console.log("UserId tìm thấy:", userId);

    let cart = await Cart.getCartByUserId(userId);
    if (!cart) {
      const cartId = await Cart.createCart(userId);
      cart = { id: cartId };
    }

    const productPrice = await getProductPrice(productId);
    if (!productPrice) {
      console.log("Không tìm thấy giá cho productId:", productId);
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    const totalMoney = productPrice * quantity;

    const cartDetailId = await Cart.addProductToCart(
      cart.id,
      productId,
      quantity,
      totalMoney
    );

    res.status(200).json({
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      cartDetailId,
    });
  } catch (err) {
    console.error("Lỗi trong addToCart:", err);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
};

const getCart = async (req, res) => {
  try {
    if (!req.session || !req.session.username) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }
    const username = req.session.username;
    const userId = await getUserIdByUsername(username);
    if (!userId) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const cart = await Cart.getCartByUserId(userId);
    if (!cart) {
      return res.json({ cart: null, cartDetails: [] });
    }

    const cartDetails = await Cart.getCartDetailsByUserId(userId);
    res.status(200).json({ cart, cartDetails });
  } catch (err) {
    console.error("Lỗi trong getCart:", err);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
};

const updateCart = async (req, res) => {
  try {
    const { cartId, productId, quantity, price } = req.body;
    if (!req.session || !req.session.username) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const userId = await getUserIdByUsername(req.session.username);
    if (!userId) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const cart = await Cart.getCartByUserId(userId);
    if (!cart || cart.id !== cartId) {
      return res
        .status(403)
        .json({ message: "Không có quyền truy cập giỏ hàng" });
    }

    if (quantity === 0) {
      await db.query(
        "DELETE FROM cart_detail WHERE cart_id = ? AND product_id = ?",
        [cartId, productId]
      );
      return res
        .status(200)
        .json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công" });
    }

    const totalMoney = price * quantity;
    const [existing] = await db.query(
      `SELECT c_quantity FROM cart_detail WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId]
    );

    if (existing.length > 0) {
      const newQuantity = quantity; // Thay vì cộng dồn, dùng số lượng mới từ client
      await db.query(
        `UPDATE cart_detail 
         SET c_quantity = ?, totalmoney = ? 
         WHERE cart_id = ? AND product_id = ?`,
        [newQuantity, totalMoney, cartId, productId]
      );
    } else {
      await db.query(
        `INSERT INTO cart_detail (cart_id, product_id, c_quantity, totalmoney) 
         VALUES (?, ?, ?, ?)`,
        [cartId, productId, quantity, totalMoney]
      );
    }

    res.status(200).json({ message: "Cập nhật giỏ hàng thành công" });
  } catch (err) {
    console.error("Lỗi trong updateCart:", err);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
};

const getUserIdByUsername = async (username) => {
  try {
    console.log("Thực hiện truy vấn cho username:", username);
    const [rows] = await db.query(
      "SELECT userid FROM user WHERE username = ?",
      [username]
    );
    console.log("Kết quả truy vấn:", rows);
    return rows[0]?.userid;
  } catch (err) {
    console.error("Lỗi trong getUserIdByUsername:", err);
    throw err;
  }
};

const getProductPrice = async (productId) => {
  try {
    console.log("Thực hiện truy vấn cho productId:", productId);
    const [rows] = await db.query("SELECT pprice FROM product WHERE pid = ?", [
      productId,
    ]);
    console.log("Kết quả truy vấn sản phẩm:", rows);
    return rows[0]?.pprice;
  } catch (err) {
    console.error("Lỗi trong getProductPrice:", err);
    throw err;
  }
};

module.exports = { addToCart, getCart, updateCart };
