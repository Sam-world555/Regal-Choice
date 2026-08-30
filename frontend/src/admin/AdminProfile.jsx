import { API_URL } from "../config";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "../Admin.css";
import "../Profile.css";
import { toast } from "react-toastify";

function AdminProfile() {
  const token = sessionStorage.getItem("token");
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

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

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(user._id);
    toast.success("Admin ID copied!");
  };

  if (loading || !user) {
    return <p className="empty-note">Loading profile...</p>;
  }

  return (
    <>
      <div className="admin-profile-hero">
        <div className="admin-profile-avatar">
          {user.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 className="admin-profile-greeting">Hello, Admin {user.name} 👋</h2>
          <p className="admin-profile-email">{user.email}</p>
          <span className="admin-role-badge admin-role-admin">admin</span>
        </div>
      </div>

      <button
        className="admin-user-id-btn"
        onClick={handleCopyUserId}
        title="Click to copy your Admin ID"
      >
        Admin ID: {user._id} 📋
      </button>

      <div className="profile-tabs">
        <button
          className={
            activeTab === "account" ? "profile-tab profile-tab-active" : "profile-tab"
          }
          onClick={() => setActiveTab("account")}
        >
          Account
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

      {activeTab === "account" && (
        <div className="admin-panel">
          <h2 className="panel-title">Change Password</h2>

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
        <div className="admin-panel">
          <h2 className="panel-title">Notification Preferences</h2>

          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">New Order Alerts</p>
              <p className="settings-toggle-desc">
                Get an email whenever a new order comes in. If every admin
                turns this off, no order-alert emails are sent.
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
    </>
  );
}

export default AdminProfile;