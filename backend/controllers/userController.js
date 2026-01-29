import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendEmailOTP, verifyEmailOTP } from "../services/verifyService.js";

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const { fullName, email, profileImage } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            profileImage: updatedUser.profileImage,
            isEmailVerified: updatedUser.isEmailVerified,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update broker settings
// @route   PUT /api/user/broker
// @access  Private
export const updateBrokerSettings = async (req, res) => {
    try {
        const { broker, apiKey, apiSecret, clientId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update broker settings
        user.brokerSettings = {
            broker: broker || "",
            apiKey: apiKey || "",
            apiSecret: apiSecret || "",
            clientId: clientId || "",
        };

        const updatedUser = await user.save();

        res.json({
            message: "Broker settings updated successfully",
            brokerSettings: updatedUser.brokerSettings,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Test broker connection
// @route   POST /api/user/broker/test
// @access  Private
export const testBrokerConnection = async (req, res) => {
    try {
        const { broker, apiKey, apiSecret, clientId } = req.body;

        // TODO: Implement actual broker API connection testing
        // This is a placeholder that simulates testing
        if (!broker || !apiKey || !apiSecret) {
            return res.status(400).json({
                success: false,
                message: "Missing required credentials"
            });
        }

        // Simulate connection test
        const isConnected = true; // Replace with actual broker API test

        if (isConnected) {
            res.json({
                success: true,
                message: `Successfully connected to ${broker}`,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Failed to connect. Please check your credentials.",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// @desc    Update notification settings
// @route   PUT /api/user/notifications
// @access  Private
export const updateNotificationSettings = async (req, res) => {
    try {
        const {
            tradeAlerts,
            portfolioAlerts,
            systemMessages,
            deliveryApp,
            deliveryEmail
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update notification settings
        user.notificationSettings = {
            tradeAlerts: tradeAlerts !== undefined ? tradeAlerts : user.notificationSettings?.tradeAlerts,
            portfolioAlerts: portfolioAlerts !== undefined ? portfolioAlerts : user.notificationSettings?.portfolioAlerts,
            systemMessages: systemMessages !== undefined ? systemMessages : user.notificationSettings?.systemMessages,
            deliveryApp: deliveryApp !== undefined ? deliveryApp : user.notificationSettings?.deliveryApp,
            deliveryEmail: deliveryEmail !== undefined ? deliveryEmail : user.notificationSettings?.deliveryEmail,
        };

        const updatedUser = await user.save();

        res.json({
            message: "Notification settings updated successfully",
            notificationSettings: updatedUser.notificationSettings,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update user preferences
// @route   PUT /api/user/preferences
// @access  Private
export const updatePreferences = async (req, res) => {
    try {
        const { tradingMode, theme, soundAlerts } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update preferences
        user.preferences = {
            tradingMode: tradingMode || user.preferences?.tradingMode || "balanced",
            theme: theme || user.preferences?.theme || "dark",
            soundAlerts: soundAlerts !== undefined ? soundAlerts : user.preferences?.soundAlerts,
        };

        const updatedUser = await user.save();

        res.json({
            message: "Preferences updated successfully",
            preferences: updatedUser.preferences,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/user/password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        // Assign new password directly (User model pre-save hook will handle hashing)
        user.password = newPassword;

        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Request OTP for email update
// @route   POST /api/user/request-email-update-otp
// @access  Private
export const requestEmailUpdateOTP = async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: "New email is required" });

    // Check if email already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" });
    }

    try {
        await sendEmailOTP(newEmail);
        res.status(200).json({ message: "OTP sent to new email" });
    } catch (error) {
        res.status(500).json({ message: "Failed to send OTP", error: error.message });
    }
};

// @desc    Update email with OTP
// @route   PUT /api/user/update-email
// @access  Private
export const updateEmail = async (req, res) => {
    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const isValid = await verifyEmailOTP(newEmail, otp); // consumes OTP
    if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Double check uniqueness race condition
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) return res.status(400).json({ message: "Email is already in use" });

        user.email = newEmail;
        await user.save();

        res.json({ message: "Email updated successfully", email: user.email });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Request OTP for current email verification
// @route   POST /api/user/request-verification-otp
// @access  Private
export const requestCurrentEmailVerificationOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        await sendEmailOTP(user.email);
        res.status(200).json({ message: "Verification OTP sent to your email" });
    } catch (error) {
        res.status(500).json({ message: "Failed to send OTP", error: error.message });
    }
};

// @desc    Verify current email with OTP
// @route   PUT /api/user/verify-email
// @access  Private
export const verifyCurrentEmail = async (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP required" });

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isValid = await verifyEmailOTP(user.email, otp);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.isEmailVerified = true;
        await user.save();

        res.json({ message: "Email verified successfully", isEmailVerified: true });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete user account
// @route   DELETE /api/user/profile
// @access  Private
// @desc    Logout user (clear activeToken)
// @route   POST /api/user/logout
// @access  Private
export const logoutUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.activeToken = null;
            await user.save();
        }
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // TODO: Delete user's other data (trades, settings, etc.) if applicable
        await User.findByIdAndDelete(req.user._id);

        res.json({ message: "User account deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
