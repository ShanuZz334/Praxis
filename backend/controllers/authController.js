import User from "../models/User.js";
import jwt from "jsonwebtoken";
import {
  sendEmailOTP,
  verifyEmailOTP,
  verifyMasterTOTP,
} from "../services/verifyService.js";

/* ============================================================
   TOKEN HELPERS
============================================================ */

const generateAuthToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Short-lived token ONLY for signup verification
const generateSignupToken = (email) => {
  return jwt.sign(
    {
      email,
      verified: true,
      purpose: "signup",
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
};

/* ============================================================
   REQUEST EMAIL OTP
============================================================ */

export const requestOTP = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email is required" });

  try {
    await sendEmailOTP(email);

    res.status(200).json({
      message: "OTP sent successfully to email",
    });
  } catch (err) {
    console.error("❌ OTP SENDING FAILED:", err);
    res.status(500).json({
      message: "Failed to send OTP",
      error: err.message,
    });
  }
};

/* ============================================================
   VERIFY EMAIL OTP + MASTER TOTP
============================================================ */

export const verifyCredentials = async (req, res) => {
  const { email, otp, totp } = req.body;

  if (!email || !otp || !totp) {
    return res.status(400).json({
      message: "Email, OTP and TOTP are required",
    });
  }

  try {
    // 1. Check Email OTP (Keep it for now, in case TOTP fails)
    const emailOtpValid = await verifyEmailOTP(email, otp, true);
    if (!emailOtpValid) {
      return res.status(400).json({
        message: "Invalid or expired email OTP",
      });
    }

    // 2. Check TOTP
    const totpValid = verifyMasterTOTP(totp);
    if (!totpValid) {
      return res.status(400).json({
        message: "Invalid TOTP code",
      });
    }

    // 3. Both valid - Now consume the Email OTP
    verifyEmailOTP(email, otp, false);

    // Issue short-lived signup token
    const signupToken = generateSignupToken(email);

    res.status(200).json({
      message: "Verification successful",
      signupToken,
    });
  } catch (err) {
    res.status(500).json({
      message: "Verification failed",
      error: err.message,
    });
  }
};

/* ============================================================
   REGISTER USER (REQUIRES SIGNUP TOKEN)
============================================================ */

export const registerUser = async (req, res) => {
  const { fullName, email, password, profileImage } = req.body; // Changed profileImageUrl to profileImage
  const signupToken = req.headers["x-signup-token"];

  if (!signupToken) {
    return res.status(400).json({
      message: "Signup verification required",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({
      message: "Invalid or expired signup token",
    });
  }

  if (
    decoded.purpose !== "signup" ||
    decoded.email !== email ||
    !decoded.verified
  ) {
    return res.status(400).json({
      message: "Email verification failed",
    });
  }

  if (!fullName || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      profileImage,
      profileImageUrl: profileImage, // Sync both fields
    });

    res.status(201).json({
      id: user._id,
      user,
      token: generateAuthToken(user._id),
    });
  } catch (err) {
    res.status(500).json({
      message: "User registration failed",
      error: err.message,
    });
  }
};

/* ============================================================
   LOGIN USER
============================================================ */

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    res.status(200).json({
      id: user._id,
      user,
      token: generateAuthToken(user._id),
    });
  } catch (err) {
    res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
};

/* ============================================================
   GET USER INFO (AUTH REQUIRED)
============================================================ */

export const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user info",
      error: err.message,
    });
  }
};
