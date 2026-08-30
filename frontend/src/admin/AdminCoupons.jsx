import { API_URL } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import "../Admin.css";
import "../ConfirmModal.css";
import { toast } from "react-toastify";
import ConfirmModal from "../ConfirmModal";

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const token = sessionStorage.getItem("token");

  const fetchCoupons = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        API_URL + "/api/coupons",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCoupons(data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code || !discountPercent || !expiryDate) {
      toast.warning("Fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        API_URL + "/api/coupons",
        {
          code,
          discountPercent: Number(discountPercent),
          expiryDate,
          usageLimit: usageLimit === "" ? null : Number(usageLimit),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Coupon created successfully!");
      setCode("");
      setDiscountPercent("");
      setExpiryDate("");
      setUsageLimit("");
      fetchCoupons();
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Failed to create coupon."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      setTogglingId(coupon._id);

      await axios.put(
        `${API_URL}/api/coupons/${coupon._id}`,
        { isActive: !coupon.isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        coupon.isActive ? "Coupon deactivated" : "Coupon activated"
      );
      fetchCoupons();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update coupon.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);

      await axios.delete(
        `${API_URL}/api/coupons/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Coupon deleted successfully!");
      setDeleteTarget(null);
      fetchCoupons();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete coupon.");
    } finally {
      setDeleting(false);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <>
      <div className="admin-panel">
        <h2 className="panel-title">Create New Coupon</h2>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">
            <input
              type="text"
              placeholder="Coupon Code (e.g. REGAL10)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="admin-input"
            />

            <input
              type="number"
              placeholder="Discount %"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="admin-input"
              min="1"
              max="100"
            />

            <input
              type="date"
              placeholder="Expiry Date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="admin-input"
            />

            <input
              type="number"
              placeholder="Usage Limit (blank = unlimited)"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="admin-input"
              min="1"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Creating..." : "Create Coupon"}
          </button>
        </form>
      </div>

      <h2 className="section-title">
        All Coupons{coupons.length > 0 && ` (${coupons.length})`}
      </h2>

      {loading ? (
        <p className="empty-note">Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <p className="empty-note">No coupons yet.</p>
      ) : (
        <div className="admin-coupons-list">
          {coupons.map((coupon) => (
            <div key={coupon._id} className="admin-coupon-card">
              <div className="admin-coupon-body">
                <div className="admin-coupon-header">
                  <span className="admin-coupon-code">{coupon.code}</span>
                  <span className="admin-coupon-discount">
                    {coupon.discountPercent}% OFF
                  </span>
                </div>

                <p className="admin-coupon-meta">
                  Expires:{" "}
                  {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {isExpired(coupon.expiryDate) && (
                    <span className="admin-coupon-expired-tag"> · Expired</span>
                  )}
                </p>

                <p className="admin-coupon-meta">
                  Used: {coupon.usedCount}
                  {coupon.usageLimit !== null
                    ? ` / ${coupon.usageLimit}`
                    : " (unlimited)"}
                </p>

                <span
                  className={
                    coupon.isActive
                      ? "admin-coupon-status active"
                      : "admin-coupon-status inactive"
                  }
                >
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="admin-coupon-actions">
                <button
                  className="admin-coupon-toggle-btn"
                  onClick={() => handleToggleActive(coupon)}
                  disabled={togglingId === coupon._id}
                >
                  {togglingId === coupon._id
                    ? "..."
                    : coupon.isActive
                    ? "Deactivate"
                    : "Activate"}
                </button>

                <button
                  className="delete-btn"
                  onClick={() => setDeleteTarget(coupon)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Coupon?"
        message={
          deleteTarget
            ? `Delete coupon "${deleteTarget.code}"? This action cannot be undone.`
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

export default AdminCoupons;