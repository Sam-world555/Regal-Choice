const nodemailer = require("nodemailer");

// ---------- Separate transporters per purpose ----------
// Add the matching env vars to your .env file (see bottom of this file for the list)

const otpTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OTP_EMAIL_USER,
    pass: process.env.OTP_EMAIL_PASS,
  },
});

const orderTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ORDER_EMAIL_USER,
    pass: process.env.ORDER_EMAIL_PASS,
  },
});

const supportTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SUPPORT_EMAIL_USER,
    pass: process.env.SUPPORT_EMAIL_PASS,
  },
});

const generateOTP = () => {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ---------- OTP (login / password-reset) ----------
const sendOTPEmail = async (toEmail, otp, purpose = "verification") => {
  const subjectMap = {
    "password-reset": "Regal Choice — Password Reset OTP",
    "login": "Regal Choice — Login OTP",
  };
  const headingMap = {
    "password-reset": "Reset Your Password",
    "login": "Your Login Code",
  };
  const subject = subjectMap[purpose] || "Regal Choice — Your OTP";
  const heading = headingMap[purpose] || "Your One-Time Password";
  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf9f7;">
      <h2 style="color: #7a1f3d; margin-bottom: 4px;">Regal Choice</h2>
      <p style="color: #6b6560; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-top: 0;">Premium Clothing Brand</p>
      <hr style="border: none; border-top: 1px solid #e7e3dc; margin: 24px 0;" />
      <h3 style="color: #141414;">${heading}</h3>
      <p style="color: #6b6560; font-size: 14px;">Use the code below. It is valid for 10 minutes.</p>
      <div style="background: #ffffff; border: 1px solid #e7e3dc; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #7a1f3d;">${otp}</span>
      </div>
      <p style="color: #6b6560; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
  await otpTransporter.sendMail({
    from: `"Regal Choice" <${process.env.OTP_EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });
};

// ---------- shared order-items table builder ----------
const buildOrderItemsHtml = (items) =>
  (items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; color: #141414; font-size: 13px;">${item.name}${item.size ? ` (${item.size})` : ""}</td>
          <td style="padding: 8px 0; color: #6b6560; font-size: 13px; text-align: center;">x${item.quantity}</td>
          <td style="padding: 8px 0; color: #141414; font-size: 13px; text-align: right;">₹${item.price}</td>
        </tr>`
    )
    .join("");

// ---------- Admin notification (new order) — sent FROM Order-Confirmation account ----------
const sendAdminOrderNotification = async (order) => {
  const adminEmail = "regalchoice786@gmail.com";

  const itemsHtml = buildOrderItemsHtml(order.items);
  const customerName = order.customerName || order.user?.name || "N/A";
  const customerEmail = order.customerEmail || order.user?.email || "N/A";
  const totalAmount = order.totalAmount || order.total || 0;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf9f7;">
      <h2 style="color: #7a1f3d; margin-bottom: 4px;">Regal Choice</h2>
      <p style="color: #6b6560; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-top: 0;">Premium Clothing Brand</p>
      <hr style="border: none; border-top: 1px solid #e7e3dc; margin: 24px 0;" />
      <h3 style="color: #141414;">🛍️ New Order Received</h3>
      <p style="color: #6b6560; font-size: 14px;">Order ID: <strong>${order._id}</strong></p>
      <p style="color: #6b6560; font-size: 14px;">Customer: <strong>${customerName}</strong> (${customerEmail})</p>
      <div style="background: #ffffff; border: 1px solid #e7e3dc; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>
        <hr style="border: none; border-top: 1px solid #e7e3dc; margin: 12px 0;" />
        <p style="text-align: right; font-size: 16px; font-weight: 700; color: #7a1f3d;">Total: ₹${totalAmount}</p>
      </div>
      <p style="color: #6b6560; font-size: 12px;">Log into the admin dashboard to view full order details.</p>
    </div>
  `;

  await orderTransporter.sendMail({
    from: `"Regal Choice Orders" <${process.env.ORDER_EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Order Received — #${order._id}`,
    html,
  });
};

// ---------- Order confirmation — sent to the CUSTOMER, FROM Order-Confirmation account ----------
const sendOrderConfirmationEmail = async (order) => {
  const customerEmail = order.customerEmail || order.user?.email;
  if (!customerEmail) return;

  const customerName = order.customerName || order.user?.name || "there";
  const itemsHtml = buildOrderItemsHtml(order.items);
  const totalAmount = order.totalAmount || order.total || 0;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf9f7;">
      <h2 style="color: #7a1f3d; margin-bottom: 4px;">Regal Choice</h2>
      <p style="color: #6b6560; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-top: 0;">Premium Clothing Brand</p>
      <hr style="border: none; border-top: 1px solid #e7e3dc; margin: 24px 0;" />
      <h3 style="color: #141414;">Thank you for your order, ${customerName}! 🎉</h3>
      <p style="color: #6b6560; font-size: 14px;">Your order has been placed successfully. Here's a quick summary:</p>
      <p style="color: #6b6560; font-size: 14px;">Order ID: <strong>${order._id}</strong></p>
      <div style="background: #ffffff; border: 1px solid #e7e3dc; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>
        <hr style="border: none; border-top: 1px solid #e7e3dc; margin: 12px 0;" />
        <p style="text-align: right; font-size: 16px; font-weight: 700; color: #7a1f3d;">Total: ₹${totalAmount}</p>
      </div>
      <p style="color: #6b6560; font-size: 14px;">Expected delivery: 3-5 business days.</p>
      <p style="color: #6b6560; font-size: 12px; margin-top: 24px;">Questions about your order? Just reply to this email and our support team will help.</p>
    </div>
  `;

  await orderTransporter.sendMail({
    from: `"Regal Choice Orders" <${process.env.ORDER_EMAIL_USER}>`,
    to: customerEmail,
    subject: `Your Regal Choice Order is Confirmed — #${order._id}`,
    html,
  });
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendAdminOrderNotification,
  sendOrderConfirmationEmail,
};

/*
  ---------- Add these to your .env file ----------

  OTP_EMAIL_USER=loginverifyregalchoice@gmail.com
  OTP_EMAIL_PASS=<app password for this account>

  ORDER_EMAIL_USER=orderconfirmationregalchoice@gmail.com
  ORDER_EMAIL_PASS=<app password for this account>

  SUPPORT_EMAIL_USER=customercaresupportregalchoice@gmail.com
  SUPPORT_EMAIL_PASS=<app password for this account>

  (supportTransporter is set up above and ready for when you build
   a "contact support" feature — not wired to anything yet)

  Note: each Gmail account needs its own 16-character "App Password"
  (Google Account -> Security -> 2-Step Verification -> App Passwords).
  Your regular Gmail login password will NOT work here.
*/