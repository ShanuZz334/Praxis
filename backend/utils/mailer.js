import nodemailer from "nodemailer";

// Use 'service: gmail' which automatically sets host to smtp.gmail.com and port to 465
export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Force IPv4 is still important
  family: 4,
  // Connection timeout settings
  logger: true, // Log SMTP traffic to console for debugging
  debug: true,  // Include debug info
  connectionTimeout: 20000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});
