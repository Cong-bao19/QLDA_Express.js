const express = require("express");
const {
  loginUser,
  registerUser,
  logout,
} = require("../../controllers/authController"); // Import controller functions
const {
  showLoginPage,
  showRegisterPage,
} = require("../../controllers/pageController");

const router = express.Router();
router.get("/check", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }
  res.status(200).json({ message: "Đã đăng nhập", userId: req.session.userId });
});
router.get("/login", showLoginPage); // ✅ Hiển thị form
router.post("/login", loginUser); // ✅ Xử lý dữ liệu

// Define the registration route
router.post("/register", registerUser);
router.get("/register", showRegisterPage); // ✅ Show register page

router.get("/logout", logout);

module.exports = router;
