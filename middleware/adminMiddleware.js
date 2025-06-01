const pool = require("../db");

module.exports = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      console.log("Bạn chưa đăng nhập, chuyển sang trang login");
      return res.redirect("/login?error=notLoggedIn");
    }
    const [rows] = await pool.query("SELECT role FROM user WHERE userid = ?", [
      req.session.userId,
    ]);
    if (rows.length === 0 || rows[0].role !== 1) {
      console.log("Bạn không có quyền truy cập. Chuyển về trang login");
      return res.redirect("/login?error=needAdmin");
    }
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    res.status(500).send("Server error");
  }
};
