const bcrypt = require("bcrypt");
const { findUserByUsername, createUser } = require("../models/userModel");

const authController = {
  loginUser: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Tên người dùng và mật khẩu là bắt buộc" });
    }

    try {
      const user = await findUserByUsername(username);

      if (!user) {
        return res
          .status(401)
          .json({ message: "Tên người dùng hoặc mật khẩu không đúng" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Tên người dùng hoặc mật khẩu không đúng" });
      }

      req.session.username = user.username;
      req.session.userId = user.userid;

      return res.status(200).json({
        message: "Đăng nhập thành công",
        redirectTo: "/nike.html",
        username: user.username,
      });
    } catch (error) {
      console.error("Lỗi trong quá trình đăng nhập:", error);
      return res.status(500).json({ message: "Lỗi server nội bộ" });
    }
  },

  registerUser: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Tên người dùng và mật khẩu là bắt buộc" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await createUser(username, hashedPassword);
      return res
        .status(201)
        .json({ message: "Đăng ký người dùng thành công", userId });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Tên người dùng đã tồn tại" });
      }

      console.error("Lỗi trong quá trình đăng ký:", error);
      return res.status(500).json({ message: "Lỗi server nội bộ" });
    }
  },

  logout: async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Error in logout:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
};

module.exports = authController;
