import { API_URL } from "./config";
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Login.css";
import { toast } from "react-toastify";

function LoginWithOTP() {
  const [step, setStep] = useState("request"); // "request" | "verify"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        API_URL + "/api/auth/send-login-otp",
        { email }
      );

      toast.success("OTP sent to your email!");
      setStep("verify");
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.warning("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post(
        API_URL + "/api/auth/login-otp",
        { email, otp }
      );

      const token = data.token;
      sessionStorage.setItem("token", token);
      toast.success("Login Successful!");

      // Same as password login — open admin panel in a new tab if this
      // account is an admin (new tab shares this tab's sessionStorage)
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
      toast.error(
        error.response?.data?.message || "Invalid OTP"
      );
      setLoading(false);
    }
  };

  return (
    <div className="container auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Quick Access</p>
        <h1 className="auth-title">Login with OTP</h1>

        {step === "request" ? (
          <form onSubmit={handleRequestOTP} className="auth-form">
            <p className="auth-helper-text">
              Enter your registered email to receive a login code.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <p className="auth-helper-text">
              Enter the OTP sent to <strong>{email}</strong>.
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="auth-input"
              maxLength={6}
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button
              type="button"
              className="auth-resend-btn"
              onClick={handleRequestOTP}
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}

        <p className="auth-switch">
          Prefer a password? <Link to="/login">Login with password</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginWithOTP;