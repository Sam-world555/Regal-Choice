import { API_URL } from "./config";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "./App.css";
import "./Profile.css";
import "./ConfirmModal.css";
import { toast } from "react-toastify";
import Navbar from "./Navbar";
import ConfirmModal from "./ConfirmModal";

function Profile() {
  const token = sessionStorage.getItem("token");
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Personal info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Addresses
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        API_URL + "/api/users/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(data);
      setName(data.name);
      setEmail(data.email);
      setEmailNotifications(data.emailNotifications !== false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateInfo = async (e) => {
    e.preventDefault();

    try {
      setSavingInfo(true);

      const { data } = await axios.put(
        API_URL + "/api/users/profile",
        { name, email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(data.user);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);

      await axios.put(
        API_URL + "/api/users/change-password",
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleNotifications = async () => {
    const newValue = !emailNotifications;

    try {
      setSavingNotifications(true);

      await axios.put(
        API_URL + "/api/users/notifications",
        { emailNotifications: newValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmailNotifications(newValue);
      toast.success(
        newValue ? "Email notifications turned on" : "Email notifications turned off"
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to update notification settings.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleAddressFormChange = (e) => {
    setAddressForm({
      ...addressForm,
      [e.target.name]: e.target.value,
    });
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "Home",
      fullName: "",
      mobile: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      label: addr.label,
      fullName: addr.fullName,
      mobile: addr.mobile,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    const { fullName, mobile, address, city, state, pincode } = addressForm;

    if (!fullName || !mobile || !address || !city || !state || !pincode) {
      toast.warning("Please fill all address fields");
      return;
    }

    try {
      setSavingAddress(true);

      let response;

      if (editingAddressId) {
        response = await axios.put(
          `${API_URL}/api/users/addresses/${editingAddressId}`,
          addressForm,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Address updated successfully!");
      } else {
        response = await axios.post(
          API_URL + "/api/users/addresses",
          addressForm,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Address added successfully!");
      }

      setUser((prev) => ({ ...prev, addresses: response.data.addresses }));
      resetAddressForm();
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Failed to save address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      setDeletingAddress(true);

      const { data } = await axios.delete(
        `${API_URL}/api/users/addresses/${addressId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser((prev) => ({ ...prev, addresses: data.addresses }));
      toast.success("Address deleted successfully!");
      setDeleteTarget(null);
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete address.");
    } finally {
      setDeletingAddress(false);
    }
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(user._id);
    toast.success("User ID copied!");
  };

  if (loading) {
    return (
      <div className="container profile-page">
        <Navbar />
        <p className="empty-note">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container profile-page">
      <Navbar />

      <h1 className="profile-title">My Profile</h1>

      <button
        className="profile-user-id-btn"
        onClick={handleCopyUserId}
        title="Click to copy your User ID"
      >
        User ID: {user._id} 📋
      </button>

      <div className="profile-tabs">
        <button
          className={
            activeTab === "info" ? "profile-tab profile-tab-active" : "profile-tab"
          }
          onClick={() => setActiveTab("info")}
        >
          Personal Info
        </button>

        <button
          className={
            activeTab === "addresses"
              ? "profile-tab profile-tab-active"
              : "profile-tab"
          }
          onClick={() => setActiveTab("addresses")}
        >
          Addresses
        </button>

        <button
          className={
            activeTab === "password"
              ? "profile-tab profile-tab-active"
              : "profile-tab"
          }
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>

        <button
          className={
            activeTab === "notifications"
              ? "profile-tab profile-tab-active"
              : "profile-tab"
          }
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
      </div>

      {activeTab === "info" && (
        <div className="profile-panel">
          <form onSubmit={handleUpdateInfo} className="profile-form">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="profile-input"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="profile-input"
            />

            <button
              type="submit"
              className="profile-save-btn"
              disabled={savingInfo}
            >
              {savingInfo ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "addresses" && (
        <div className="profile-panel">
          {!showAddressForm && (
            <button
              className="profile-add-address-btn"
              onClick={() => setShowAddressForm(true)}
            >
              + Add New Address
            </button>
          )}

          {showAddressForm && (
            <form onSubmit={handleSaveAddress} className="profile-form">
              <div className="form-grid">
                <input
                  type="text"
                  name="label"
                  placeholder="Label (e.g. Home, Office)"
                  value={addressForm.label}
                  onChange={handleAddressFormChange}
                  className="profile-input"
                />

                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={addressForm.fullName}
                  onChange={handleAddressFormChange}
                  className="profile-input"
                />

                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={addressForm.mobile}
                  onChange={handleAddressFormChange}
                  className="profile-input"
                />

                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  value={addressForm.pincode}
                  onChange={handleAddressFormChange}
                  className="profile-input"
                />
              </div>

              <textarea
                name="address"
                placeholder="Address"
                value={addressForm.address}
                onChange={handleAddressFormChange}
                className="profile-input profile-textarea"
              />

              <div className="checkout-row">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={handleAddressFormChange}
                  className="profile-input"
                />

                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={handleAddressFormChange}
                  className="profile-input"
                />
              </div>

              <label className="profile-checkbox-label">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                />
                Set as default address
              </label>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="review-cancel-btn"
                  onClick={resetAddressForm}
                  disabled={savingAddress}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={savingAddress}
                >
                  {savingAddress
                    ? "Saving..."
                    : editingAddressId
                    ? "Update Address"
                    : "Save Address"}
                </button>
              </div>
            </form>
          )}

          {!showAddressForm && (
            <div className="address-list">
              {user.addresses.length === 0 ? (
                <p className="empty-note">
                  No saved addresses yet. Add one above.
                </p>
              ) : (
                user.addresses.map((addr) => (
                  <div key={addr._id} className="address-card">
                    <div className="address-card-header">
                      <span className="address-label">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="address-default-tag">Default</span>
                      )}
                    </div>

                    <p className="address-name">{addr.fullName}</p>
                    <p className="address-text">
                      {addr.address}, {addr.city}, {addr.state} -{" "}
                      {addr.pincode}
                    </p>
                    <p className="address-mobile">Mobile: {addr.mobile}</p>

                    <div className="address-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditAddress(addr)}
                      >
                        ✏ Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => setDeleteTarget(addr)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "password" && (
        <div className="profile-panel">
          <form onSubmit={handleChangePassword} className="profile-form">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="profile-input"
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="profile-input"
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="profile-input"
            />

            <button
              type="submit"
              className="profile-save-btn"
              disabled={changingPassword}
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="profile-panel">
          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">Email Notifications</p>
              <p className="settings-toggle-desc">
                Get an email when your order is confirmed and for other
                account updates.
              </p>
            </div>

            <button
              className={
                emailNotifications
                  ? "toggle-switch toggle-switch-on"
                  : "toggle-switch"
              }
              onClick={handleToggleNotifications}
              disabled={savingNotifications}
              aria-label="Toggle email notifications"
            >
              <span className="toggle-switch-knob" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Address?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.label}" address? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => handleDeleteAddress(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingAddress}
      />
    </div>
  );
}

export default Profile;