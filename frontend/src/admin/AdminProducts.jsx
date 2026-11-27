import { API_URL } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import "../Admin.css";
import "../Profile.css";
import { toast } from "react-toastify";

function AdminProfile() {
  const token = sessionStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_URL + "/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
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
    <div className="admin-profile-page">
      {/* Profile Header Card */}
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

      <button className="admin-user-id-btn" onClick={handleCopyUserId}>
        Admin ID: {user._id} 📋
      </button>

      {/* Password Change Panel */}
      <div className="admin-panel" style={{ maxWidth: '600px' }}>
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
          <button type="submit" className="profile-save-btn" disabled={changingPassword}>
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminProfile;