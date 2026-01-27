import { sendOTP } from '../utils/resendMailer.js';
import { verifySync } from 'otplib';
import crypto from 'crypto';
import EmailOtp from '../models/EmailOtp.js';

/**
 * Hashing helper for OTPs (SHA-256)
 * @param {string} otp 
 * @returns {string} - Hex digest
 */
const hashOtp = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Sends a production-ready OTP with rate limiting and secure storage
 */
export const sendEmailOTP = async (email) => {
    const normalizedEmail = email.toLowerCase();
    const now = new Date();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);

    // 1. Rate Limiting Check (Max 3 requests per hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60000);
    const existingOtp = await EmailOtp.findOne({ email: normalizedEmail });

    if (existingOtp) {
        // Reset count if last request was > 1 hour ago
        if (existingOtp.lastRequested < oneHourAgo) {
            existingOtp.requestCount = 0;
        }

        if (existingOtp.requestCount >= 3) {
            throw new Error("Too many OTP requests. Please try again in an hour.");
        }
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);

    // 3. Store Hashed OTP securely
    await EmailOtp.findOneAndUpdate(
        { email: normalizedEmail },
        {
            otpHash,
            expiresAt,
            attempts: 0,
            $inc: { requestCount: 1 },
            lastRequested: now
        },
        { upsert: true, new: true }
    );

    // 4. Send Email via Resend
    const result = await sendOTP(normalizedEmail, otp);

    if (!result.success) {
        throw new Error(result.error || "Failed to send email");
    }

    console.log(`[OTP] Securely sent to ${normalizedEmail}`);
    return true;
};

/**
 * Verifies OTP with attempt limits and secure hashing
 */
export const verifyEmailOTP = async (email, otp, keep = false) => {
    const normalizedEmail = email.toLowerCase();
    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail });

    if (!otpRecord) return false;

    // 1. Expiry Check
    if (new Date() > otpRecord.expiresAt) {
        await EmailOtp.deleteOne({ email: normalizedEmail });
        return false;
    }

    // 2. Max Attempts Check (Max 5 attempts)
    if (otpRecord.attempts >= 5) {
        await EmailOtp.deleteOne({ email: normalizedEmail }); // Lockout: delete OTP
        return false;
    }

    // 3. Constant-time comparison for safety
    const hashedInput = hashOtp(otp);
    const isValid = crypto.timingSafeEqual(
        Buffer.from(otpRecord.otpHash),
        Buffer.from(hashedInput)
    );

    if (isValid) {
        if (!keep) {
            await EmailOtp.deleteOne({ email: normalizedEmail });
        }
    } else {
        // Increment attempts on failure
        await EmailOtp.updateOne(
            { email: normalizedEmail },
            { $inc: { attempts: 1 } }
        );
    }

    return isValid;
};

/**
 * Master TOTP Verification (Legacy/Admin)
 */
export const verifyMasterTOTP = (token) => {
    const secret = process.env.TOTP_MASTER_SECRET ? process.env.TOTP_MASTER_SECRET.trim() : null;

    if (!secret) {
        console.error('TOTP_MASTER_SECRET not configured');
        return false;
    }

    try {
        const result = verifySync({ token, secret });
        if (typeof result === 'object' && result !== null) {
            return result.valid === true;
        }
        return !!result;
    } catch (err) {
        console.error("[DEBUG] TOTP Verification Error:", err);
        return false;
    }
};
