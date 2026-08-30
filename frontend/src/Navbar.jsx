import { API_URL } from "./config";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function Navbar() {
  const token = sessionStorage.getItem("token");
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    axios
      .get(API_URL + "/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setWishlistCount(response.data.length);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [token]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    toast.success("Logged Out!");
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo-link">
        <h2>Regal Choice</h2>
      </Link>

      <div className="navbar-links">
        <Link to="/">
          <button className="nav-btn">Home</button>
        </Link>

        <Link to="/wishlist">
          <button className="nav-btn nav-btn-with-badge">
            Wishlist
            {wishlistCount > 0 && (
              <span className="nav-badge">{wishlistCount}</span>
            )}
          </button>
        </Link>

        <Link to="/cart">
          <button className="nav-btn">Cart</button>
        </Link>

        <Link to="/orders">
          <button className="nav-btn">Orders</button>
        </Link>

        {!token ? (
          <>
            <Link to="/login">
              <button className="nav-btn">Login</button>
            </Link>
            <Link to="/register">
              <button className="nav-btn nav-btn-primary">Register</button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/profile">
              <button className="nav-btn">Profile</button>
            </Link>
            <Link to="/profile?tab=notifications">
              <button className="nav-btn">Settings</button>
            </Link>
            <button className="nav-btn nav-btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;