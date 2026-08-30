const Razorpay = require("razorpay");
const crypto = require("crypto");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const cartItems = await Cart.find({
      user: req.user._id,
    }).populate("product");

    // Null products remove karo
    const validCartItems = cartItems.filter(
      (item) => item.product !== null
    );

    if (validCartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const originalTotal = validCartItems.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );

    let totalPrice = originalTotal;
    let appliedDiscountPercent = 0;

    // Re-validate the coupon here (don't trust a discount value sent from the client)
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
      });

      const isUsable =
        coupon &&
        coupon.isActive &&
        new Date(coupon.expiryDate) >= new Date() &&
        (coupon.usageLimit === null ||
          coupon.usedCount < coupon.usageLimit);

      if (isUsable) {
        appliedDiscountPercent = coupon.discountPercent;
        totalPrice = Math.round(
          originalTotal - (originalTotal * appliedDiscountPercent) / 100
        );
      }
    }

    const options = {
      amount: totalPrice * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      ...order,
      totalPrice,
      originalTotal,
      appliedDiscountPercent,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// Verify Razorpay payment signature before allowing order creation
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Missing payment verification fields",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        verified: false,
        message: "Payment verification failed",
      });
    }

    res.status(200).json({
      verified: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
};