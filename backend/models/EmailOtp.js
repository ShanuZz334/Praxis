import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  requestCount: { type: Number, default: 1 },
  lastRequested: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-delete after expiry
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("EmailOtp", emailOtpSchema);
