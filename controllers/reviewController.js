const Product = require("../models/Product");
const Order = require("../models/Order");

// POST /api/products/:id/reviews
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        message: "Rating is required",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Verified purchase check: user must have a Delivered order containing this product
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: "Delivered",
      "items.product": product._id,
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        message:
          "You can only review products from your delivered orders",
      });
    }

    // Prevent duplicate review by the same user
    const alreadyReviewed = product.reviews.find(
      (review) =>
        review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment || "",
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce(
        (sum, item) => sum + item.rating,
        0
      ) / product.reviews.length;

    await product.save();

    res.status(201).json({
      message: "Review added successfully",
      reviews: product.reviews,
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    console.log("ADD REVIEW ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE /api/products/:id/reviews/:reviewId (admin only)
const deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    review.deleteOne();

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.length > 0
        ? product.reviews.reduce(
            (sum, item) => sum + item.rating,
            0
          ) / product.reviews.length
        : 0;

    await product.save();

    res.status(200).json({
      message: "Review deleted successfully",
      reviews: product.reviews,
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    console.log("DELETE REVIEW ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/products/reviews/all (admin only)
// Flattens every review from every product into one list, with product info attached
const getAllReviews = async (req, res) => {
  try {
    const products = await Product.find(
      { "reviews.0": { $exists: true } },
      "name image reviews"
    );

    const allReviews = [];

    products.forEach((product) => {
      product.reviews.forEach((review) => {
        allReviews.push({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          userName: review.name,
          createdAt: review.createdAt,
          product: {
            _id: product._id,
            name: product.name,
            image: product.image,
          },
        });
      });
    });

    // Most recent first
    allReviews.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json(allReviews);
  } catch (error) {
    console.log("GET ALL REVIEWS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addReview,
  deleteReview,
  getAllReviews,
};