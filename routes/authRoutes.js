const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  sendLoginOTP,
  loginWithOTP,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/send-login-otp", sendLoginOTP);
router.post("/login-otp", loginWithOTP);

module.exports = router;