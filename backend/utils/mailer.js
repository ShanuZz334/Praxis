import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT) || 465; // Default to 465 if not set

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Force IPv4 to avoid IPv6 timeouts on some cloud providers (like Render)
  family: 4,
  // Connection timeout settings
  connectionTimeout: 20000, // Increased to 20s
  greetingTimeout: 10000,
  socketTimeout: 20000,
});
