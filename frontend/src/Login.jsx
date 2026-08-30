import { API_URL } from "./config";
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Login.css";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(
        API_URL + "/api/auth/login",
        {
          email,
          password,
        }
      );

      const token = response.data.token;
      sessionStorage.setItem("token", token);

      toast.success("Login Successful!");

      // Check the role and, if admin, open the admin panel in a new tab
      // (window.open shares this tab's sessionStorage with the new tab,
      // so the admin tab is already logged in — no separate login needed)
      try {
        const { data: profile } = await axios.get(
          API_URL + "/api/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (profile.role === "admin") {
          window.open("/admin", "_blank");
        }
      } catch (profileError) {
        console.log(profileError);
      }

      window.location.href = "/";
    } catch (error) {
      console.log(error);
      toast.error("Invalid Email or Password");
      setLoading(false);
    }
  };

  return (
    <div className="container auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Welcome Back</p>
        <h1 className="auth-title">Login</h1>

        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="auth-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="auth-input"
          />

          <div className="auth-links-row">
            <Link to="/forgot-password" className="auth-inline-link">
              Forgot Password?
            </Link>
            <Link to="/login-otp" className="auth-inline-link">
              Login with OTP
            </Link>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          New to Regal Choice? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;