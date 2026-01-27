import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

/**
 * Sends a secure OTP email via Resend
 * @param {string} email - Recipient email
 * @param {string} otp - Plain OTP (only for the email)
 */
export const sendOTP = async (email, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is missing. Email will not be sent.");
    return { success: false, error: "API Key missing" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail.includes("<") ? fromEmail : `Stocky <${fromEmail}>`,
      to: [email],
      subject: 'Your Stocky Verification Code',
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
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error("[Resend] Critical failure:", err.message);
    return { success: false, error: err.message };
  }
};
