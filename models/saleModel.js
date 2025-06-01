const pool = require("../db");

const salesModel = {
  async getFirst6MonthsSales() {
    const [rows] = await pool.query(`
      SELECT MONTH(o.date) AS month, SUM(o.totalmoney) AS total_sales
      FROM \`order\` o
      WHERE MONTH(o.date) <= 6
      GROUP BY MONTH(o.date)
    `);
    return rows;
  },

  async getLast6MonthsSales() {
    const [rows] = await pool.query(`
      SELECT MONTH(date) AS month, SUM(totalmoney) AS total_sales
      FROM \`order\`
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY MONTH(date)
    `);
    return rows;
  },

  async getYearlySales() {
    const [rows] = await pool.query(
      "SELECT YEAR(date) AS year, SUM(totalmoney) AS total_sales FROM `order` GROUP BY YEAR(date)"
    );
    return rows;
  },

  async getAllSales() {
    const [rows] = await pool.query(`
      SELECT MONTH(o.date) AS month, SUM(o.totalmoney) AS total_sales
      FROM \`order\` o
      GROUP BY MONTH(o.date)
    `);
    return rows;
  },

  async getTotalRevenue() {
    const [rows] = await pool.query(
      "SELECT SUM(totalmoney) AS total_revenue FROM `order`"
    );
    return rows[0];
  },
};

module.exports = salesModel;
