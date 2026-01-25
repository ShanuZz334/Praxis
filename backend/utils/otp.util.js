import crypto from "crypto";

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
