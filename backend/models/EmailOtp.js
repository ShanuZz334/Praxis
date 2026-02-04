/**
 * @file EmailOtp.js
 * @purpose MongoDB schema for email OTP verification.
 * @responsibilities
 * - Stores hashed OTP codes for email verification
 * - Tracks OTP expiration and attempt counts
 * - Implements rate limiting via request count tracking
 * - Auto-deletes expired OTPs via TTL index
 * @key_exports
 * - EmailOtp - Mongoose model (default export)
 * @dependencies
 * - mongoose - ODM
 * @lifecycle
 * - Used by verifyService for OTP management
 * - Auto-deleted after expiration via MongoDB TTL index
 * - Indexed on email for fast lookups
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import mongoose from "mongoose";

// =============================
// Schema Definition
// =============================
const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  requestCount: { type: Number, default: 1 },
  lastRequested: { type: Date, default: Date.now }
}, { timestamps: true });

// =============================
// Indexes
// =============================
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// =============================
// Model Export
// =============================
export default mongoose.model("EmailOtp", emailOtpSchema);
