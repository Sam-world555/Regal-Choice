import { API_URL } from "./config";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";
import { toast } from "react-toastify";

function Checkout() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "Online",
  });

  const [cartTotal, setCartTotal] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(true);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetchCartTotal();
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);

      const { data } = await axios.get(
        API_URL + "/api/users/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSavedAddresses(data.addresses || []);

      // Auto-select the default address, if one exists
      const defaultAddr = data.addresses?.find((a) => a.isDefault);

      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        applyAddressToForm(defaultAddr);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const applyAddressToForm = (addr) => {
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName,
      mobile: addr.mobile,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    }));
  };

  const handleSelectAddress = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);

    if (addressId === "new") {
      setFormData((prev) => ({
        ...prev,
        fullName: "",
        mobile: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      }));
      return;
    }

    const addr = savedAddresses.find((a) => a._id === addressId);
    if (addr) {
      applyAddressToForm(addr);
    }
  };

  const fetchCartTotal = async () => {
    try {
      setLoadingTotal(true);

      const { data } = await axios.get(
        API_URL + "/api/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const validItems = data.filter((item) => item.product !== null);

      const total = validItems.reduce(
        (sum, item) =>
          sum + (item.product?.price || 0) * item.quantity,
        0
      );

      setCartTotal(total);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingTotal(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const discountedTotal = appliedCoupon
    ? Math.round(
        cartTotal - (cartTotal * appliedCoupon.discountPercent) / 100
      )
    : cartTotal;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.warning("Please enter a coupon code");
      return;
    }

    try {
      setApplyingCoupon(true);

      const { data } = await axios.post(
        API_URL + "/api/coupons/validate",
        { code: couponInput.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAppliedCoupon({
        code: data.code,
        discountPercent: data.discountPercent,
      });

      toast.success(`Coupon applied! ${data.discountPercent}% OFF`);
    } catch (error) {
      console.log(error);
      const message =
        error.response?.data?.message || "Invalid coupon code";
      toast.error(message);
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.success("Coupon removed");
  };

  const loadRazorpay = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const { data } = await axios.post(
        API_URL + "/api/payment/create-order",
        {
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const options = {
        key: "rzp_test_TBHsLu5NlAlcAK",
        amount: data.amount,
        currency: data.currency,
        name: "Regal Choice",
        description: "Order Payment",
        order_id: data.id,

        handler: async function (response) {
          try {
            const token = sessionStorage.getItem("token");

            console.log("Payment Response:", response);

            // Verify payment signature before creating the order
            const verifyResponse = await axios.post(
              API_URL + "/api/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            console.log("Verify Response:", verifyResponse.data);

            if (!verifyResponse.data.verified) {
              toast.error("Payment verification failed. Order not placed.");
              setIsProcessing(false);
              return;
            }

            const orderResponse = await axios.post(
              API_URL + "/api/orders",
              {
                shippingAddress: {
                  fullName: formData.fullName,
                  mobile: formData.mobile,
                  address: formData.address,
                  city: formData.city,
                  state: formData.state,
                  pincode: formData.pincode,
                },
                couponCode: appliedCoupon ? appliedCoupon.code : undefined,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            console.log("Order Saved:", orderResponse.data);

            toast.success("Payment Successful & Order Placed!");

            navigate("/orders");
          } catch (error) {
            console.log("ORDER ERROR:", error);

            if (error.response) {
              console.log(error.response.data);
            }

            toast.error("Payment successful but order save failed.");
            setIsProcessing(false);
          }
        },

        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },

        prefill: {
          name: formData.fullName,
          contact: formData.mobile,
        },

        theme: {
          color: "#111111",
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (err) {
      console.log(err);

      if (err.response) {
        console.log(err.response.data);
      }

      toast.error("Failed to create Razorpay order");
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!formData.fullName.trim()) {
      return toast.warning("Please enter your Full Name");
    }

    if (!formData.mobile.trim()) {
      return toast.warning("Please enter your Mobile Number");
    }

    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      return toast.warning("Please enter a valid Mobile Number");
    }

    if (!formData.address.trim()) {
      return toast.warning("Please enter your Address");
    }

    if (!formData.city.trim()) {
      return toast.warning("Please enter your City");
    }

    if (!formData.state.trim()) {
      return toast.warning("Please enter your State");
    }

    if (!formData.pincode.trim()) {
      return toast.warning("Please enter your Pincode");
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      return toast.warning("Please enter a valid Pincode");
    }

    setIsProcessing(true);
    loadRazorpay();
  };

  return (
    <div className="container checkout-page">
      <div className="checkout-card">
        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-subtitle">Enter your shipping details to continue</p>

        <div className="checkout-form">
          {!loadingAddresses && savedAddresses.length > 0 && (
            <div className="address-select-row">
              <label className="address-select-label">
                Use a saved address
              </label>

              <select
                className="checkout-input"
                value={selectedAddressId}
                onChange={handleSelectAddress}
              >
                {savedAddresses.map((addr) => (
                  <option key={addr._id} value={addr._id}>
                    {addr.label} — {addr.fullName}, {addr.city}
                    {addr.isDefault ? " (Default)" : ""}
                  </option>
                ))}
                <option value="new">+ Enter a new address</option>
              </select>
            </div>
          )}

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="checkout-input"
          />

          <input
            type="text"
            name="mobile"
            placeholder="Mobile Number"
            value={formData.mobile}
            onChange={handleChange}
            className="checkout-input"
          />

          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="checkout-input checkout-textarea"
          />

          <div className="checkout-row">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="checkout-input"
            />

            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              className="checkout-input"
            />
          </div>

          <input
            type="text"
            name="pincode"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="checkout-input"
          />

          <div className="coupon-section">
            {appliedCoupon ? (
              <div className="coupon-applied-row">
                <span className="coupon-applied-tag">
                  ✓ {appliedCoupon.code} applied ({appliedCoupon.discountPercent}% OFF)
                </span>
                <button
                  type="button"
                  className="coupon-remove-btn"
                  onClick={handleRemoveCoupon}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="coupon-input-row">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="checkout-input coupon-input"
                />

                <button
                  type="button"
                  className="coupon-apply-btn"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                >
                  {applyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
            )}
          </div>

          <div className="checkout-summary">
            {loadingTotal ? (
              <p className="checkout-summary-line">Loading total...</p>
            ) : (
              <>
                {appliedCoupon && (
                  <p className="checkout-summary-line strike">
                    ₹{cartTotal}
                  </p>
                )}
                <p className="checkout-summary-total">
                  Total: ₹{discountedTotal}
                </p>
              </>
            )}
          </div>

          <button
            onClick={handlePlaceOrder}
            className="pay-btn"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;