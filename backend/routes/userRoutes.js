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
    deleteUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

// User profile routes
router.put("/profile", protect, updateUserProfile);
router.put("/broker", protect, updateBrokerSettings);
router.post("/broker/test", protect, testBrokerConnection);
router.put("/notifications", protect, updateNotificationSettings);
router.put("/preferences", protect, updatePreferences);
router.put("/password", protect, changePassword);

// Email verification routes (Settings Page)
router.post("/request-verification-otp", protect, requestCurrentEmailVerificationOTP);
router.put("/verify-email", protect, verifyCurrentEmail);

// Email update routes
router.post("/request-email-update-otp", protect, requestEmailUpdateOTP);
router.put("/update-email", protect, updateEmail);

// Delete account route
router.delete("/profile", protect, deleteUserProfile);



// Test route to verify router is working
router.get("/test", (req, res) => res.json({ msg: "User routes working" }));

// Upload route
router.post("/upload-image", protect, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});

// Public Upload route (for Signup)
router.post("/upload-image-public", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});

export default router;
