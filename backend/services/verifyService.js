/**
 * @file verifyService.js
 * @purpose Email OTP and TOTP verification service.
 * @responsibilities
 * - Generates and sends 6-digit email OTPs via SMTP
 * - Implements rate limiting (max 3 requests per hour)
 * - Securely stores hashed OTPs in database
 * - Verifies OTPs with attempt limits (max 5 attempts)
 * - Handles master TOTP verification for admin access
 * - Uses constant-time comparison for security
 * @key_exports
 * - sendEmailOTP - Generates and sends OTP to email
 * - verifyEmailOTP - Verifies OTP with attempt tracking
 * - verifyMasterTOTP - Verifies admin TOTP token
 * @dependencies
 * - mailer - Email sending utility
 * - otplib - TOTP verification
 * - crypto - Hashing and secure comparison
 * - EmailOtp - OTP storage model
 * @lifecycle
 * - Called by authController and userController
 * - Requires OTP_EXPIRY_MINUTES and TOTP_MASTER_SECRET environment variables
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import { sendOTPEmail } from '../utils/mailer.js';
import { verifySync } from 'otplib';
import crypto from 'crypto';
import EmailOtp from '../models/EmailOtp.js';

// =============================
// Hashing Utilities
// =============================

const hashOtp = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

// =============================
// Email OTP Management
// =============================

export const sendEmailOTP = async (email) => {
    const normalizedEmail = email.toLowerCase();
    const now = new Date();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);

    const oneHourAgo = new Date(now.getTime() - 60 * 60000);
    const existingOtp = await EmailOtp.findOne({ email: normalizedEmail });

    if (existingOtp) {
        if (existingOtp.lastRequested < oneHourAgo) {
            existingOtp.requestCount = 0;
        }

        if (existingOtp.requestCount >= 3) {
            throw new Error("Too many OTP requests. Please try again in an hour.");
        }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);

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

    const result = await sendOTPEmail(normalizedEmail, otp);

    if (!result.success) {
        throw new Error(result.error || "Failed to send email");
    }

    return true;
};

export const verifyEmailOTP = async (email, otp, keep = false) => {
    const normalizedEmail = email.toLowerCase();
    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail });

    if (!otpRecord) return false;

    if (new Date() > otpRecord.expiresAt) {
        await EmailOtp.deleteOne({ email: normalizedEmail });
        return false;
    }

    if (otpRecord.attempts >= 5) {
        await EmailOtp.deleteOne({ email: normalizedEmail });
        return false;
    }

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
        await EmailOtp.updateOne(
            { email: normalizedEmail },
            { $inc: { attempts: 1 } }
        );
    }

    return isValid;
};

// =============================
// TOTP Verification
// =============================

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
