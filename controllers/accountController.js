const {
  findUserByUsername,
  getUserIdByUsername,
  UserModel,
} = require("../models/userModel");

const AccountController = {
  getAccountInfo: async (req, res) => {
    try {
      const username = req.session.username;
      if (!username) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const userInfo = await findUserByUsername(username);
      if (!userInfo) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy thông tin người dùng" });
      }

      res.json(userInfo);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin người dùng:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  updateAccountInfo: async (req, res) => {
    try {
      const username = req.session.username;
      if (!username) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      const { name, address, phone, password } = req.body;
      const userId = await getUserIdByUsername(username);

      await UserModel.updateUserById(userId, {
        name,
        address,
        phone,
        password,
      });

      res.status(200).json({ message: "Cập nhật thông tin thành công" });
    } catch (err) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách người dùng:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      await UserModel.deleteUser(userId);
      res.status(200).json({ message: "Xóa người dùng thành công" });
    } catch (err) {
      console.error("Lỗi khi xóa người dùng:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  updateUserByAdmin: async (req, res) => {
    try {
      const { userId } = req.params;
      const { fullname, username, password, uPhone } = req.body;
      await UserModel.updateUserByAdmin(userId, {
        fullname,
        username,
        password,
        uPhone,
      });
      res.status(200).json({ message: "Cập nhật người dùng thành công" });
    } catch (err) {
      console.error("Lỗi khi cập nhật người dùng:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};

module.exports = AccountController;
