import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Force IPv4 to avoid IPv6 timeouts on some cloud providers (like Render)
  family: 4,
  // Connection timeout settings
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});
