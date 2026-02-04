/**
 * @file otp.util.js
 * @purpose OTP hashing utility (legacy).
 * @responsibilities
 * - Provides SHA-256 hashing for OTP codes
 * @key_exports
 * - hashOtp - Hashes OTP using SHA-256
 * @dependencies
 * - crypto - Node.js crypto module
 * @lifecycle
 * - Legacy utility, now replaced by verifyService implementation
 * - Kept for backward compatibility
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import crypto from "crypto";

// =============================
// Hashing Function
// =============================
export function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
