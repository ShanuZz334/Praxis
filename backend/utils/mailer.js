import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Standard SMTP Configuration for Localhost/Gmail
const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const secure = process.env.SMTP_SECURE === "true" || port === 465;

console.log(`[MAILER CONFIG] Initializing for ${host}:${port} (Secure: ${secure})`);

export const mailer = nodemailer.createTransport({
  host: host,
  port: port,
  secure: secure,
  auth: {
    user: user,
    pass: pass,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// SMTP Verification
mailer.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error.message);
  } else {
    console.log("✅ SMTP Ready: Connection verified successfully");
  }
});
