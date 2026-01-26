import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Force Port 465 (SSL) for production reliability, especially on Render
const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
const envPort = Number(process.env.EMAIL_PORT) || Number(process.env.SMTP_PORT);

// If host is Gmail and we are on Render, Port 465 is the only one we trust
const isGmail = host.includes("gmail") || host.includes("googlemail");
const port = (isGmail && process.env.NODE_ENV === "production") ? 465 : (envPort || 465);
const secure = port === 465;

const user = process.env.EMAIL_USER || process.env.SMTP_USER;
const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

console.log(`[MAILER CONFIG] Forced Init for ${host}:${port} (Secure: ${secure})`);

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
