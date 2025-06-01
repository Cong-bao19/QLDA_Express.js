// controllers/pageController.js
const path = require("path");

// Function to serve login page
const showLoginPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"));
};

// Function to serve register page
const showRegisterPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "register.html"));
};

module.exports = { showLoginPage, showRegisterPage };
