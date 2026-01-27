import axiosInstance from "@/shared/utils/axiosInstance";
import { BASE_URL } from "@/shared/utils/apiPaths";

// Helper to fix mixed content issues (localhost images in production)
const sanitizeUser = (userData) => {
    if (!userData) return null;

    let sanitized = { ...userData };

    // 1. Fix Localhost issues
    if (sanitized.profileImageUrl && sanitized.profileImageUrl.includes("http://localhost:8000")) {
        sanitized.profileImageUrl = sanitized.profileImageUrl.replace("http://localhost:8000", BASE_URL);
    }

    if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.includes("http://localhost:8000")) {
        sanitized.profileImage = sanitized.profileImage.replace("http://localhost:8000", BASE_URL);
    }

    // 2. Fix Mixed Content issues (Ensuring HTTPS)
    const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isPageHttps || BASE_URL.startsWith("https://")) {
        if (sanitized.profileImageUrl && sanitized.profileImageUrl.startsWith("http://")) {
            sanitized.profileImageUrl = sanitized.profileImageUrl.replace("http://", "https://");
        }
        if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.startsWith("http://")) {
            sanitized.profileImage = sanitized.profileImage.replace("http://", "https://");
        }
    }

    return sanitized;
};

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

export const updateBrokerSettings = async (brokerData) => {
    // Mock implementation as per original
    return { success: true };
};

export const testBrokerConnection = async (brokerData) => {
    // Mock implementation as per original
    return { success: true };
};

export const updateNotificationSettings = async (notificationData) => {
    // Mock implementation as per original
    return { success: true };
};

export const updatePreferences = async (preferencesData) => {
    // Mock implementation as per original
    return { success: true };
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

export const changePassword = async (passwordData) => {
    try {
        const response = await axiosInstance.put("/api/v1/user/password", passwordData);
        return response.data;
    } catch (error) {
        console.error('Error changing password:', error);
        throw error;
    }
};

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

export const deleteUserProfile = async () => {
    try {
        const response = await axiosInstance.delete("/api/v1/user/profile");
        return response.data;
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};
