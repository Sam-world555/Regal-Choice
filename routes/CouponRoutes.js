const express = require("express");
const router = express.Router();

const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require("../controllers/couponController");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

// Logged-in users can validate a coupon at checkout
router.post("/validate", protect, validateCoupon);

// Admin-only management
router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getCoupons);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

module.exports = router;