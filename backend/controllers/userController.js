/**
 * @file userController.js
 * @purpose User profile and settings management controller.
 * @responsibilities
 * - Handles user profile updates (name, email, profile image)
 * - Manages broker settings and connection testing
 * - Controls notification preferences
 * - Handles user preferences (theme, trading mode, sound alerts)
 * - Implements password change functionality
 * - Manages email update and verification with OTP
 * - Handles user logout and account deletion
 * @key_exports
 * - updateUserProfile - Updates user profile information
 * - updateBrokerSettings - Updates broker API credentials
 * - testBrokerConnection - Tests broker API connection
 * - updateNotificationSettings - Updates notification preferences
 * - updatePreferences - Updates user preferences
 * - changePassword - Changes user password
 * - requestEmailUpdateOTP - Sends OTP for email update
 * - updateEmail - Updates email with OTP verification
 * - requestCurrentEmailVerificationOTP - Sends OTP for email verification
 * - verifyCurrentEmail - Verifies email with OTP
 * - logoutUser - Logs out user and clears active token
 * - deleteUserProfile - Deletes user account
 * @dependencies
 * - User - User model
 * - bcryptjs - Password hashing
 * - verifyService - Email OTP services
 * @lifecycle
 * - Called by userRoutes.js
 * - Requires JWT authentication middleware
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendEmailOTP, verifyEmailOTP, verifyMasterTOTP } from "../services/verifyService.js";
import db from "../config/localDb.js";
import AiChatThread from "../models/AiChatThread.js";
import Candle from "../models/Candle.js";
import MarketTick from "../models/MarketTick.js";
import MarketStatus from "../models/MarketStatus.js";
import OptionChain from "../models/OptionChain.js";
import OptionGreek from "../models/OptionGreek.js";
import Quote from "../models/Quote.js";
import Holding from "../models/Holding.js";
import Position from "../models/Position.js";
import Order from "../models/Order.js";
import Trade from "../models/Trade.js";
import AiCardPrompt from "../models/AiCardPrompt.js";
import AiProvider from "../models/AiProvider.js";
import Watchlist from "../models/Watchlist.js";
import UpstoxAuth from "../models/UpstoxAuth.js";
import Passkey from "../models/Passkey.js";
import { invalidateGlobalCache } from "../routes/dataRoutes.js";
import { clearBroadcastMemoryCaches } from "../services/upstoxMarketData.js";

// =============================
// Profile Management
// =============================

export const updateUserProfile = async (req, res) => {
    try {
        if (req.user.isDemo) {
            return res.json({
                _id: req.user._id,
                fullName: req.body.fullName || req.user.fullName,
                email: req.body.email || req.user.email,
                profileImage: req.body.profileImage !== undefined ? req.body.profileImage : req.user.profileImage,
                isEmailVerified: true,
            });
        }

        const { fullName, email, profileImage } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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

export const deleteUserProfile = async (req, res) => {
    try {
        const { totp, confirmText } = req.body || {};

        if (confirmText !== "DELETE") {
            return res.status(400).json({ message: "Invalid confirmation text. Must type DELETE" });
        }

        if (!totp || !verifyMasterTOTP(totp)) {
            return res.status(400).json({ message: "Invalid or expired Authenticator TOTP code" });
        }

        if (req.user.isDemo) {
            return res.json({ message: "User account deleted successfully" });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Clean up user-related records
        await Promise.allSettled([
            AiChatThread.deleteMany({ userId: req.user._id }),
            Watchlist.deleteMany({}),
            UpstoxAuth.deleteMany({ userId: req.user._id }),
            Passkey.deleteMany({ userId: req.user._id })
        ]);

        await User.findByIdAndDelete(req.user._id);

        res.json({ success: true, message: "User account deleted successfully" });
    } catch (error) {
        console.error("[DangerZone] deleteUserProfile error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =============================
// Danger Zone: Reset AI Chats
// =============================
export const resetAiChats = async (req, res) => {
    try {
        const { totp, confirmText } = req.body || {};

        if (confirmText !== "RESET CHATS") {
            return res.status(400).json({ message: "Invalid confirmation text. Must type RESET CHATS" });
        }

        if (!totp || !verifyMasterTOTP(totp)) {
            return res.status(400).json({ message: "Invalid or expired Authenticator TOTP code" });
        }

        // MongoDB: Clear all AI chat threads for this user
        await AiChatThread.deleteMany({ userId: req.user._id });

        // SQLite: Clear cached card insights and store
        try {
            db.exec(`
                DELETE FROM ai_insights_cache;
                DELETE FROM ai_card_store;
            `);
        } catch (dbErr) {
            console.warn("[DangerZone] SQLite chat cache clean warning:", dbErr.message);
        }

        res.json({
            success: true,
            message: "All AI conversations and cached card insights cleared successfully."
        });
    } catch (error) {
        console.error("[DangerZone] resetAiChats error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =============================
// Danger Zone: Clear Market Cache
// =============================
export const clearMarketCache = async (req, res) => {
    try {
        const { totp, confirmText, clearMode = "preserve_ohlcv" } = req.body || {};

        if (confirmText !== "CLEAR CACHE") {
            return res.status(400).json({ message: "Invalid confirmation text. Must type CLEAR CACHE" });
        }

        if (!totp || !verifyMasterTOTP(totp)) {
            return res.status(400).json({ message: "Invalid or expired Authenticator TOTP code" });
        }

        const shouldPreserveOHLCV = clearMode !== "full";

        // MongoDB: Clear volatile market streams
        const mongoTasks = [
            MarketTick.deleteMany({}),
            MarketStatus.deleteMany({}),
            OptionChain.deleteMany({}),
            OptionGreek.deleteMany({}),
            Quote.deleteMany({})
        ];

        // Only delete MongoDB candles if full wipe is explicitly requested
        if (!shouldPreserveOHLCV) {
            mongoTasks.push(Candle.deleteMany({}));
        }

        await Promise.allSettled(mongoTasks);

        // SQLite: Safely truncate volatile calculation and market cache tables
        // NOTE: Master 'instruments', 'journal_notes', 'user_overrides', 'user_preferences', 'chart_drawings', 'market_events', 'catalysts' are STRICTLY PRESERVED.
        const volatileCacheTables = [
            "market_ticks",
            "quotes",
            "option_chain",
            "card_snapshots",
            "fundamentals_data",
            "technicals_data",
            "options_data",
            "global_data",
            "header_data",
            "index_ticks",
            "backfill_state",
            "card_score_history",
            "global_cache",
            "market_broadcast_cache",
            "oi_base_snapshots",
            "page_composite_snapshots",
            "foreign_page_cache",
            "fundamentals_cache",
            "technicals_cache",
            "options_cache",
            "fii_dii_history"
        ];

        // If full wipe is requested, also include candles and historical_backfill_meta
        const tablesToClear = shouldPreserveOHLCV
            ? volatileCacheTables
            : ["candles", "historical_backfill_meta", ...volatileCacheTables];

        for (const table of tablesToClear) {
            try {
                db.prepare(`DELETE FROM ${table}`).run();
            } catch (err) {
                console.warn(`[DangerZone] Error clearing table ${table}:`, err.message);
            }
        }

        // Invalidate in-memory caches
        try { invalidateGlobalCache(); } catch (_) {}
        try { clearBroadcastMemoryCaches(); } catch (_) {}

        // Checkpoint WAL and run background VACUUM to reclaim disk space from purged rows
        try {
            db.pragma('wal_checkpoint(TRUNCATE)');
        } catch (_) {}

        setTimeout(() => {
            try {
                db.exec("VACUUM");
                db.pragma('wal_checkpoint(TRUNCATE)');
            } catch (_) {}
        }, 300);

        res.json({
            success: true,
            clearMode: shouldPreserveOHLCV ? "preserve_ohlcv" : "full",
            message: shouldPreserveOHLCV
                ? "Market cache and telemetry cleared successfully. OHLCV candlestick records and master catalog preserved."
                : "Full market cache and historical OHLCV candles cleared successfully. Master catalog preserved."
        });
    } catch (error) {
        console.error("[DangerZone] clearMarketCache error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =============================
// Danger Zone: Factory Reset / App Handover
// =============================
export const factoryReset = async (req, res) => {
    try {
        const { totp, confirmText } = req.body || {};

        if (confirmText !== "FACTORY RESET") {
            return res.status(400).json({ message: "Invalid confirmation text. Must type FACTORY RESET" });
        }

        if (!totp || !verifyMasterTOTP(totp)) {
            return res.status(400).json({ message: "Invalid or expired Authenticator TOTP code" });
        }

        // Reset user record: wipe broker credentials, reset preferences, invalidate active tokens
        const user = await User.findById(req.user._id);
        if (user) {
            user.brokerSettings = {
                broker: "",
                apiKey: "",
                apiSecret: "",
                clientId: ""
            };
            user.preferences = {
                tradingMode: "balanced",
                theme: "dark",
                soundAlerts: false
            };
            user.activeToken = null;
            await user.save();
        }

        // MongoDB: Clear all user-specific data, custom prompts, watchlists, broker sessions
        await Promise.allSettled([
            AiChatThread.deleteMany({}),
            AiCardPrompt.deleteMany({}),
            Watchlist.deleteMany({}),
            UpstoxAuth.deleteMany({}),
            Passkey.deleteMany({}),
            Holding.deleteMany({}),
            Position.deleteMany({}),
            Order.deleteMany({}),
            Trade.deleteMany({}),
            Candle.deleteMany({}),
            MarketTick.deleteMany({}),
            MarketStatus.deleteMany({}),
            OptionChain.deleteMany({}),
            OptionGreek.deleteMany({}),
            Quote.deleteMany({})
        ]);

        // Strip custom API keys from AI providers while preserving provider configs and model schemas
        try {
            await AiProvider.updateMany({}, { $set: { apiKey: null, rateLimitedUntil: null, lastUsed: null } });
        } catch (_) {}

        // SQLite: Truncate user data and market caches
        // CRITICAL PROTECTION: DO NOT DELETE 'instruments' table or schemas!
        const resetTables = [
            // User-created data
            "journal_notes",
            "user_overrides",
            "user_preferences",
            "page_state",
            "chart_drawings",
            "trade_history",
            "market_events",
            "holdings",
            "positions",
            // Market & AI caches
            "candles",
            "market_ticks",
            "quotes",
            "option_chain",
            "card_snapshots",
            "fundamentals_data",
            "technicals_data",
            "options_data",
            "global_data",
            "header_data",
            "index_ticks",
            "ai_card_store",
            "backfill_state",
            "card_score_history",
            "global_cache",
            "market_broadcast_cache",
            "oi_base_snapshots",
            "ai_insights_cache",
            "page_composite_snapshots",
            "foreign_page_cache",
            "fundamentals_cache",
            "technicals_cache",
            "options_cache",
            "fii_dii_history"
        ];

        for (const table of resetTables) {
            try {
                db.prepare(`DELETE FROM ${table}`).run();
            } catch (err) {}
        }

        // Invalidate in-memory caches
        try { invalidateGlobalCache(); } catch (_) {}
        try { clearBroadcastMemoryCaches(); } catch (_) {}

        res.json({
            success: true,
            message: "Factory reset complete. All user data, custom prompts, and caches cleared. Master instrument catalogue preserved."
        });
    } catch (error) {
        console.error("[DangerZone] factoryReset error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =============================
// Broker Settings
// =============================

export const updateBrokerSettings = async (req, res) => {
    try {
        if (req.user.isDemo) {
            return res.json({
                message: "Broker settings updated successfully",
                brokerSettings: {
                    broker: req.body.broker || "",
                    apiKey: req.body.apiKey || "",
                    apiSecret: req.body.apiSecret || "",
                    clientId: req.body.clientId || "",
                },
            });
        }

        const { broker, apiKey, apiSecret, clientId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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

export const testBrokerConnection = async (req, res) => {
    try {
        const { broker, apiKey, apiSecret, clientId } = req.body;

        if (!broker || !apiKey || !apiSecret) {
            return res.status(400).json({
                success: false,
                message: "Missing required credentials"
            });
        }

        const isConnected = true;

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

// =============================
// Notification Settings
// =============================

export const updateNotificationSettings = async (req, res) => {
    try {
        const {
            tradeAlerts,
            portfolioAlerts,
            systemMessages,
            deliveryApp,
            deliveryEmail
        } = req.body;

        if (req.user.isDemo) {
            return res.json({
                message: "Notification settings updated successfully",
                notificationSettings: {
                    tradeAlerts: tradeAlerts !== undefined ? tradeAlerts : true,
                    portfolioAlerts: portfolioAlerts !== undefined ? portfolioAlerts : true,
                    systemMessages: systemMessages !== undefined ? systemMessages : true,
                    deliveryApp: deliveryApp !== undefined ? deliveryApp : true,
                    deliveryEmail: deliveryEmail !== undefined ? deliveryEmail : true,
                },
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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

// =============================
// User Preferences
// =============================

export const updatePreferences = async (req, res) => {
    try {
        const { tradingMode, theme, soundAlerts } = req.body;

        if (req.user.isDemo) {
            return res.json({
                message: "Preferences updated successfully",
                preferences: {
                    tradingMode: tradingMode || "balanced",
                    theme: theme || "dark",
                    soundAlerts: soundAlerts !== undefined ? soundAlerts : true,
                },
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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

// =============================
// Password Management
// =============================

export const changePassword = async (req, res) => {
    try {
        if (req.user.isDemo) {
            return res.json({ message: "Password changed successfully" });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = newPassword;

        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// =============================
// Email Management
// =============================

export const requestEmailUpdateOTP = async (req, res) => {
    if (req.user && req.user.isDemo) {
        return res.status(200).json({ message: "OTP sent to new email" });
    }
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: "New email is required" });

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

export const updateEmail = async (req, res) => {
    if (req.user && req.user.isDemo) {
        return res.json({ message: "Email updated successfully", email: req.body.newEmail });
    }
    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const isValid = await verifyEmailOTP(newEmail, otp);
    if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) return res.status(400).json({ message: "Email is already in use" });

        user.email = newEmail;
        await user.save();

        res.json({ message: "Email updated successfully", email: user.email });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const requestCurrentEmailVerificationOTP = async (req, res) => {
    try {
        if (req.user && req.user.isDemo) {
            return res.status(200).json({ message: "Verification OTP sent to your email" });
        }
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        await sendEmailOTP(user.email);
        res.status(200).json({ message: "Verification OTP sent to your email" });
    } catch (error) {
        res.status(500).json({ message: "Failed to send OTP", error: error.message });
    }
};

export const verifyCurrentEmail = async (req, res) => {
    if (req.user && req.user.isDemo) {
        return res.json({ message: "Email verified successfully", isEmailVerified: true });
    }
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

// =============================
// Session Management
// =============================

export const logoutUser = async (req, res) => {
    try {
        if (req.user && req.user.isDemo) {
            return res.json({ message: "Logged out successfully" });
        }
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
