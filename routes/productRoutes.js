const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  addReview,
  deleteReview,
  getAllReviews,
} = require("../controllers/reviewController");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

// ======================
// Public Routes
// ======================

router.get("/", getProducts);

// IMPORTANT: this specific route must come BEFORE "/:id",
// otherwise Express will treat "reviews" as a product id.
router.get(
  "/reviews/all",
  protect,
  admin,
  getAllReviews
);

router.get("/:id", getSingleProduct);

// ======================
// Admin Routes
// ======================

router.post(
  "/",
  protect,
  admin,
  upload.array("images", 5),
  addProduct
);

router.put(
  "/:id",
  protect,
  admin,
  upload.array("images", 5),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteProduct
);

// ======================
// Review Routes
// ======================

router.post(
  "/:id/reviews",
  protect,
  addReview
);

router.delete(
  "/:id/reviews/:reviewId",
  protect,
  admin,
  deleteReview
);

module.exports = router;