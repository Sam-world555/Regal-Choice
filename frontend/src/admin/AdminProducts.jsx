import { API_URL } from "../config";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Admin.css";
import { toast } from "react-toastify";

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const response = await axios.get(
        API_URL + "/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(response.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "status-pill status-delivered";
      case "Shipped":
        return "status-pill status-shipped";
      case "Processing":
        return "status-pill status-processing";
      case "Cancelled":
        return "status-pill status-cancelled";
      default:
        return "status-pill status-pending";
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
      const customerMatch =
        order.user?.name?.toLowerCase().includes(term) ||
        order.user?.email?.toLowerCase().includes(term);
      return idMatch || nameMatch || customerMatch;
    });
  }, [sortedOrders, search]);

  return (
    <>
      <h2 className="section-title">
        All Orders{orders.length > 0 && ` (${orders.length})`}
      </h2>

      {!loading && orders.length > 0 && (
        <input
          type="text"
          placeholder="Search by Order ID, customer, or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="orders-search-input"
        />
      )}

      {loading ? (
        <p className="empty-note">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="empty-note">No orders yet.</p>
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
                onClick={() => navigate(`/admin/orders/${order._id}`)}
              >
                <img
                  src={
                    firstItem?.product?.images?.[0] ||
                    firstItem?.product?.image ||
                    "/no-image.png"
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
                    Order #{order._id.slice(-6)} · {order.user?.name || "Unknown"}
                  </p>

                  <p className="order-row-total">
                    ₹{Number(order.totalPrice || 0).toLocaleString()}
                  </p>
                </div>

                <span className={getStatusClass(order.status)}>
                  {order.status}
                </span>

                <span className="order-row-arrow">›</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export default AdminOrders;