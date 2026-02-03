/**
 * @file authController.js
 * @purpose Authentication controller for user registration, login, and verification.
 * @responsibilities
 * - Handles user signup with email OTP and TOTP verification.
 * - Handles user login with password authentication.
 * - Generates JWT tokens for authenticated sessions.
 * - Validates signup tokens before user registration.
 * - Retrieves authenticated user information.
 * @key_exports
 * - verifyCredentials - Verify email OTP and master TOTP
 * - registerUser - Register new user with signup token
 * - loginUser - Authenticate existing user
 * - getUserInfo - Get authenticated user details
 * @dependencies
 * - ../models/User.js - User model
 * - jsonwebtoken - JWT token generation/verification
 * - ../services/verifyService.js - TOTP verification
 * @lifecycle
 * - Called by authRoutes.js
 * - Requires JWT_SECRET environment variable
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { verifyMasterTOTP } from "../services/verifyService.js";

// =============================
// Token Helpers
// =============================

const generateAuthToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

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

// =============================
// Verify Credentials
// =============================

export const verifyCredentials = async (req, res) => {
  const { email, totp } = req.body;

  if (!email || !totp) {
    return res.status(400).json({
      message: "Email and TOTP are required",
    });
  }

  try {
    const totpValid = verifyMasterTOTP(totp);
    if (!totpValid) {
      return res.status(400).json({
        message: "Invalid TOTP code",
      });
    }

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

// =============================
// Register User
// =============================

export const registerUser = async (req, res) => {
  const { fullName, email, password, profileImage } = req.body;
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
    });

    const token = generateAuthToken(user._id);
    user.activeToken = token;
    await user.save();

    res.status(201).json({
      id: user._id,
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "User registration failed",
      error: err.message,
    });
  }
};

// =============================
// Login User
// =============================

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

    const token = generateAuthToken(user._id);
    user.activeToken = token;
    await user.save();

    res.status(200).json({
      id: user._id,
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
};

// =============================
// Get User Info
// =============================

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
