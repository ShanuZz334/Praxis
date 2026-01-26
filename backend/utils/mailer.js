import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Use suggested naming or fallback to existing names
const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.EMAIL_PORT) || Number(process.env.SMTP_PORT) || 465;
const user = process.env.EMAIL_USER || process.env.SMTP_USER;
const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const secure = process.env.EMAIL_SECURE === "true" || port === 465;

console.log(`[MAILER CONFIG] Initializing for ${host}:${port} (Secure: ${secure})`);

export const mailer = nodemailer.createTransport({
  host: host,
  port: port,
  secure: secure,
  auth: {
    user: user,
    pass: pass,
  },
  // Disable pooling to ensure fresh connection attempts
  pool: false,

  // Force IPv4 to avoid IPv6 handshake hangs on cloud networks
  family: 4,

  // Loose TLS (rejectUnauthorized: false) is CRITICAL for Render environments
  tls: {
    rejectUnauthorized: false
  },

  // Robust timeout settings
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,

  // Enable debug logging for better observation in Render dashboard
  logger: true,
  debug: true
});

// Immediate Verification
mailer.verify((error, success) => {
  if (error) {
    console.error("❌ MAILER VERIFICATION FAILED:", error.message);
  } else {
    console.log("✅ MAILER READY: SMTP connection verified successfully");
  }
});
