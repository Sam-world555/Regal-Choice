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
      const { data } = await axios.get(`${API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      case "Delivered": return "green";
      case "Shipped": return "orange";
      case "Processing": return "#007bff";
      case "Cancelled": return "red";
      default: return "#666";
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
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, pageWidth - 15, y, { align: "right" });
    y += 6;
    doc.text(`Status: ${order.status}`, 15, y);
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
    doc.text(doc.splitTextToSize(order.shippingAddress?.address || "", 100), 15, y);
    y += 10;
    doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || ""}`, 15, y);
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
    doc.text(`Total: Rs. ${order.totalPrice}`, pageWidth - 15, y, { align: "right" });

    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for shopping with Regal Choice!", pageWidth / 2, y, { align: "center" });

    doc.save(`Invoice_${order._id.slice(-6)}.pdf`);
  };

  if (loading) {
    return <div className="page-container"><p className="empty-note">Loading order details...</p></div>;
  }

  if (!order) {
    return (
      <div className="page-container">
        <p className="empty-note">Order not found.</p>
        <Link to="/orders" className="order-back-link">← Back to My Orders</Link>
      </div>
    );
  }

  const currentStepIndex = TRACKING_STEPS.indexOf(order.status);

  return (
    <div className="page-container">
      <button className="order-back-link" onClick={() => navigate("/orders")}>
        ← Back to My Orders
      </button>

      <div className="customer-order-card">
        <div className="customer-order-header">
          <h2>Order #{order._id.slice(-6)}</h2>
          <div className="customer-order-header-right">
            <span className="status-pill" style={{ color: getStatusColor(order.status), borderColor: getStatusColor(order.status) }}>
              {order.status}
            </span>
            <button className="invoice-download-btn" onClick={handleDownloadInvoice}>⬇ Invoice</button>
          </div>
        </div>

        {order.status !== "Cancelled" && (
          <div className="order-tracking-wrapper">
            {TRACKING_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} className="tracking-step">
                  <div className={isCompleted ? "tracking-dot completed" : "tracking-dot"}>
                    {isCompleted ? "✓" : ""}
                  </div>
                  {index < TRACKING_STEPS.length - 1 && (
                    <div className={index < currentStepIndex ? "tracking-line completed" : "tracking-line"} />
                  )}
                  <span className={isCurrent ? "tracking-label current" : "tracking-label"}>{step}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="customer-order-total">
          <strong>Total Amount:</strong> <span>₹{order.totalPrice}</span>
        </div>

        <hr className="customer-order-divider" />

        <h3 className="customer-order-subtitle">Delivery Address</h3>
        <div className="customer-address-box">
          <p><strong>{order.shippingAddress?.fullName}</strong></p>
          <p>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
          <p>Mobile: {order.shippingAddress?.mobile}</p>
        </div>

        <hr className="customer-order-divider" />

        <h3 className="customer-order-subtitle">Products</h3>
        <div className="customer-order-items">
          {order.items.map((item) => (
            <div key={item._id} className="customer-order-item">
              <img src={item.product?.image || "/no-image.png"} alt={item.product?.name} className="customer-order-item-image" />
              <div className="customer-order-item-info">
                <h4>{item.product?.name}</h4>
                <p>₹{item.product?.price} × {item.quantity}</p>
              </div>
              <div className="customer-order-item-total">
                <p>₹{(item.product?.price || 0) * item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;