import { API_URL } from "./config";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Orders.css";
import "./components/Skeleton.css";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const response = await axios.get(
        API_URL + "/api/orders/myorders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "green";

      case "Shipped":
        return "orange";

      case "Processing":
        return "#007bff";

      case "Cancelled":
        return "red";

      default:
        return "#666";
    }
  };

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    if (!search.trim()) return sortedOrders;

    const term = search.trim().toLowerCase();

    return sortedOrders.filter((order) => {
      const idMatch = order._id.toLowerCase().includes(term);
      const nameMatch = order.items.some((item) =>
        item.product?.name?.toLowerCase().includes(term)
      );
      return idMatch || nameMatch;
    });
  }, [sortedOrders, search]);

  return (
    <div className="container orders-page">
      <h1 className="orders-title">My Orders</h1>

      {!loading && orders.length > 0 && (
        <input
          type="text"
          placeholder="Search by Order ID or product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="orders-search-input"
        />
      )}

      {loading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton-order-row">
            <div className="skeleton-box skeleton-order-row-image" />
            <div className="skeleton-order-row-body">
              <div className="skeleton-line skeleton-line-order-title" />
              <div className="skeleton-line skeleton-line-text" style={{ width: "50%" }} />
            </div>
          </div>
        ))
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <h3>No Orders Yet.</h3>
          <p className="orders-empty-subtext">
            Your placed orders will show up here.
          </p>
        </div>
      ) : visibleOrders.length === 0 ? (
        <p className="empty-note">No orders match your search.</p>
      ) : (
        <div className="orders-list">
          {visibleOrders.map((order) => {
            const firstItem = order.items[0];
            const extraCount = order.items.length - 1;

            return (
              <button
                key={order._id}
                className="order-row"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                <img
                  src={
                    firstItem?.product?.image || "/no-image.png"
                  }
                  alt={firstItem?.product?.name}
                  className="order-row-image"
                />

                <div className="order-row-body">
                  <h3 className="order-row-title">
                    {firstItem?.product?.name}
                    {extraCount > 0 && (
                      <span className="order-row-extra">
                        {" "}
                        +{extraCount} more
                      </span>
                    )}
                  </h3>

                  <p className="order-row-meta">
                    Order #{order._id.slice(-6)} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  <p className="order-row-total">₹{order.totalPrice}</p>
                </div>

                <span
                  className="status-pill order-row-status"
                  style={{
                    color: getStatusColor(order.status),
                    borderColor: getStatusColor(order.status),
                  }}
                >
                  {order.status}
                </span>

                <span className="order-row-arrow">›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;