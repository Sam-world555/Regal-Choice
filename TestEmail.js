// TEST SCRIPT — run this alone to check if email sending works at all.
// Place this file in your backend project root (same level as server.js).
// Run with: node testEmail.js
//
// This does NOT touch your app — it's a standalone check.

require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("EMAIL_USER from .env:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS length from .env:",
  process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : "MISSING"
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("❌ VERIFY FAILED:", error.message);
  } else {
    console.log("✅ Server is ready to send emails");

    transporter.sendMail(
      {
        from: `"Test" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // sends to yourself
        subject: "Test Email",
        text: "If you see this, email sending works!",
      },
      (err, info) => {
        if (err) {
          console.log("❌ SEND FAILED:", err.message);
        } else {
          console.log("✅ EMAIL SENT:", info.response);
        }
      }
    );
  }
});