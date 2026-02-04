/**
 * @file userRoutes.js
 * @purpose API route definitions for user management.
 * @responsibilities
 * - Defines user profile and settings endpoints
 * - Handles broker settings, notifications, and preferences
 * - Manages email verification and updates
 * - Provides image upload endpoints (protected and public)
 * - Handles user logout and account deletion
 * @key_exports
 * - Express router (default export)
 * @dependencies
 * - express - Router
 * - userController - Request handlers
 * - authMiddleware - Authentication middleware
 * - uploadMiddleware - File upload handling
 * @lifecycle
 * - Registered in server.js as /api/v1/user
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
    updateUserProfile,
    updateBrokerSettings,
    testBrokerConnection,
    updateNotificationSettings,
    updatePreferences,
    changePassword,
    requestEmailUpdateOTP,
    updateEmail,
    requestCurrentEmailVerificationOTP,
    verifyCurrentEmail,
    logoutUser,
    deleteUserProfile,
} from "../controllers/userController.js";

// =============================
// Router Setup
// =============================
const router = express.Router();

// =============================
// Profile Routes
// =============================
router.put("/profile", protect, updateUserProfile);
router.delete("/profile", protect, deleteUserProfile);

// =============================
// Broker Routes
// =============================
router.put("/broker", protect, updateBrokerSettings);
router.post("/broker/test", protect, testBrokerConnection);

// =============================
// Settings Routes
// =============================
router.put("/notifications", protect, updateNotificationSettings);
router.put("/preferences", protect, updatePreferences);
router.put("/password", protect, changePassword);

// =============================
// Email Verification Routes
// =============================
router.post("/request-verification-otp", protect, requestCurrentEmailVerificationOTP);
router.put("/verify-email", protect, verifyCurrentEmail);

// =============================
// Email Update Routes
// =============================
router.post("/request-email-update-otp", protect, requestEmailUpdateOTP);
router.put("/update-email", protect, updateEmail);

// =============================
// Session Routes
// =============================
router.post("/logout", protect, logoutUser);
router.get("/session-check", protect, (req, res) => res.json({ active: true }));

// =============================
// Upload Routes
// =============================
router.post("/upload-image", protect, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = req.file.path;
    res.status(200).json({ imageUrl });
});

router.post("/upload-image-public", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = req.file.path;
    res.status(200).json({ imageUrl });
});

// =============================
// Test Routes
// =============================
router.get("/test", (req, res) => res.json({ msg: "User routes working" }));

// =============================
// Export
// =============================
export default router;
