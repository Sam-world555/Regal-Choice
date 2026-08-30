const Coupon = require("../models/Coupon");

// POST /api/coupons (admin only)
const createCoupon = async (req, res) => {
  try {
    const { code, discountPercent, expiryDate, usageLimit, isActive } =
      req.body;

    if (!code || !discountPercent || !expiryDate) {
      return res.status(400).json({
        message: "Code, discount percent, and expiry date are required",
      });
    }

    const existing = await Coupon.findOne({
      code: code.toUpperCase().trim(),
    });

    if (existing) {
      return res.status(400).json({
        message: "A coupon with this code already exists",
      });
    }

    const coupon = await Coupon.create({
      code,
      discountPercent,
      expiryDate,
      usageLimit: usageLimit || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.log("CREATE COUPON ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/coupons (admin only)
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    console.log("GET COUPONS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/coupons/:id (admin only)
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.log("UPDATE COUPON ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE /api/coupons/:id (admin only)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.log("DELETE COUPON ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/coupons/validate (logged-in user, used at checkout)
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!coupon) {
      return res.status(404).json({
        valid: false,
        message: "Invalid coupon code",
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        valid: false,
        message: "This coupon is no longer active",
      });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        valid: false,
        message: "This coupon has expired",
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        valid: false,
        message: "This coupon has reached its usage limit",
      });
    }

    res.status(200).json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
    });
  } catch (error) {
    console.log("VALIDATE COUPON ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};