import { API_URL } from "../config";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../Admin.css";
import "../Reviews.css";
import "../ConfirmModal.css";
import { toast } from "react-toastify";
import ConfirmModal from "../ConfirmModal";

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = sessionStorage.getItem("token");

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        API_URL + "/api/products/reviews/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviews(data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (review) => {
    try {
      setDeleting(true);

      await axios.delete(
        `${API_URL}/api/products/${review.product._id}/reviews/${review._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Review deleted successfully!");
      setDeleteTarget(null);
      setReviews((prev) =>
        prev.filter((item) => item._id !== review._id)
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  // Unique product list for the filter dropdown
  const productOptions = useMemo(() => {
    const map = new Map();
    reviews.forEach((review) => {
      map.set(review.product._id, review.product.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    let result = [...reviews];

    if (productFilter) {
      result = result.filter(
        (review) => review.product._id === productFilter
      );
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (review) =>
          review.userName.toLowerCase().includes(term) ||
          review.product.name.toLowerCase().includes(term) ||
          review.comment.toLowerCase().includes(term)
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else if (sortBy === "highest") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      result.sort((a, b) => a.rating - b.rating);
    }

    return result;
  }, [reviews, search, productFilter, sortBy]);

  return (
    <>
      <h2 className="section-title">
        All Reviews
        {reviews.length > 0 && ` (${reviews.length})`}
      </h2>

      <div className="admin-reviews-toolbar">
        <input
          type="text"
          placeholder="Search by user, product, or comment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input admin-reviews-search"
        />

        <select
          className="admin-input admin-reviews-filter"
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
        >
          <option value="">All Products</option>
          {productOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className="admin-input admin-reviews-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {loading ? (
        <p className="empty-note">Loading reviews...</p>
      ) : visibleReviews.length === 0 ? (
        <p className="empty-note">No reviews found.</p>
      ) : (
        <div className="admin-reviews-list">
          {visibleReviews.map((review) => (
            <div key={review._id} className="admin-review-card">
              <img
                src={review.product.image || "/no-image.png"}
                alt={review.product.name}
                className="admin-review-product-image"
              />

              <div className="admin-review-card-body">
                <div className="admin-review-card-header">
                  <span className="admin-review-product-name">
                    {review.product.name}
                  </span>

                  <span className="admin-review-row-stars">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>

                <p className="admin-review-user">
                  by {review.userName} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                {review.comment && (
                  <p className="admin-review-row-comment">
                    {review.comment}
                  </p>
                )}
              </div>

              <button
                className="admin-review-delete-btn"
                onClick={() => setDeleteTarget(review)}
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Review?"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.userName}'s review on "${deleteTarget.product.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}

export default AdminReviews;