import { API_URL } from "../config";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../Admin.css";
import { toast } from "react-toastify";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const token = sessionStorage.getItem("token");

  // Decode the current user's id from the token so we know which row is "you"
  const currentUserId = (() => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  })();

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        API_URL + "/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";

    try {
      setTogglingId(user._id);

      await axios.put(
        `${API_URL}/api/users/${user._id}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        newRole === "admin"
          ? `${user.name} is now an admin`
          : `${user.name} is now a regular user`
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Failed to update user role."
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success("User ID copied!");
  };

  const visibleUsers = useMemo(() => {
    let result = [...users];

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u._id.toLowerCase().includes(term) ||
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, search, roleFilter]);

  return (
    <>
      <h2 className="section-title">
        All Users{users.length > 0 && ` (${users.length})`}
      </h2>

      <div className="admin-users-toolbar">
        <input
          type="text"
          placeholder="Search by User ID, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input admin-users-search"
        />

        <select
          className="admin-input admin-users-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin Only</option>
          <option value="user">User Only</option>
        </select>
      </div>

      {loading ? (
        <p className="empty-note">Loading users...</p>
      ) : visibleUsers.length === 0 ? (
        <p className="empty-note">No users found.</p>
      ) : (
        <div className="admin-users-list">
          {visibleUsers.map((user) => (
            <div key={user._id} className="admin-user-row">
              <div className="admin-user-info">
                <span className="admin-user-name">
                  {user.name}
                  {user._id === currentUserId && (
                    <span className="admin-user-you-tag">You</span>
                  )}
                </span>
                <span className="admin-user-email">{user.email}</span>

                <button
                  className="admin-user-id-btn"
                  onClick={() => handleCopyId(user._id)}
                  title="Click to copy full ID"
                >
                  ID: {user._id.slice(-8)} 📋
                </button>
              </div>

              <span
                className={
                  user.role === "admin"
                    ? "admin-role-badge admin-role-admin"
                    : "admin-role-badge admin-role-user"
                }
              >
                {user.role}
              </span>

              <button
                className="admin-role-toggle-btn"
                onClick={() => handleToggleRole(user)}
                disabled={
                  togglingId === user._id || user._id === currentUserId
                }
                title={
                  user._id === currentUserId
                    ? "You cannot change your own role"
                    : ""
                }
              >
                {togglingId === user._id
                  ? "..."
                  : user.role === "admin"
                  ? "Remove Admin"
                  : "Make Admin"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default AdminUsers;