import { API_URL } from "./config";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "./Orders.css";
import "./OrderTracking.css";
import "./components/Skeleton.css";
import { toast } from "react-toastify";

const TRACKING_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

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
      toast.error("Failed to load order details.");
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

  const handleDownloadInvoice = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(122, 31, 61);
    doc.text("Regal Choice", 15, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Premium Clothing Brand", 15, y + 6);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("INVOICE", pageWidth - 15, y, { align: "right" });

    y += 16;
    doc.setDrawColor(220, 220, 220);
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Order ID: #${order._id.slice(-6)}`, 15, y);
    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`,
      pageWidth - 15,
      y,
      { align: "right" }
    );
    y += 6;
    doc.text(`Status: ${order.status}`, 15, y);
    doc.text(`Payment: Razorpay (Online)`, pageWidth - 15, y, {
      align: "right",
    });
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Shipping Address", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(order.shippingAddress?.fullName || "", 15, y);
    y += 5;
    doc.text(order.shippingAddress?.mobile || "", 15, y);
    y += 5;
    doc.text(
      doc.splitTextToSize(order.shippingAddress?.address || "", 100),
      15,
      y
    );
    y += 10;
    doc.text(
      `${order.shippingAddress?.city || ""}, ${
        order.shippingAddress?.state || ""
      } - ${order.shippingAddress?.pincode || ""}`,
      15,
      y
    );
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setFillColor(245, 243, 239);
    doc.rect(15, y, pageWidth - 30, 8, "F");
    doc.text("Product", 18, y + 5.5);
    doc.text("Qty", pageWidth - 75, y + 5.5);
    doc.text("Price", pageWidth - 50, y + 5.5);
    doc.text("Subtotal", pageWidth - 18, y + 5.5, { align: "right" });
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    order.items.forEach((item) => {
      const name = item.product?.name || "Product";
      const price = item.product?.price || 0;
      const qty = item.quantity;
      const subtotal = price * qty;

      const nameLines = doc.splitTextToSize(name, 90);
      doc.text(nameLines, 18, y);
      doc.text(String(qty), pageWidth - 75, y);
      doc.text(`Rs. ${price}`, pageWidth - 50, y);
      doc.text(`Rs. ${subtotal}`, pageWidth - 18, y, { align: "right" });

      y += Math.max(nameLines.length * 5, 7);
    });

    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(122, 31, 61);
    doc.text(`Total: Rs. ${order.totalPrice}`, pageWidth - 15, y, {
      align: "right",
    });

    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Thank you for shopping with Regal Choice!",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    doc.save(`Invoice_${order._id.slice(-6)}.pdf`);
  };

  if (loading) {
    return (
      <div className="container orders-page">
        <div className="skeleton-order-card">
          <div className="skeleton-order-header">
            <div className="skeleton-line skeleton-line-order-title" />
            <div className="skeleton-line skeleton-line-order-status" />
          </div>
          <div className="skeleton-line skeleton-line-text" />
          <div
            className="skeleton-line skeleton-line-text"
            style={{ width: "60%" }}
          />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container orders-page">
        <p className="empty-note">Order not found.</p>
        <Link to="/orders" className="order-back-link">
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = TRACKING_STEPS.indexOf(order.status);

  return (
    <div className="container orders-page">
      <button className="order-back-link" onClick={() => navigate("/orders")}>
        ← Back to My Orders
      </button>

      <div className="order-card">
        <div className="order-card-header">
          <h2>Order #{order._id.slice(-6)}</h2>

          <div className="order-card-header-right">
            <span
              className="status-pill"
              style={{
                color: getStatusColor(order.status),
                borderColor: getStatusColor(order.status),
              }}
            >
              {order.status}
            </span>

            <button
              className="invoice-download-btn"
              onClick={handleDownloadInvoice}
            >
              ⬇ Invoice
            </button>
          </div>
        </div>

        {order.status === "Cancelled" ? (
          <div className="order-cancelled-banner">
            ✕ This order was cancelled
          </div>
        ) : (
          <div className="order-tracking">
            {TRACKING_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step} className="order-tracking-step">
                  <div className="order-tracking-node">
                    <span
                      className={
                        isCompleted
                          ? "order-tracking-dot completed"
                          : "order-tracking-dot"
                      }
                    >
                      {isCompleted ? "✓" : ""}
                    </span>

                    {index < TRACKING_STEPS.length - 1 && (
                      <span
                        className={
                          index < currentStepIndex
                            ? "order-tracking-line completed"
                            : "order-tracking-line"
                        }
                      />
                    )}
                  </div>

                  <span
                    className={
                      isCurrent
                        ? "order-tracking-label current"
                        : isCompleted
                        ? "order-tracking-label completed"
                        : "order-tracking-label"
                    }
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p className="order-total">
          <strong>Total :</strong> ₹{order.totalPrice}
        </p>

        <hr className="order-divider" />

        <h3 className="order-section-title">Delivery Address</h3>

        <div className="order-address">
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

        <hr className="order-divider" />

        <h3 className="order-section-title">Products</h3>

        <div className="order-items">
          {order.items.map((item) => (
            <div key={item._id} className="order-item">
              <img
                src={item.product?.image}
                alt={item.product?.name}
                className="order-item-image"
              />

              <div>
                <h4>{item.product?.name}</h4>

                <p className="order-item-price">
                  ₹{item.product?.price} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;