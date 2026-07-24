/**
 * @file mailer.js
 * @purpose Resend SDK email service for OTP delivery.
 * @responsibilities
 * - Configures Resend client
 * - Sends branded OTP emails with professional HTML template
 * - Handles email delivery errors
 * @key_exports
 * - sendOTPEmail - Sends OTP email to recipient
 * @dependencies
 * - resend - Official Resend Node.js SDK
 * @lifecycle
 * - Used by verifyService for OTP delivery
 * - Requires RESEND_API_KEY, EMAIL_FROM environment variables
 * @date 2026-07-24
 */

// =============================
// Imports
// =============================
import { Resend } from 'resend';

let resendInstance = null;

const getResend = () => {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("WARNING: RESEND_API_KEY is not defined in environment variables.");
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

// =============================
// Email Functions
// =============================

export const sendOTPEmail = async (email, otp) => {
  const fromEmail = process.env.EMAIL_FROM || `Praxis <noreply@praxistrade.website>`;
  const resend = getResend();

  const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px; border: 1px solid #334155;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #6366f1; margin: 0; font-weight: 600; font-size: 24px;">PRAXIS</h2>
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
          <p>&copy; ${new Date().getFullYear()} Praxis. All rights reserved.</p>
        </div>
      </div>
    `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Your OTP Code – Praxis",
      html: emailHtml,
    });

    if (error) {
      console.error("[RESEND] API Error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log(`[RESEND] Email sent successfully. ID: ${data?.id}`);
    return { success: true };
  } catch (err) {
    console.error("[RESEND] Error sending email:", err.message);
    throw new Error("Failed to send verification email. Please try again later.");
  }
};
