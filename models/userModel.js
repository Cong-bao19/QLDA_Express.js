const pool = require("../db");

async function findUserByUsername(username) {
  try {
    const [rows] = await pool.query("SELECT * FROM user WHERE username = ?", [
      username,
    ]);
    return rows[0];
  } catch (error) {
    console.error("Error finding user by username:", error);
    throw error;
  }
}

async function getUserIdByUsername(username) {
  try {
    const [rows] = await pool.query(
      "SELECT userid FROM user WHERE username = ?",
      [username]
    );
    return rows[0]?.userid;
  } catch (error) {
    console.error("Error getting user ID by username:", error);
    throw error;
  }
}

async function createUser(username, hashedPassword) {
  try {
    const result = await pool.query(
      "INSERT INTO user (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

const UserModel = {
  findUserById: async (userId) => {
    // Thêm phương thức này
    const query =
      "SELECT userid, fullname, address, uPhone, password FROM user WHERE userid = ?";
    const [rows] = await pool.query(query, [userId]);
    return rows[0];
  },
  getUserById: async (userId) => {
    const query =
      "SELECT userid, fullname, address, uPhone, password FROM user WHERE userid = ?";
    const [rows] = await pool.query(query, [userId]);
    return rows[0];
  },

  updateUserById: async (userId, { name, address, phone, password }) => {
    const query =
      "UPDATE user SET fullname = ?, address = ?, uPhone = ?, password = ? WHERE userid = ?";
    await pool.query(query, [name, address, phone, password, userId]);
  },

  getAllUsers: async () => {
    try {
      const query =
        "SELECT userid, fullname, username, password, uPhone FROM user";
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const query = "DELETE FROM user WHERE userid = ?";
      await pool.query(query, [userId]);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  updateUserByAdmin: async (
    userId,
    { fullname, username, password, uPhone }
  ) => {
    try {
      const query =
        "UPDATE user SET fullname = ?, username = ?, password = ?, uPhone = ? WHERE userid = ?";
      await pool.query(query, [fullname, username, password, uPhone, userId]);
    } catch (error) {
      console.error("Error updating user by admin:", error);
      throw error;
    }
  },
};

module.exports = {
  findUserByUsername,
  getUserIdByUsername,
  createUser,
  UserModel,
};
