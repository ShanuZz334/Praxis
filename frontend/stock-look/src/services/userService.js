/**
 * @file userService.js
 * @purpose Central service for managing user profile, settings, and authentication data.
 * @responsibilities
 * - Fetches and updates user profile information.
 * - Handles profile image uploads with URL sanitization.
 * - Manages sensitive operations like password changes and email updates.
 * - Bridges the frontend with backend user endpoints.
 * @key_exports
 * - getUserProfile, updateUserProfile
 * - uploadProfilePicture
 * - changePassword, updateEmail
 * @dependencies
 * - axiosInstance (API Client)
 * - BASE_URL (Config)
 * @lifecycle
 * - Imported by UserContext and SettingsPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import axiosInstance from "@/shared/utils/axiosInstance";
import { BASE_URL } from "@/shared/utils/apiPaths";

// =============================
// Helper Functions
// =============================

/**
 * Ensures user data (specifically images) uses correct absolute URLs.
 * Handles localhost vs production URL mismatches.
 */
const sanitizeUser = (userData) => {
    if (!userData) return null;

    let sanitized = { ...userData };

    // 1. Fix Localhost issues
    if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.includes("http://localhost:8000")) {
        sanitized.profileImage = sanitized.profileImage.replace("http://localhost:8000", BASE_URL);
    }

    // 2. Fix Mixed Content issues (Ensuring HTTPS)
    const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isPageHttps || BASE_URL.startsWith("https://")) {
        if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.startsWith("http://")) {
            sanitized.profileImage = sanitized.profileImage.replace("http://", "https://");
        }
    }

    return sanitized;
};

// =============================
// User Profile Operations
// =============================

export const getUserProfile = async () => {
    try {
        const response = await axiosInstance.get("/api/v1/auth/getUser");
        return sanitizeUser(response.data);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const updateUserProfile = async (profileData) => {
    try {
        const response = await axiosInstance.put("/api/v1/user/profile", profileData);
        return sanitizeUser(response.data);
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

export const uploadProfilePicture = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append("image", imageFile);

        const response = await axiosInstance.post("/api/v1/user/upload-image", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });

        let imageUrl = response.data.imageUrl;
        if (imageUrl && imageUrl.includes("http://localhost:8000")) {
            imageUrl = imageUrl.replace("http://localhost:8000", BASE_URL);
        }

        // Enforce HTTPS
        const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        if ((isPageHttps || BASE_URL.startsWith("https://")) && imageUrl && imageUrl.startsWith("http://")) {
            imageUrl = imageUrl.replace("http://", "https://");
        }

        return imageUrl;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

// =============================
// Security & Account Management
// =============================

export const changePassword = async (passwordData) => {
    try {
        const response = await axiosInstance.put("/api/v1/user/password", passwordData);
        return response.data;
    } catch (error) {
        console.error('Error changing password:', error);
        throw error;
    }
};

export const deleteUserProfile = async () => {
    try {
        const response = await axiosInstance.delete("/api/v1/user/profile");
        return response.data;
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

// =============================
// Email Verification Flow
// =============================

export const requestEmailUpdateOTP = async (newEmail) => {
    try {
        const response = await axiosInstance.post("/api/v1/user/request-email-update-otp", { newEmail });
        return response.data;
    } catch (error) {
        console.error('Error requesting OTP:', error);
        throw error;
    }
};

export const updateEmail = async (newEmail, otp) => {
    try {
        const response = await axiosInstance.put("/api/v1/user/update-email", { newEmail, otp });
        return response.data;
    } catch (error) {
        console.error('Error updating email:', error);
        throw error;
    }
};

export const requestCurrentEmailVerificationOTP = async () => {
    try {
        const response = await axiosInstance.post("/api/v1/user/request-verification-otp");
        return response.data;
    } catch (error) {
        console.error('Error requesting verification OTP:', error);
        throw error;
    }
};

export const verifyCurrentEmail = async (otp) => {
    try {
        const response = await axiosInstance.put("/api/v1/user/verify-email", { otp });
        return response.data;
    } catch (error) {
        console.error('Error verifying email:', error);
        throw error;
    }
};

// =============================
// Settings Mock Exports
// =============================

export const updateBrokerSettings = async () => {
    return { success: true };
};

export const testBrokerConnection = async () => {
    return { success: true };
};

export const updateNotificationSettings = async () => {
    return { success: true };
};

export const updatePreferences = async () => {
    return { success: true };
};

// =============================
// Session Management
// =============================

export const logoutUser = async () => {
    try {
        const response = await axiosInstance.post("/api/v1/user/logout");
        return response.data;
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
};
