import { API_URL } from "./config";
import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  Link,
} from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./ProductDetails.css";
import "./components/Skeleton.css";
import "./Wishlist.css";
import "./Reviews.css";
import "./RelatedProducts.css";
import { toast } from "react-toastify";

function getStockInfo(stock) {
  if (!stock || stock <= 0) {
    return { label: "Out of Stock", className: "stock-badge-out" };
  }
  if (stock <= 5) {
    return { label: `Only ${stock} Left`, className: "stock-badge-low" };
  }
  return { label: "In Stock", className: "stock-badge-in" };
}

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const token = sessionStorage.getItem("token");

  const fetchProduct = () => {
    axios
      .get(`${API_URL}/api/products/${id}`)
      .then((response) => {
        setProduct(response.data);

        if (
          response.data.images &&
          response.data.images.length > 0
        ) {
          setSelectedImage(response.data.images[0]);
        } else {
          setSelectedImage(response.data.image);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;

    setLoadingRelated(true);

    axios
      .get(API_URL + "/api/products")
      .then((response) => {
        const related = response.data
          .filter(
            (item) =>
              item.category === product.category &&
              item._id !== product._id
          )
          .slice(0, 4);

        setRelatedProducts(related);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoadingRelated(false);
      });
  }, [product]);

  useEffect(() => {
    if (!token) return;

    axios
      .get(API_URL + "/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const wishlisted = response.data.some(
          (item) => item.product._id === id
        );
        setIsWishlisted(wishlisted);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [id, token]);

  const handleToggleWishlist = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.warning("Please login first.");
      return;
    }

    try {
      setTogglingWishlist(true);

      const { data } = await axios.post(
        API_URL + "/api/wishlist/toggle",
        { productId: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsWishlisted(data.wishlisted);
      toast.success(
        data.wishlisted ? "Added to Wishlist" : "Removed from Wishlist"
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to update wishlist.");
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleAddToCart = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.warning("Please login first.");
      navigate("/login");
      return false;
    }

    try {
      const response = await axios.post(
        API_URL + "/api/cart",
        {
          product: product._id,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Product added to cart!");
      return true;
    } catch (error) {
      console.log("Axios Error:", error);
      toast.error("Failed to add product.");
      return false;
    }
  };

  const handleAddToCartClick = async () => {
    setAddingToCart(true);
    await handleAddToCart();
    setAddingToCart(false);
  };

  const handleBuyNowClick = async () => {
    setBuyingNow(true);
    const ok = await handleAddToCart();
    if (ok) {
      navigate("/cart");
    }
    setBuyingNow(false);
  };

  const handleRateButtonClick = () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.warning("Please login first.");
      navigate("/login");
      return;
    }
    setShowReviewForm((prev) => !prev);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (reviewRating === 0) {
      toast.warning("Please select a star rating.");
      return;
    }

    try {
      setSubmittingReview(true);

      await axios.post(
        `${API_URL}/api/products/${id}/reviews`,
        {
          rating: reviewRating,
          comment: reviewComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment("");
      fetchProduct();
    } catch (error) {
      console.log("REVIEW ERROR:", error);

      const message =
        error.response?.data?.message ||
        "Failed to submit review.";

      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <div className="container product-details">
        <div className="skeleton-details-card">
          <div>
            <div className="skeleton-details-image skeleton-box" />
            <div className="skeleton-details-thumbs">
              <div className="skeleton-thumb skeleton-box" />
              <div className="skeleton-thumb skeleton-box" />
              <div className="skeleton-thumb skeleton-box" />
            </div>
          </div>

          <div className="skeleton-details-right">
            <div className="skeleton-line skeleton-line-detail-title" />
            <div className="skeleton-line skeleton-line-detail-price" />
            <div className="skeleton-line skeleton-line-detail-text" />
            <div className="skeleton-line skeleton-line-detail-text short" />
            <div className="skeleton-line skeleton-line-detail-btn" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container product-details">
      <div className="details-card">
        <div className="details-left">
          <div className="details-image-wrap">
            <img
              src={selectedImage}
              alt={product.name}
              className="details-image"
            />
          </div>

          <div className="thumbnail-row">
            {(product.images?.length
              ? product.images
              : [product.image]
            ).map((img, index) => (
              <img
                key={index}
                src={img}
                alt=""
                onClick={() => setSelectedImage(img)}
                className={
                  selectedImage === img
                    ? "thumbnail thumbnail-active"
                    : "thumbnail"
                }
              />
            ))}
          </div>
        </div>

        <div className="details-right">
          <h1>{product.name}</h1>

          <h2 className="price">
            ₹{product.price}
          </h2>

          {product.numReviews > 0 ? (
            <div className="rating-summary">
              <span className="rating-stars">
                {"★".repeat(Math.round(product.rating))}
                {"☆".repeat(5 - Math.round(product.rating))}
              </span>
              <span className="rating-value">
                {product.rating.toFixed(1)}
              </span>
              <span className="rating-count">
                ({product.numReviews}{" "}
                {product.numReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          ) : (
            <p className="rating-summary rating-summary-empty">
              No reviews yet
            </p>
          )}

          <span className={`stock-badge-pill ${getStockInfo(product.stock).className}`}>
            {getStockInfo(product.stock).label}
          </span>

          <div className="details-actions-row">
            <button className="rate-btn" onClick={handleRateButtonClick}>
              ⭐ Rate this product
            </button>

            <button
              className={
                isWishlisted
                  ? "details-wishlist-btn active"
                  : "details-wishlist-btn"
              }
              onClick={handleToggleWishlist}
              disabled={togglingWishlist}
            >
              {isWishlisted ? "♥ Wishlisted" : "♡ Add to Wishlist"}
            </button>
          </div>

          {showReviewForm && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <p className="review-form-label">Your Rating</p>

              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= (hoverRating || reviewRating)
                        ? "star-picker-icon filled"
                        : "star-picker-icon"
                    }
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>

              <textarea
                className="review-textarea"
                placeholder="Share your experience with this product..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />

              <div className="review-form-actions">
                <button
                  type="button"
                  className="review-cancel-btn"
                  onClick={() => setShowReviewForm(false)}
                  disabled={submittingReview}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="review-submit-btn"
                  disabled={submittingReview}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          )}

          <p className="delivery-note">Free Delivery within 3-5 days</p>

          <p className="category">
            Category: {product.category}
            {product.sku && (
              <span className="sku-text"> · SKU: {product.sku}</span>
            )}
          </p>

          <div className="description description-markdown">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>

          <div className="quantity-selector">
            <button
              className="qty-btn"
              onClick={() =>
                quantity > 1 &&
                setQuantity(quantity - 1)
              }
            >
              −
            </button>

            <span className="qty-value">
              {quantity}
            </span>

            <button
              className="qty-btn"
              onClick={() =>
                quantity < product.stock &&
                setQuantity(quantity + 1)
              }
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>

          <div className="details-buttons">
            <button
              className="btn-outline"
              onClick={handleAddToCartClick}
              disabled={addingToCart || buyingNow || product.stock <= 0}
            >
              {product.stock <= 0
                ? "Out of Stock"
                : addingToCart
                ? "Adding..."
                : "Add To Cart"}
            </button>

            <button
              className="btn-solid"
              onClick={handleBuyNowClick}
              disabled={addingToCart || buyingNow || product.stock <= 0}
            >
              {product.stock <= 0
                ? "Out of Stock"
                : buyingNow
                ? "Processing..."
                : "Buy Now"}
            </button>
          </div>
        </div>
      </div>

      <div className="reviews-section">
        <h2 className="reviews-section-title">
          Customer Reviews
          {product.numReviews > 0 && ` (${product.numReviews})`}
        </h2>

        {product.reviews?.length === 0 ? (
          <p className="reviews-empty">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          <div className="reviews-list">
            {product.reviews?.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-item-header">
                  <span className="review-author">{review.name}</span>
                  <span className="review-stars">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>

                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}

                <p className="review-date">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loadingRelated && relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="related-products-title">You May Also Like</h2>

          <div className="related-products-grid">
            {relatedProducts.map((item) => (
              <Link
                to={`/product/${item._id}`}
                key={item._id}
                className="related-product-card"
              >
                <div className="related-product-image-wrap">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="related-product-image"
                    />
                  )}
                </div>

                <div className="related-product-body">
                  <h3 className="related-product-name">{item.name}</h3>
                  <p className="related-product-price">₹{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;