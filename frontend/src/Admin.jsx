import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Admin.css";

function Admin() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);
  const [orders, setOrders] = useState([]);

  const totalProducts = products.length;
  const totalOrders = orders.length;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0
  );

  const totalCustomers = new Set(
    orders
      .map((order) => order.user?._id)
      .filter(Boolean)
  ).size;

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/products"
      );
      setProducts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    const urls = Array.from(images).map((img) => URL.createObjectURL(img));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !price || !category) {
      alert("Fill all fields");
      return;
    }

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("description", description);

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/products/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        alert("Product Updated Successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/products",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        alert("Product Added Successfully!");
      }

      setEditingId(null);
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
      setImages([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchProducts();
      fetchOrders();
    } catch (error) {
      console.log(error);
      alert("Something went wrong.");
    }
  };




const handleDelete = async (id) => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/products/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Product Deleted!");
    fetchProducts();
  } catch (error) {
    console.log(error);
    alert("Failed to delete product.");
  }
};

const handleStatusChange = async (orderId, status) => {
  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/orders/${orderId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchOrders();
    alert("Order Status Updated!");
  } catch (error) {
    console.log(error);
    alert("Failed to update status");
  }
};

const handleEdit = (product) => {
  setEditingId(product._id);
  setName(product.name);
  setPrice(product.price);
  setCategory(product.category);
  setDescription(product.description);

  // Agar images edit ke time change nahi karni hain
  setImages([]);
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

return (
  <div className="container admin-page">
    <h1 className="admin-title">Admin Dashboard</h1>

    <div className="admin-stats">
      <div className="stat-card">
        <p className="stat-label">📦 Products</p>
        <h1 className="stat-value stat-blue">{totalProducts}</h1>
      </div>

      <div className="stat-card">
        <p className="stat-label">🛒 Orders</p>
        <h1 className="stat-value stat-green">{totalOrders}</h1>
      </div>

      <div className="stat-card">
        <p className="stat-label">💰 Revenue</p>
        <h1 className="stat-value stat-wine">₹{totalRevenue.toLocaleString()}</h1>
      </div>

      <div className="stat-card">
        <p className="stat-label">👤 Customers</p>
        <h1 className="stat-value stat-purple">{totalCustomers}</h1>
      </div>
    </div>

    <div className="admin-panel">
      <h2 className="panel-title">
        {editingId ? "Update Product" : "Add New Product"}
      </h2>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-grid">
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-input"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="admin-input"
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="admin-input"
          />

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="admin-input"
          />
        </div>

        <label className="file-label">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(e.target.files)}
            className="file-input"
          />
          Choose Product Images
        </label>

        {images.length > 0 && (
          <div className="preview-row">
            {previewUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt=""
                className="preview-thumb"
              />
            ))}
          </div>
        )}

        <button type="submit" className="submit-btn">
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </form>
    </div>

    <h2 className="section-title">All Products</h2>

    <div className="admin-products-grid">
      {products.length === 0 ? (
        <p className="empty-note">No products yet.</p>
      ) : (
        products.map((product) => (
          <div key={product._id} className="admin-product-card">
            <img
              src={product.images?.[0] || product.image || "/no-image.png"}
              alt={product.name}
              className="admin-product-image"
            />

            <div className="admin-product-body">
              <h2 className="admin-product-name">{product.name}</h2>

              <p>
                <strong>Price:</strong> ₹{Number(product.price).toLocaleString()}
              </p>

              <p>
                <strong>Category:</strong> {product.category}
              </p>

              <p className="admin-product-desc">{product.description}</p>

              <div className="admin-product-actions">
                <button
                  onClick={() => handleEdit(product)}
                  className="edit-btn"
                >
                  ✏ Edit
                </button>

                <button
                  onClick={() => {
                    if (window.confirm("Delete Product?")) {
                      handleDelete(product._id);
                    }
                  }}
                  className="delete-btn"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>

    <h2 className="section-title">All Orders</h2>

    {orders.length === 0 ? (
      <p className="empty-note">No orders yet.</p>
    ) : (
      orders.map((order) => (
        <div key={order._id} className="admin-order-card">
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
                onChange={(e) =>
                  handleStatusChange(order._id, e.target.value)
                }
                className="status-select"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
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
                  src={item.product?.images?.[0] || item.product?.image || "/no-image.png"}
                  alt={item.product?.name}
                  className="admin-order-item-image"
                />

                <div>
                  <h4>{item.product?.name}</h4>

                  <p>
                    ₹{Number(item.product?.price || 0).toLocaleString()} × {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))
    )}
  </div>
);
}

export default Admin;