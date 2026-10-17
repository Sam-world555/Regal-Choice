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

// Wraps multer/Cloudinary so that an upload failure returns a readable
// JSON message instead of Express's default HTML "Internal Server Error" page.
const uploadImages = (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      console.log("UPLOAD ERROR:", err);

      const isMulterError = err.name === "MulterError";

      return res.status(isMulterError ? 400 : 500).json({
        message: `Image upload failed: ${
          err.message || "unknown error"
        }`,
      });
    }

    next();
  });
};

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
  uploadImages,
  addProduct
);

router.put(
  "/:id",
  protect,
  admin,
  uploadImages,
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