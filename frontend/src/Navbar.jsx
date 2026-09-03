import { API_URL } from "./config";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function Navbar() {
  const token = sessionStorage.getItem("token");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close the mobile menu whenever a link/button inside it is used
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <Link to="/" className="navbar-logo-link" onClick={closeMenu}>
          <h2>Regal Choice</h2>
        </Link>

        {/* Hamburger button — only visible on small screens via CSS */}
        <button
          className={menuOpen ? "navbar-toggle open" : "navbar-toggle"}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={menuOpen ? "navbar-links open" : "navbar-links"}>
        <Link to="/" onClick={closeMenu}>
          <button className="nav-btn">Home</button>
        </Link>
        <Link to="/wishlist" onClick={closeMenu}>
          <button className="nav-btn nav-btn-with-badge">
            Wishlist
            {wishlistCount > 0 && (
              <span className="nav-badge">{wishlistCount}</span>
            )}
          </button>
        </Link>
        <Link to="/cart" onClick={closeMenu}>
          <button className="nav-btn">Cart</button>
        </Link>
        <Link to="/orders" onClick={closeMenu}>
          <button className="nav-btn">Orders</button>
        </Link>
        {!token ? (
          <>
            <Link to="/login" onClick={closeMenu}>
              <button className="nav-btn">Login</button>
            </Link>
            <Link to="/register" onClick={closeMenu}>
              <button className="nav-btn nav-btn-primary">Register</button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/profile" onClick={closeMenu}>
              <button className="nav-btn">Profile</button>
            </Link>
            <Link to="/profile?tab=notifications" onClick={closeMenu}>
              <button className="nav-btn">Settings</button>
            </Link>
            <button
              className="nav-btn nav-btn-primary"
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;