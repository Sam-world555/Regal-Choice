const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  sendAdminOrderNotification,
  sendOrderConfirmationEmail,
} = require("../utils/emailService"); // adjust path to wherever emailService.js lives

const createOrder = async (req, res) => {
  try {
    const { shippingAddress, couponCode } = req.body;

    const cartItems = await Cart.find({
      user: req.user._id,
    }).populate("product");

    // Remove cart items whose product was deleted (populate returns null for those)
    const validCartItems = cartItems.filter(
      (item) => item.product !== null
    );

    if (validCartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const items = validCartItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));

    // Check every item has enough stock before creating the order
    for (const item of validCartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `"${item.product.name}" only has ${item.product.stock} left in stock`,
        });
      }
    }

    const originalTotal = validCartItems.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );

    let totalPrice = originalTotal;
    let appliedCoupon = null;

    // Re-validate the coupon here too (order creation is a separate request from payment)
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
        totalPrice = Math.round(
          originalTotal - (originalTotal * coupon.discountPercent) / 100
        );
        appliedCoupon = coupon;
      }
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      totalPrice,
      shippingAddress,
      status: "Pending",
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
    });

    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    // Reduce stock for each purchased item
    for (const item of validCartItems) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.deleteMany({
      user: req.user._id,
    });

    // --- Admin notification (email + in-app) — fire after order is safely created ---
    // Wrapped in try/catch of its own so a notification failure never breaks order creation
    try {
      const emailOrderPayload = {
        _id: order._id,
        totalAmount: totalPrice,
        customerName: req.user.name,
        customerEmail: req.user.email,
        items: validCartItems.map((item) => ({
          name: item.product.name,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      // Only email the customer if they haven't opted out in Settings
      if (req.user.emailNotifications !== false) {
        sendOrderConfirmationEmail(emailOrderPayload).catch((err) =>
          console.log("CUSTOMER ORDER CONFIRMATION EMAIL ERROR:", err)
        );
      }

      // Only email admins if at least one admin hasn't opted out
      const anyAdminWantsEmail = await User.exists({
        role: "admin",
        emailNotifications: { $ne: false },
      });

      if (anyAdminWantsEmail) {
        sendAdminOrderNotification(emailOrderPayload).catch((err) =>
          console.log("ADMIN ORDER EMAIL ERROR:", err)
        );
      }

      await Notification.create({
        type: "new-order",
        order: order._id,
        message: `New order #${order._id.toString().slice(-6)} from ${req.user.name} — ₹${totalPrice}`,
      });
    } catch (notifyError) {
      console.log("ADMIN NOTIFICATION ERROR:", notifyError);
    }

    res.status(201).json({
      message: "Order Created Successfully",
      order,
    });
  } catch (error) {
    console.log("CREATE ORDER ERROR:", error);

    if (error.errors) {
      console.log("VALIDATION DETAILS:", error.errors);
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).populate("items.product");

    res.status(200).json(orders);
  } catch (error) {
    console.log("GET MY ORDERS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/orders/:id — a user can only fetch their own order; an admin can fetch any
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to view this order",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.log("GET ORDER BY ID ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product");

    res.status(200).json(orders);
  } catch (error) {
    console.log("GET ALL ORDERS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id
    ).populate("items.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const wasAlreadyCancelled = order.status === "Cancelled";
    const isBeingCancelled = req.body.status === "Cancelled";

    order.status = req.body.status;

    await order.save();

    // Restore stock only when the order transitions INTO Cancelled
    // (prevents double-restoring if it's already Cancelled and gets "cancelled" again)
    if (isBeingCancelled && !wasAlreadyCancelled) {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product._id, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    res.status(200).json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.log("UPDATE ORDER STATUS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};