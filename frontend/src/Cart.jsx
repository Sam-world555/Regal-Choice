import { API_URL } from "./config";
import { useEffect, useState } from "react";
import axios from "axios";
import "./Cart.css";
import "./components/Skeleton.css";
import { toast } from "react-toastify";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [goingToCheckout, setGoingToCheckout] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const response = await axios.get(
        API_URL + "/api/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const validItems = response.data.filter(
        (item) => item.product !== null
      );

      setCartItems(validItems);

      const totalPrice = validItems.reduce(
        (sum, item) =>
          sum + (item.product?.price || 0) * item.quantity,
        0
      );

      setTotal(totalPrice);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id, quantity) => {
    try {
      setUpdatingId(id);

      const token = sessionStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/cart/${id}`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchCart();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update quantity.");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (id) => {
    try {
      setRemovingId(id);

      const token = sessionStorage.getItem("token");

      await axios.delete(
        `${API_URL}/api/cart/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Item removed from cart.");
      await fetchCart();
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove item.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckoutClick = () => {
    setGoingToCheckout(true);
    window.location.href = "/checkout";
  };

  return (
    <div className="container cart-page">
      <h1 className="cart-title">My Cart</h1>

      {loading ? (
        <div className="cart-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-cart-item">
              <div className="skeleton-cart-image skeleton-box" />
              <div className="skeleton-cart-body">
                <div className="skeleton-line skeleton-line-title" />
                <div className="skeleton-line skeleton-line-tag" />
                <div className="skeleton-line skeleton-line-text" />
              </div>
            </div>
          ))}
        </div>
      ) : cartItems.length === 0 ? (
        <div className="cart-empty">
          <h3>Your cart is empty.</h3>
          <p className="cart-empty-subtext">
            Browse the collection and add something you love.
          </p>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <div key={item._id} className="cart-item">
                <img
                  src={item.product?.image}
                  alt={item.product?.name}
                  className="cart-item-image"
                />

                <div className="cart-item-body">
                  <h3>{item.product?.name}</h3>

                  <p className="cart-item-price">
                    Price: ₹{item.product?.price}
                  </p>

                  <p className="cart-item-delivery">
                    Free Delivery
                  </p>

                  <div className="cart-qty-selector">
                    <button
                      className="qty-btn"
                      disabled={updatingId === item._id}
                      onClick={() =>
                        item.quantity > 1 &&
                        updateQuantity(item._id, item.quantity - 1)
                      }
                    >
                      −
                    </button>

                    <span className="qty-value">
                      {updatingId === item._id ? "..." : item.quantity}
                    </span>

                    <button
                      className="qty-btn"
                      disabled={updatingId === item._id}
                      onClick={() =>
                        updateQuantity(item._id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <p className="cart-item-subtotal">
                    Subtotal: ₹
                    {(item.product?.price || 0) * item.quantity}
                  </p>

                  <button
                    onClick={() => removeItem(item._id)}
                    className="remove-btn"
                    disabled={removingId === item._id}
                  >
                    {removingId === item._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2 className="cart-total">Total: ₹{total}</h2>

            <button
              onClick={handleCheckoutClick}
              className="checkout-btn"
              disabled={goingToCheckout}
            >
              {goingToCheckout ? "Redirecting..." : "Proceed To Checkout"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;