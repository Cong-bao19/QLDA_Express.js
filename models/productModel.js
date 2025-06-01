const pool = require("../db");

const Product = {
  getAllProducts: async () => {
    try {
      const [rows] = await pool.query("SELECT * FROM product");
      return rows;
    } catch (err) {
      console.error("Error in getAllProducts:", err);
      throw err;
    }
  },
  getProductsByPage: async (page, limit, minPrice, maxPrice) => {
    try {
      const offset = (page - 1) * limit;
      let query = "SELECT * FROM product WHERE pprice >= ?";
      let params = [minPrice];

      if (maxPrice !== null) {
        query += " AND pprice <= ?";
        params.push(maxPrice);
      }

      query += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [rows] = await pool.query(query, params);

      let countQuery =
        "SELECT COUNT(*) as totalItems FROM product WHERE pprice >= ?";
      let countParams = [minPrice];

      if (maxPrice !== null) {
        countQuery += " AND pprice <= ?";
        countParams.push(maxPrice);
      }

      const [[{ totalItems }]] = await pool.query(countQuery, countParams);
      return { products: rows, totalItems };
    } catch (err) {
      console.error("Error in getProductsByPage:", err);
      throw err;
    }
  },
  getProductById: async (productId) => {
    try {
      const [rows] = await pool.query("SELECT * FROM product WHERE pid = ?", [
        productId,
      ]);
      return rows[0];
    } catch (err) {
      console.error("Error in getProductById:", err);
      throw err;
    }
  },
  searchByKeyword: async (query, page, limit, minPrice, maxPrice) => {
    try {
      const offset = (page - 1) * limit;
      let searchQuery =
        "SELECT * FROM product WHERE pname LIKE ? AND pprice >= ?";
      let params = [`%${query}%`, minPrice];

      if (maxPrice !== null) {
        searchQuery += " AND pprice <= ?";
        params.push(maxPrice);
      }

      searchQuery += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [products] = await pool.query(searchQuery, params);

      let countQuery =
        "SELECT COUNT(*) as totalItems FROM product WHERE pname LIKE ? AND pprice >= ?";
      let countParams = [`%${query}%`, minPrice];

      if (maxPrice !== null) {
        countQuery += " AND pprice <= ?";
        countParams.push(maxPrice);
      }

      const [[{ totalItems }]] = await pool.query(countQuery, countParams);
      return { products, totalItems };
    } catch (err) {
      console.error("Error in searchByKeyword:", err);
      throw err;
    }
  },
  async getProductsByCategory(categoryId) {
    const [rows] = await pool.query(
      "SELECT * FROM product WHERE category_id = ?",
      [categoryId]
    );
    return rows;
  },

  async getTotalProducts() {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total_products FROM product"
    );
    return rows[0];
  },

  async getOutOfStockProducts() {
    const [rows] = await pool.query(
      "SELECT pname FROM product WHERE pquantity = 0"
    );
    return rows;
  },

  async getLowStockProducts() {
    const [rows] = await pool.query(
      "SELECT pid, pname, pquantity FROM product WHERE pquantity < 5"
    );
    return rows;
  },

  async createProduct({
    pname,
    psize,
    pquantity,
    pprice,
    pimage,
    category_id,
    pdesc,
  }) {
    await pool.query(
      "INSERT INTO product (pname, pimage, psize, pquantity, pprice, category_id, pdesc) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [pname, pimage, psize, pquantity, pprice, category_id, pdesc]
    );
  },

  async updateProduct(
    id,
    { pname, psize, pquantity, pprice, pimage, category_id, pdesc }
  ) {
    await pool.query(
      "UPDATE product SET pname = ?, pimage = ?, psize = ?, pquantity = ?, pprice = ?, category_id = ?, pdesc = ? WHERE pid = ?",
      [pname, pimage, psize, pquantity, pprice, category_id, pdesc, id]
    );
  },

  async deleteProduct(id) {
    await pool.query("DELETE FROM product WHERE pid = ?", [id]);
  },

  async getTopSellingProducts() {
    const [rows] = await pool.query(`
      SELECT p.pId, p.pname, p.pprice, p.pquantity, c.cname
      FROM product p
      JOIN category c ON p.category_id = c.cid
      ORDER BY p.pquantity DESC
      LIMIT 5
    `);
    return rows;
  },

  async getTopSellingProductsToday() {
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await pool.query(
      `
      SELECT p.pid AS product_id, p.pname AS product_name, p.pprice AS price, 
             SUM(od.quantity) AS quantity, c.cname AS category
      FROM order_detail od
      JOIN product p ON od.product_id = p.pid
      JOIN category c ON p.category_id = c.cid
      JOIN \`order\` o ON od.order_id = o.orderId
      WHERE DATE(o.date) = ?
      GROUP BY p.pid, p.pname, p.pprice, c.cname
      ORDER BY quantity DESC
      LIMIT 5
    `,
      [today]
    );
    return rows;
  },
};

module.exports = Product;
