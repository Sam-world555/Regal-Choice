import { API_URL } from "../config";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../Admin.css";

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = sessionStorage.getItem("token");

      // No token at all in this tab — send to login straight away
      if (!token) {
        toast.warning("Please login first.");
        navigate("/login");
        return;
      }

      try {
        const { data } = await axios.get(
          API_URL + "/api/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data.role !== "admin") {
          toast.error("Admin access only.");
          navigate("/");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.log(error);
        toast.warning("Please login first.");
        navigate("/login");
      }
    };

    verifyAdmin();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    toast.success("Logged Out!");
    setTimeout(() => {
      navigate("/login");
    }, 600);
  };

  if (checking) {
    return (
      <div className="container admin-page">
        <p className="empty-note">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <div className="admin-header-row">
        <h1 className="admin-title">Admin Dashboard</h1>

        <div className="admin-header-actions">
          <Link to="/admin/profile" className="admin-header-link">
            Profile
          </Link>
          <Link to="/admin/profile?tab=notifications" className="admin-header-link">
            Settings
          </Link>
          <button className="admin-header-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-nav">
        <Link
          to="/admin"
          className={isActive("/admin") ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
        >
          Overview
        </Link>
        <Link
          to="/admin/products"
          className={isActive("/admin/products") ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
        >
          Products
        </Link>
        <Link
          to="/admin/orders"
          className={isActive("/admin/orders") ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
        >
          Orders
        </Link>
        <Link
          to="/admin/reviews"
          className={isActive("/admin/reviews") ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
        >
          Reviews
        </Link>
        <Link
          to="/admin/coupons"
          className={isActive("/admin/coupons") ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
        >
          Coupons
        </Link>
        <Link
          to="/admin/users"
          className={isActive("/admin/users") ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
        >
          Users
        </Link>
      </div>

      <Outlet />
    </div>
  );
}

export default AdminLayout;