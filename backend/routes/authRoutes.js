const express = require("express");
const router = express.Router();
const { register, login, logout } = require("../controllers/authController");

// Route to register a new user
router.post("/register", register);

// Route to login a user
router.post("/login", login);

// Route to logout a user
router.post("/logout", logout);

module.exports = router;
