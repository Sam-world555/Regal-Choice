import { API_URL } from "./config";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./App.css";
import "./Wishlist.css";
import { toast } from "react-toastify";
import Navbar from "./Navbar";
import ProductSkeleton from "./components/ProductSkeleton";

function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [movingToCartId, setMovingToCartId] = useState(null);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        API_URL + "/api/wishlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWishlistItems(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);

      await axios.post(
        API_URL + "/api/wishlist/toggle",
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Removed from Wishlist");
      setWishlistItems((prev) =>
        prev.filter((item) => item.product._id !== productId)
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove item.");
    } finally {
      setRemovingId(null);
    }
  };

  // Adds the item to cart, then removes it from the wishlist
  const handleMoveToCart = async (productId) => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.warning("Please login first.");
      return;
    }

    try {
      setMovingToCartId(productId);

      await axios.post(
        API_URL + "/api/cart",
        {
          product: productId,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await axios.post(
        API_URL + "/api/wishlist/toggle",
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Moved to Cart!");
      setWishlistItems((prev) =>
        prev.filter((item) => item.product._id !== productId)
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to move item to cart.");
    } finally {
      setMovingToCartId(null);
    }
  };

  return (
    <div className="container wishlist-page">
      <Navbar />

      <h1 className="wishlist-title">My Wishlist</h1>

      {loading ? (
        <div className="wishlist-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="wishlist-empty">
          <h3>Your wishlist is empty.</h3>
          <p className="wishlist-empty-subtext">
            Save items you love and find them here later.
          </p>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div className="card" key={item._id}>
              <div className="card-image-wrap">
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="product-image"
                  />
                )}

                <button
                  className="wishlist-heart-btn active"
                  disabled={removingId === item.product._id}
                  onClick={() => handleRemove(item.product._id)}
                  aria-label="Remove from Wishlist"
                >
                  ♥
                </button>
              </div>

              <div className="card-body">
                <Link
                  to={`/product/${item.product._id}`}
                  className="card-title-link"
                >
                  <h3>{item.product.name}</h3>
                </Link>

                <p className="card-category">{item.product.category}</p>
                <p className="card-description">{item.product.description}</p>

                <div className="card-footer">
                  <p className="card-price">₹{item.product.price}</p>

                  <button
                    className="add-to-cart-btn"
                    disabled={movingToCartId === item.product._id}
                    onClick={() => handleMoveToCart(item.product._id)}
                  >
                    {movingToCartId === item.product._id
                      ? "Moving..."
                      : "Move to Cart"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;