import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Use Port 587 (STARTTLS) - works on Render and all cloud platforms
const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
const port = 587; // Force 587 for cloud compatibility
const user = process.env.EMAIL_USER || process.env.SMTP_USER;
const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

console.log(`[MAILER CONFIG] Initializing STARTTLS for ${host}:${port}`);

export const mailer = nodemailer.createTransport({
  host: host,
  port: port,
  secure: false, // CRITICAL: false for port 587 (STARTTLS)
  auth: {
    user: user,
    pass: pass,
  },
  tls: {
    rejectUnauthorized: false // Bypass strict certificate validation
  },
  // Removed startup verification - let it fail only when actually sending
  logger: false,
  debug: false
});

console.log('✅ Mailer initialized (verification will happen on first send)');
