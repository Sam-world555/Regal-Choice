import { API_URL } from "../config";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "../Admin.css";
import "../ConfirmModal.css";
import { toast } from "react-toastify";
import ConfirmModal from "../ConfirmModal";

const CATEGORY_OPTIONS = [
  "T-Shirt",
  "Shirt",
  "Jeans",
  "Trouser",
  "Hoodie",
  "Jacket",
  "Sweater",
  "Shorts",
  "Kurta",
  "Ethnic Wear",
  "Activewear",
  "Innerwear",
];

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        API_URL + "/api/products"
      );
      setProducts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const urls = images.map((img) => URL.createObjectURL(img));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleImagesSelected = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleDragStart = (index) => {
    dragIndexRef.current = index;
  };

  const handleDragEnter = (index) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDrop = (dropIndex) => {
    const dragIndex = dragIndexRef.current;

    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });

    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !price || !category) {
      toast.warning("Fill all fields");
      return;
    }

    const token = sessionStorage.getItem("token");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("stock", stock === "" ? 0 : stock);
    formData.append("sku", sku);
    formData.append("featured", featured);
    formData.append("bestseller", bestseller);

    // Images are appended in the order shown in the preview row —
    // the first one becomes the main product image on the backend.
    images.forEach((img) => {
      formData.append("images", img);
    });

    try {
      setSubmitting(true);

      if (editingId) {
        await axios.put(
          `${API_URL}/api/products/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Product Updated Successfully!");
      } else {
        await axios.post(
          API_URL + "/api/products",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Product Added Successfully!");
      }

      setEditingId(null);
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
      setStock("");
      setSku("");
      setFeatured(false);
      setBestseller(false);
      setImages([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchProducts();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);

      const token = sessionStorage.getItem("token");

      await axios.delete(
        `${API_URL}/api/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Product Deleted!");
      setDeleteTarget(null);
      fetchProducts();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setPrice(product.price);
    setCategory(product.category);
    setDescription(product.description);
    setStock(product.stock ?? "");
    setSku(product.sku || "");
    setFeatured(product.featured || false);
    setBestseller(product.bestseller || false);

    // Agar images edit ke time change nahi karni hain
    setImages([]);
  };

  return (
    <>
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

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="admin-input"
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Stock Quantity"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="admin-input"
              min="0"
            />

            <input
              type="text"
              placeholder="SKU (e.g. RC-TSH-BLU-01)"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
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

          <div className="admin-checkbox-row">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured Product
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={bestseller}
                onChange={(e) => setBestseller(e.target.checked)}
              />
              Bestseller
            </label>
          </div>

          <label className="file-label">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImagesSelected}
              className="file-input"
            />
            Choose Product Images
          </label>

          {images.length > 0 && (
            <>
              <p className="preview-hint">
                Drag to reorder — the first image becomes the main product photo.
              </p>

              <div className="preview-row">
                {previewUrls.map((url, index) => (
                  <div
                    key={url}
                    className={
                      dragOverIndex === index
                        ? "preview-thumb-wrap drag-over"
                        : "preview-thumb-wrap"
                    }
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                  >
                    <img src={url} alt="" className="preview-thumb" />

                    {index === 0 && (
                      <span className="preview-main-badge">Main</span>
                    )}

                    <button
                      type="button"
                      className="preview-remove-btn"
                      onClick={() => handleRemoveImage(index)}
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting
              ? editingId
                ? "Updating..."
                : "Adding..."
              : editingId
              ? "Update Product"
              : "Add Product"}
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

                {(product.featured || product.bestseller) && (
                  <div className="admin-product-tags">
                    {product.featured && (
                      <span className="admin-tag-featured">Featured</span>
                    )}
                    {product.bestseller && (
                      <span className="admin-tag-bestseller">Bestseller</span>
                    )}
                  </div>
                )}

                {product.sku && (
                  <p className="admin-product-sku">SKU: {product.sku}</p>
                )}

                <p>
                  <strong>Price:</strong> ₹{Number(product.price).toLocaleString()}
                </p>

                <p>
                  <strong>Category:</strong> {product.category}
                </p>

                <p>
                  <strong>Stock:</strong>{" "}
                  <span
                    className={
                      !product.stock || product.stock <= 0
                        ? "admin-stock-out"
                        : product.stock <= 5
                        ? "admin-stock-low"
                        : "admin-stock-ok"
                    }
                  >
                    {product.stock || 0}
                  </span>
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
                    onClick={() => setDeleteTarget(product)}
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

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => handleDelete(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}

export default AdminProducts;