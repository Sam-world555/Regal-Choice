const { Resend } = require("resend");

// ---------- Resend client ----------
// Render blocks outbound SMTP ports (465/587), so we use Resend's HTTP API instead.
// Add RESEND_API_KEY to your .env file (see bottom of this file).

const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT:
// Until you verify your own domain on Resend, the "from" address MUST be
// "onboarding@resend.dev", and you can only send TO the email address you
// signed up to Resend with. Once you verify a domain (Resend dashboard -> Domains),
// replace FROM_ADDRESS below with something like "orders@yourdomain.com".
const FROM_ADDRESS = "Regal Choice <onboarding@resend.dev>";

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

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject,
    html,
  });

  if (error) {
    console.log("OTP EMAIL ERROR:", error);
    throw new Error(error.message || "Failed to send OTP email");
  }
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

// ---------- Admin notification (new order) ----------
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

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: adminEmail,
    subject: `New Order Received — #${order._id}`,
    html,
  });

  if (error) {
    console.log("ADMIN ORDER EMAIL ERROR:", error);
  }
};

// ---------- Order confirmation — sent to the CUSTOMER ----------
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

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: customerEmail,
    subject: `Your Regal Choice Order is Confirmed — #${order._id}`,
    html,
  });

  if (error) {
    console.log("CUSTOMER ORDER CONFIRMATION EMAIL ERROR:", error);
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendAdminOrderNotification,
  sendOrderConfirmationEmail,
};

/*
  ---------- Add this to your .env file (and to Render's Environment tab) ----------

  RESEND_API_KEY=<your Resend API key>

  ---------- IMPORTANT while testing (before verifying a domain) ----------
  - "from" must stay as "onboarding@resend.dev" (already set above)
  - Resend will only let you send TO the email address you signed up with
    (e.g. sameerdyer200@gmail.com) until you verify your own domain.
  - To send to real customers, go to Resend dashboard -> Domains -> Add your
    domain, follow the DNS verification steps, then change FROM_ADDRESS above
    to something like "Regal Choice <orders@yourdomain.com>".
*/