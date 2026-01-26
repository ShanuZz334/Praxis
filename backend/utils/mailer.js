import nodemailer from "nodemailer";

const port = 465; // Use 465 for SSL (More reliable on Cloud)

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: port,
  secure: true, // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Disable pooling to avoid stale connection timeouts
  pool: false,

  // Force IPv4
  family: 4,

  // Loose TLS to avoid handshake hangs (Critical for some cloud envs)
  tls: {
    rejectUnauthorized: false
  },

  // Debugging
  logger: true,
  debug: true,
  connectionTimeout: 60000, // 60s
  greetingTimeout: 30000,
  socketTimeout: 60000,
});
