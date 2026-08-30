const Wishlist = require("../models/Wishlist");

// GET /api/wishlist - get logged-in user's wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({
      user: req.user._id,
    }).populate("product");

    // Filter out any wishlist entries whose product was deleted
    const validItems = wishlist.filter(
      (item) => item.product !== null
    );

    res.status(200).json(validItems);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/wishlist/toggle - add if not present, remove if present
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    const existing = await Wishlist.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existing) {
      await existing.deleteOne();

      return res.status(200).json({
        message: "Removed from Wishlist",
        wishlisted: false,
      });
    }

    await Wishlist.create({
      user: req.user._id,
      product: productId,
    });

    res.status(201).json({
      message: "Added to Wishlist",
      wishlisted: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
};