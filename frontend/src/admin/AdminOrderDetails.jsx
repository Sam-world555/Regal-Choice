import { API_URL } from "../config";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../Admin.css";
import { toast } from "react-toastify";

function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const { data } = await axios.get(
        `${API_URL}/api/orders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrder(data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      setUpdating(true);

      const token = sessionStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/orders/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Order Status Updated!");
      await fetchOrder();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

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

  if (loading) {
    return <p className="empty-note">Loading order...</p>;
  }

  if (!order) {
    return (
      <>
        <p className="empty-note">Order not found.</p>
        <button
          className="order-back-link"
          onClick={() => navigate("/admin/orders")}
        >
          ← Back to All Orders
        </button>
      </>
    );
  }

  return (
    <>
      <button
        className="order-back-link"
        onClick={() => navigate("/admin/orders")}
      >
        ← Back to All Orders
      </button>

      <div className="admin-order-card">
        <div className="admin-order-header">
          <h2>📦 Order #{order._id.slice(-6)}</h2>

          <span className={getStatusClass(order.status)}>
            {order.status}
          </span>
        </div>

        <div className="admin-order-controls">
          <label className="status-label">
            Update Status:
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select"
              disabled={updating}
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            {updating && (
              <span className="status-updating-text">Updating...</span>
            )}
          </label>
        </div>

        <p className="admin-order-total">
          <strong>Total:</strong> ₹{Number(order.totalPrice || 0).toLocaleString()}
        </p>

        <hr className="admin-divider" />

        <h3 className="admin-subheading">👤 Customer Details</h3>

        <div className="admin-address-grid">
          <p>
            <strong>Name:</strong> {order.shippingAddress?.fullName}
          </p>

          <p>
            <strong>Mobile:</strong> {order.shippingAddress?.mobile}
          </p>

          <p>
            <strong>Address:</strong> {order.shippingAddress?.address}
          </p>

          <p>
            <strong>City:</strong> {order.shippingAddress?.city}
          </p>

          <p>
            <strong>State:</strong> {order.shippingAddress?.state}
          </p>

          <p>
            <strong>Pincode:</strong> {order.shippingAddress?.pincode}
          </p>
        </div>

        <hr className="admin-divider" />

        <h3 className="admin-subheading">🛍 Products</h3>

        <div className="admin-order-items">
          {order.items.map((item) => (
            <div key={item._id} className="admin-order-item">
              <img
                src={
                  item.product?.images?.[0] ||
                  item.product?.image ||
                  "/no-image.png"
                }
                alt={item.product?.name}
                className="admin-order-item-image"
              />

              <div>
                <h4>{item.product?.name}</h4>

                <p>
                  ₹{Number(item.product?.price || 0).toLocaleString()} ×{" "}
                  {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminOrderDetails;