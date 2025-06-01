const express = require("express");
const router = express.Router();
const AccountController = require("../controllers/accountController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/info", authMiddleware, AccountController.getAccountInfo);
router.put("/update", authMiddleware, AccountController.updateAccountInfo);
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  AccountController.getAllUsers
);
router.delete(
  "/users/:userId",
  authMiddleware,
  adminMiddleware,
  AccountController.deleteUser
);
router.put(
  "/users/:userId",
  authMiddleware,
  adminMiddleware,
  AccountController.updateUserByAdmin
);

module.exports = router;
