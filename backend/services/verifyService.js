import { mailer } from '../utils/mailer.js';
import { verifySync } from 'otplib';
import crypto from 'crypto';

// Polyfill for Node versions that don't have globalThis.crypto.getRandomValues
if (!globalThis.crypto) {
    globalThis.crypto = crypto;
}

const otpStore = new Map(); // Use Redis in production

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [email, record] of otpStore.entries()) {
        if (now > record.expiresAt) {
            otpStore.delete(email);
        }
    }
}, 5 * 60 * 1000);

export const sendEmailOTP = async (email) => {
    const normalizedEmail = email.toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    otpStore.set(normalizedEmail, { otp, expiresAt });

    const mailOptions = {
        from: `"Stocky Security" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: "Stocky Verification Code",
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
        await mailer.sendMail(mailOptions);
        return true;
    } catch (err) {
        throw err;
    }
};

export const verifyEmailOTP = (email, otp, keep = false) => {
    const normalizedEmail = email.toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record) {
        console.log(`[OTP] No record found for ${normalizedEmail}`);
        return false;
    }

    if (Date.now() > record.expiresAt) {
        console.log(`[OTP] Record expired for ${normalizedEmail}`);
        otpStore.delete(normalizedEmail);
        return false;
    }

    const isValid = String(record.otp) === String(otp);

    if (isValid && !keep) {
        otpStore.delete(normalizedEmail);
    }

    return isValid;
};

export const verifyMasterTOTP = (token) => {
    const secret = process.env.TOTP_MASTER_SECRET ? process.env.TOTP_MASTER_SECRET.trim() : null;

    if (!secret) {
        console.error('TOTP_MASTER_SECRET not configured');
        return false;
    }

    try {
        const result = verifySync({ token, secret });

        // Handle object return types from different otplib versions
        if (typeof result === 'object' && result !== null) {
            // Based on logs, it returns { valid: true, delta: 0, ... }
            return result.valid === true;
        }

        return !!result;
    } catch (err) {
        console.error("[DEBUG] TOTP Verification Error:", err);
        return false;
    }
};
