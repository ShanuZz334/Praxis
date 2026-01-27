import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromEmail = process.env.EMAIL_FROM || `Stocky <${user}>`;

// Initialize SMTP Transporter
export const mailer = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Sends a secure OTP email via SMTP
 * @param {string} email - Recipient email
 * @param {string} otp - Plain OTP
 */
export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: fromEmail,
    to: email,
    subject: "Your OTP Code – Stocky",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px; border: 1px solid #334155;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #6366f1; margin: 0; font-weight: 600; font-size: 24px;">STOCKY</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Institutional Grade Intelligence</p>
          </div>
          
          <div style="background-color: #1e293b; padding: 30px; border-radius: 8px; text-align: center; border: 1px solid #334155;">
            <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 20px;">Use the code below to verify your email address:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #818cf8; margin: 20px 0; background-color: #0f172a; padding: 15px; border-radius: 6px; display: inline-block; border: 1px solid #4f46e5;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Valid for 5 minutes. Do not share this code.</p>
          </div>
  
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #475569;">
            <p>&copy; ${new Date().getFullYear()} Stocky. All rights reserved.</p>
          </div>
        </div>
      `,
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log(`[SMTP] Email sent: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error("[SMTP] Error sending email:", err.message);
    throw new Error("Failed to send verification email. Please try again later.");
  }
};
