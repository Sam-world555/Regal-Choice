const Cart = require("../models/Cart");

const addToCart = async (req, res) => {
  try {
    const { product, quantity } = req.body;

    const existingItem = await Cart.findOne({
      user: req.user._id,
      product,
    });

    if (existingItem) {
      existingItem.quantity += quantity;

      await existingItem.save();

      return res.status(200).json({
        message: "Cart quantity updated",
        cartItem: existingItem,
      });
    }

    const cartItem = await Cart.create({
      user: req.user._id,
      product,
      quantity,
    });

    res.status(201).json({
      message: "Product added to cart",
      cartItem,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find({
      user: req.user._id,
    }).populate("product");

    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;

    const cartItem = await Cart.findById(req.params.id);

    if (!cartItem) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    if (quantity <= 0) {
      await cartItem.deleteOne();

      return res.status(200).json({
        message: "Item removed from cart",
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      message: "Cart quantity updated",
      cartItem,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cartItem = await Cart.findById(req.params.id);

    if (!cartItem) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    await cartItem.deleteOne();

    res.status(200).json({
      message: "Item removed from cart",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};