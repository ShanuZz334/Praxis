```
import nodemailer from "nodemailer";

const port = 587; // Use 587 for STARTTLS by default

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com", // Hardcode for certainty or use process.env.SMTP_HOST
  port: port,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Use Pooling to reduce handshake overhead and avoid rate limits
  pool: true,
  maxConnections: 1,
  rateLimit: 5, // 5 messages per second max
  
  // Force IPv4
  family: 4, 
  
  // Debugging
  logger: true,
  debug: true,
  connectionTimeout: 30000, // 30s
  greetingTimeout: 15000,
  socketTimeout: 30000, 
});
```
