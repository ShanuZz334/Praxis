/**
 * @file SettingsPage.jsx
 * @purpose Centralized settings management for the user account and application preferences.
 * @responsibilities
 * - Manages user profile (Avatar, Name, Email/OTP).
 * - Configures Broker integrations (API Keys).
 * - Controls Notifications and Trading Preferences.
 * - Handles Security (Password Change, Account Deletion).
 * @key_exports
 * - SettingsPage (Default)
 * @dependencies
 * - UserContext, ThemeContext, userService
 * @lifecycle
 * - Route: /dashboard/settings
 * @date 2026-02-03
 */

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUser,
    FiBell,
    FiLock,
    FiSettings,
    FiCheck,
    FiAlertCircle,
    FiX,
    FiShield,
    FiTrendingUp,
    FiZap,
    FiLink2,
    FiInfo,
    FiSun,
    FiMoon,
    FiChevronDown,
    FiMap
} from "react-icons/fi";
import { UserContext } from "../../../../shared/context/UserContext";
import {
    getUserProfile,
    updateUserProfile,
    updateBrokerSettings,
    updateNotificationSettings,
    updatePreferences,
    changePassword,
    requestEmailUpdateOTP,
    updateEmail,
    requestCurrentEmailVerificationOTP,
    verifyCurrentEmail,
    deleteUserProfile,
} from "../../../../services/userService";
import Loader from "../../../../shared/components/ui/Loader";

// Broker Logos
import zerodhaLogo from "../../../../assets/images/zerodha.png";
import upstoxLogo from "../../../../assets/images/Upstox.png";
import angelOneLogo from "../../../../assets/images/angel_one.png";
import kotakLogo from "../../../../assets/images/kotak.png";
import growwLogo from "../../../../assets/images/groww.png";

import { useTheme } from "../../../../shared/context/ThemeContext";

const SettingsPage = () => {
    // Context
    const { user, updateUser, token, } = useContext(UserContext);
    const { theme, toggleTheme, vfxPreset, setVfxPreset, gradientBorder, setGradientBorder } = useTheme();

    // UI State
    const [activeTab, setActiveTab] = useState("account");
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Feature State
    const [showAggressiveWarning, setShowAggressiveWarning] = useState(false);
    const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
    const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");
    const [emailOtp, setEmailOtp] = useState("");
    const [otpTimer, setOtpTimer] = useState(0);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [showVerifyEmailOtpModal, setShowVerifyEmailOtpModal] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);

    // Data State
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        profileImage: "",
        broker: "",
        apiKey: "",
        apiSecret: "",
        clientId: "",
    });

    const fileInputRef = React.useRef(null);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordChangeStatus, setPasswordChangeStatus] = useState(null); // { type: 'success' | 'error', message: string }

    const [settings, setSettings] = useState({
        tradeAlerts: true,
        portfolioAlerts: true,
        systemMessages: true,
        deliveryApp: true,
        deliveryEmail: false,
        tradingMode: "balanced",
        theme: "dark",
        soundAlerts: true,
    });

    const [initialFormData, setInitialFormData] = useState({});
    const [initialSettings, setInitialSettings] = useState({});

    // Initialize Data from Context & API
    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);

                // 1. Use Context data for immediate display (Profile Sync)
                if (user) {
                    const baseData = {
                        fullName: user.fullName || "",
                        email: user.email || "",
                        profileImage: user.profileImage || null,
                        broker: "", // Default until API load
                        apiKey: "",
                        apiSecret: "",
                        clientId: ""
                    };
                    setFormData(prev => ({ ...prev, ...baseData }));
                    setInitialFormData(prev => ({ ...prev, ...baseData }));
                }

                // 2. Fetch full settings from API
                const userData = await getUserProfile();

                const loadedFormData = {
                    fullName: userData.fullName || user?.fullName || "",
                    email: userData.email || user?.email || "",
                    profileImage: userData.profileImage || user?.profileImage || null,
                    broker: userData.brokerSettings?.broker || "",
                    apiKey: userData.brokerSettings?.apiKey || "",
                    apiSecret: userData.brokerSettings?.apiSecret || "",
                    clientId: userData.brokerSettings?.clientId || "",
                };

                const loadedSettings = {
                    tradeAlerts: userData.notificationSettings?.tradeAlerts ?? true,
                    portfolioAlerts: userData.notificationSettings?.portfolioAlerts ?? true,
                    systemMessages: userData.notificationSettings?.systemMessages ?? true,
                    deliveryApp: userData.notificationSettings?.deliveryApp ?? true,
                    deliveryEmail: userData.notificationSettings?.deliveryEmail ?? false,
                    tradingMode: userData.preferences?.tradingMode || "balanced",
                    theme: userData.preferences?.theme || "dark",
                    soundAlerts: userData.preferences?.soundAlerts ?? true,
                };

                setFormData(loadedFormData);
                setInitialFormData(loadedFormData);
                setSettings(loadedSettings);
                setInitialSettings(loadedSettings);

                setIsEmailVerified(userData.isEmailVerified || user?.isEmailVerified || false);
            } catch {
                console.error("Failed to load user settings");
                // Fallback or error toast could be here
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [user]); // Re-run if user context changes externally

    // Change Detection
    useEffect(() => {
        if (loading) return;

        const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        const settingsChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        setHasUnsavedChanges(formChanged || settingsChanged);
    }, [formData, settings, initialFormData, initialSettings, loading]);

    // -- Theme Effect --
    useEffect(() => {
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings.theme]);

    // Handlers
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSettingToggle = (field) => {
        setSettings(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // -- Email OTP Flow --
    const initiateEmailChange = async (newEmail) => {
        if (!newEmail || newEmail === initialFormData.email) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            setSaveStatus("error"); // Reusing error toast
            alert("Please enter a valid email address."); // Simple alert for now
            return;
        }

        try {
            setLoading(true);
            await requestEmailUpdateOTP(newEmail);
            setPendingEmail(newEmail);
            setEmailOtp(""); // Clear any old OTP
            setShowEmailOtpModal(true);
            setOtpTimer(300); // 5 mins
            setSaveStatus(null);
        } catch {
            console.error("Failed to request OTP");
            alert("Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        if (otpTimer > 0) {
            interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    const verifyEmailChange = async () => {
        if (emailOtp.length !== 6) {
            alert("Please enter a valid 6-digit OTP");
            return;
        }

        try {
            setLoading(true);
            await updateEmail(pendingEmail, emailOtp);

            // Success
            handleInputChange("email", pendingEmail);
            setInitialFormData(prev => ({ ...prev, email: pendingEmail })); // Sync initial to avoid unsaved warning for this

            // Update Context
            if (updateUser && token) {
                updateUser({ ...user, email: pendingEmail }, token);
            }

            setShowEmailOtpModal(false);
            setEmailOtp("");
            setPendingEmail("");
            setSaveStatus("success");
            setTimeout(() => setSaveStatus(null), 3000);
        } catch {
            console.error("Failed to verify OTP");
            alert("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInitiateVerification = async () => {
        try {
            setVerifyingEmail(true);
            await requestCurrentEmailVerificationOTP();
            setEmailOtp(""); // Clear any old OTP
            setShowVerifyEmailOtpModal(true);
            setOtpTimer(300);
        } catch {
            console.error("Failed to request verification OTP");
            alert("Failed to send verification OTP");
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (emailOtp.length !== 6) {
            alert("Please enter a valid 6-digit OTP");
            return;
        }

        try {
            setLoading(true);
            await verifyCurrentEmail(emailOtp);

            setIsEmailVerified(true);
            setShowVerifyEmailOtpModal(false);
            setEmailOtp("");
            setSaveStatus("success");
            setTimeout(() => setSaveStatus(null), 3000);

            // Update Context
            if (updateUser && token) {
                updateUser({ ...user, isEmailVerified: true }, token);
            }
        } catch {
            console.error("Failed to verify email");
            alert("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // -- Trading Mode Logic --
    const handleTradingModeSelect = (mode) => {
        if (mode === "aggressive") {
            setShowAggressiveWarning(true);
        } else {
            setSettings(prev => ({ ...prev, tradingMode: mode }));
        }
    };

    const confirmAggressiveMode = () => {
        setSettings(prev => ({ ...prev, tradingMode: "aggressive" }));
        setShowAggressiveWarning(false);
    };

    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // -- Password Logic --
    const handleUpdatePassword = async () => {
        setPasswordChangeStatus(null);
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordChangeStatus({ type: 'error', message: "Please fill in all password fields." });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordChangeStatus({ type: 'error', message: "New passwords do not match." });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordChangeStatus({ type: 'error', message: "Password must be at least 8 characters." });
            return;
        }

        try {
            setIsUpdatingPassword(true);
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPasswordChangeStatus({ type: 'success', message: "Password updated successfully!" });
            setTimeout(() => setPasswordChangeStatus(null), 5000);
        } catch {
            console.error("Failed to update password");
            setPasswordChangeStatus({
                type: 'error',
                message: "Failed to update password. Check your current password."
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    // -- Broker Connection Test --
    const testBrokerConnection = async () => {
        setTestingConnection(true);
        setConnectionStatus(null);

        try {
            const response = await fetch('/api/broker/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    broker: formData.broker,
                    apiKey: formData.apiKey,
                    apiSecret: formData.apiSecret,
                    clientId: formData.clientId
                })
            });

            const data = await response.json();

            if (response.ok) {
                setConnectionStatus({
                    success: true,
                    message: data.message || 'Connection successful!',
                    requiresOAuth: data.requiresOAuth,
                    loginUrl: data.loginUrl
                });
            } else {
                setConnectionStatus({
                    success: false,
                    message: data.message || 'Connection failed. Please check your credentials.'
                });
            }
        } catch {
            setConnectionStatus({
                success: false,
                message: 'Failed to test connection. Please try again.'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleInstantConnect = async (brokerData) => {
        setTestingConnection(true);
        setConnectionStatus(null);
        try {
            const response = await fetch('/api/broker/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(brokerData)
            });

            const data = await response.json();
            if (response.ok) {
                setConnectionStatus({
                    success: true,
                    message: `Successfully connected to ${brokerData.broker || 'broker'}!`
                });
                setSaveStatus("success");
                setTimeout(() => setSaveStatus(null), 3000);
            } else {
                setConnectionStatus({ success: false, message: data.message || 'Connection failed.' });
            }
        } catch {
            setConnectionStatus({ success: false, message: 'Failed to connect. Please try again.' });
        } finally {
            setTestingConnection(false);
        }
    };

    // -- Delete Account Logic --
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const { clearUser: contextClearUser } = useContext(UserContext);

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return;

        try {
            setIsDeleting(true);
            await deleteUserProfile();

            // Success - clear local data and redirect
            localStorage.clear();
            contextClearUser();
            navigate("/login", { replace: true });
        } catch {
            console.error("Failed to delete account");
            alert("Failed to delete account. Please try again later.");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // -- Saving Data --
    const saveAllChanges = async () => {
        setSaveStatus("saving");
        try {
            // Parallel requests
            await Promise.all([
                updateUserProfile({
                    fullName: formData.fullName,
                    email: formData.email, // Only changes if verified locally first
                    profileImage: formData.profileImage
                }),
                updateBrokerSettings({
                    broker: formData.broker,
                    apiKey: formData.apiKey,
                    apiSecret: formData.apiSecret,
                    clientId: formData.clientId
                }),
                updateNotificationSettings({
                    tradeAlerts: settings.tradeAlerts,
                    portfolioAlerts: settings.portfolioAlerts,
                    systemMessages: settings.systemMessages,
                    deliveryApp: settings.deliveryApp,
                    deliveryEmail: settings.deliveryEmail
                }),
                updatePreferences({
                    tradingMode: settings.tradingMode,
                    theme: settings.theme,
                    soundAlerts: settings.soundAlerts
                })
            ]);

            // Sync Context (Updates Sidebar immediately)
            if (updateUser && token) {
                const updatedUser = {
                    ...user,
                    fullName: formData.fullName,
                    email: formData.email,
                    profileImage: formData.profileImage,
                };
                updateUser(updatedUser, token);
            }

            // Update initial state to match current state (clears unsaved flag)
            setInitialFormData({ ...formData });
            setInitialSettings({ ...settings });

            setSaveStatus("success");
            setTimeout(() => setSaveStatus(null), 3000);
        } catch {
            console.error("Save failed");
            setSaveStatus("error");
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const discardChanges = () => {
        setFormData({ ...initialFormData });
        setSettings({ ...initialSettings });
    };



    // UI Helpers


    const tabs = [
        { id: "account", label: "Account", icon: FiUser },
        { id: "notifications", label: "Notifications", icon: FiBell },
        { id: "security", label: "Security", icon: FiLock },
        { id: "preferences", label: "Customisation", icon: FiSettings },
    ];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-[var(--text-primary)]">
                <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                    <Loader size="md" color="indigo" />
                    <p className="text-sm text-[var(--text-secondary)]">Loading settings...</p>
                </div>
            </div>
        );
    }

    // -- Profile Image Upload --
    // fileInputRef declared at top of component

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("File too large. Max size 2MB.");
            return;
        }

        try {
            // Upload immediately to get the URL
            const imageUrl = await import("../../../../services/userService").then(m => m.uploadProfilePicture(file));

            // Update form state with new URL
            handleInputChange("profileImage", imageUrl);

            // Note: We don't save the profile update (PUT /profile) yet, user must click Save Changes
            // But we display the new image immediately
        } catch {
            alert("Failed to upload image.");
        }
    };

    return (
        <div className="min-h-screen p-3 sm:p-4 text-text-primary md:p-8 font-sans">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-6 md:mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="mt-1 text-xs md:text-sm text-text-secondary">Manage your account and customization</p>
                    </div>
                </div>

                {/* Unsaved Changes Bar - Sticky */}
                {hasUnsavedChanges && (
                    <div className="sticky top-20 md:top-4 z-50 mb-6 flex flex-col sm:flex-row items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 md:p-4 backdrop-blur-md gap-3">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="text-yellow-500 flex-shrink-0" />
                            <span className="text-xs md:text-sm font-medium text-yellow-600 dark:text-yellow-400 text-center sm:text-left">Unsaved changes detected</span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={discardChanges} className="flex-1 sm:flex-none text-xs md:text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2">Discard</button>
                            <button
                                onClick={saveAllChanges}
                                disabled={saveStatus === "saving"}
                                className="flex-1 sm:flex-none rounded-lg bg-text-primary px-4 py-2 text-xs md:text-sm font-semibold text-background-base hover:opacity-90 disabled:opacity-50"
                            >
                                {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Save Feedback Toast */}
                {saveStatus === "success" && !hasUnsavedChanges && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-green-600 dark:text-green-400">
                        <FiCheck /> Changes saved successfully
                    </div>
                )}

                {saveStatus === "error" && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-600 dark:text-red-400">
                        <FiAlertCircle /> Failed to save changes
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[240px_1fr]">

                    {/* Sidebar / Tabs Navigation */}
                    <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 md:overflow-visible scrollbar-hide -mx-1 px-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 md:gap-3 rounded-xl px-4 py-2.5 md:py-3 text-left text-sm font-medium transition-all duration-300 shrink-0 ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/40 shadow-sm text-blue-500"
                                    : "text-text-secondary hover:bg-transparent hover:text-text-primary border border-transparent hover:border-[var(--border-default)] hover:shadow-sm hover:-translate-y-0.5"
                                    }`}
                            >
                                <tab.icon className={`h-4 w-4 md:h-5 md:w-5 transition-colors duration-300 ${activeTab === tab.id ? "text-blue-500" : "group-hover:text-blue-500"}`} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Main Content Area */}
                    <div
                        className="rounded-2xl border border-border-default bg-transparent p-4 sm:p-6 lg:p-8 shadow-xl shadow-black/5 backdrop-blur-sm"
                    >

                        {/* --- ACCOUNT TAB --- */}
                        {activeTab === "account" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-xl font-semibold">Profile Information</h2>
                                    <p className="text-sm text-text-secondary">Update your public profile and details</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                                    <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-[2px]">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-transparent">
                                            {formData.profileImage ? (
                                                <img src={formData.profileImage} alt="Profile" className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-xl md:text-2xl font-bold">{formData.fullName?.[0]?.toUpperCase() || "U"}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/gif"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-sm font-medium text-blue-500 hover:text-blue-400"
                                        >
                                            Upload New Picture
                                        </button>
                                        <p className="mt-1 text-xs text-text-tertiary">JPG, GIF or PNG. Max size 2MB.</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                                            placeholder="Enter your full name"
                                            className="w-full rounded-lg border border-border-default bg-transparent px-4 py-2.5 text-text-primary focus:border-blue-500 focus:outline-none focus:bg-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary flex items-center justify-between w-full">
                                            <span>Email Address</span>
                                            {isEmailVerified ? (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                    <FiCheck size={11} className="shrink-0" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                                                    <FiAlertCircle size={11} className="shrink-0" /> Unverified
                                                </span>
                                            )}
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="email"
                                                value={formData.email}
                                                disabled // Not directly editable needs OTP flow trigger
                                                className="w-full cursor-not-allowed rounded-lg border border-border-default bg-transparent/50 px-4 py-2.5 text-text-secondary text-sm md:text-base"
                                            />
                                            <button
                                                onClick={() => setShowEmailChangeModal(true)}
                                                className="w-full sm:shrink-0 sm:w-auto rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        {!isEmailVerified && (
                                            <div className="mt-3 p-4 rounded-xl border border-blue-500/30 shadow-none">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                        <FiShield className="text-blue-500 text-lg" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-text-primary">Verify your mail</p>
                                                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                                            Verifying your email allows us to send you clean trade alerts and critical security notifications.
                                                        </p>
                                                        <button
                                                            onClick={handleInitiateVerification}
                                                            disabled={verifyingEmail}
                                                            className="mt-3 text-sm font-bold text-blue-500 hover:text-blue-400 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            {verifyingEmail ? (
                                                                <>
                                                                    <Loader size="xxs" color="blue" /> Requesting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Verify Now <i className="bx bx-right-arrow-alt text-lg"></i>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="border-t border-border-default pt-8"
                                >
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
                                        <FiLink2 className="text-blue-500" /> Broker Integration
                                    </h3>
                                    <div className="flex flex-col lg:flex-row gap-10">
                                        {/* Left Side: Configuration Form */}
                                        <div className="flex-1 space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium text-text-secondary">Select Broker</label>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
                                                    {AVAILABLE_BROKERS.map((broker) => (
                                                        <button
                                                            key={broker.value}
                                                            type="button"
                                                            onClick={() => handleInputChange("broker", broker.value)}
                                                            className={`flex flex-col items-center gap-1.5 md:gap-2 rounded-xl p-2 md:p-3 transition-all border ${formData.broker === broker.value
                                                                ? 'bg-blue-500/10 border-blue-500/50 shadow-md shadow-blue-500/5'
                                                                : 'bg-transparent border-border-default hover:bg-transparent hover:border-border-default hover:shadow-lg hover:-translate-y-0.5'
                                                                }`}
                                                        >
                                                            <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center p-1">
                                                                {broker.image ? (
                                                                    <img src={broker.image} alt={broker.label} className="h-full w-full object-contain filter drop-shadow-md" />
                                                                ) : (
                                                                    <span className="text-lg md:text-xl">{broker.icon}</span>
                                                                )}
                                                            </div>
                                                            <span className={`text-[9px] md:text-[10px] font-bold tracking-tight text-center transition-colors uppercase ${formData.broker === broker.value ? 'text-blue-500' : 'text-text-tertiary'}`}>
                                                                {broker.label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                {formData.broker && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        <label className="text-sm font-medium text-text-secondary">API Key</label>
                                                        <input
                                                            type="password"
                                                            value={formData.apiKey}
                                                            onChange={(e) => handleInputChange("apiKey", e.target.value)}
                                                            placeholder="Enter your broker API key"
                                                            className="w-full rounded-lg border border-border-default bg-transparent px-4 py-2.5 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-200"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {formData.broker && (
                                                <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-text-secondary">API Secret</label>
                                                        <input
                                                            type="password"
                                                            value={formData.apiSecret}
                                                            onChange={(e) => handleInputChange("apiSecret", e.target.value)}
                                                            placeholder="Enter your broker API secret"
                                                            className="w-full rounded-lg border border-border-default bg-transparent px-4 py-2.5 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-text-secondary">Client ID</label>
                                                        <input
                                                            type="text"
                                                            value={formData.clientId}
                                                            onChange={(e) => handleInputChange("clientId", e.target.value)}
                                                            placeholder="Your broker client ID"
                                                            className="w-full rounded-lg border border-border-default bg-transparent px-4 py-2.5 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {formData.broker && (
                                                <div className="space-y-4">
                                                    <p className="text-xs text-text-secondary">
                                                        {formData.broker === 'zerodha' && (
                                                            <a href="https://kite.trade/docs/connect/v3/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                                How to get Zerodha API credentials →
                                                            </a>
                                                        )}
                                                        {formData.broker === 'upstox' && (
                                                            <a href="https://upstox.com/developer/api-documentation/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                                How to get Upstox API credentials →
                                                            </a>
                                                        )}
                                                        {formData.broker === 'angelone' && (
                                                            <a href="https://smartapi.angelbroking.com/docs" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                                How to get Angel One API credentials →
                                                            </a>
                                                        )}
                                                    </p>

                                                    {/* Test Connection Button */}
                                                    <button
                                                        type="button"
                                                        onClick={testBrokerConnection}
                                                        disabled={!formData.broker || !formData.apiKey || !formData.apiSecret || testingConnection}
                                                        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                                                    >
                                                        {testingConnection ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <Loader size="sm" color="white" />
                                                                Testing Connection...
                                                            </span>
                                                        ) : (
                                                            'Test Connection'
                                                        )}
                                                    </button>

                                                    {/* Connection Status */}
                                                    {connectionStatus && (
                                                        <div className={`p-4 rounded-lg border ${connectionStatus.success
                                                            ? 'bg-green-500/10 border-green-500/20'
                                                            : 'bg-red-500/10 border-red-500/20'
                                                            }`}>
                                                            <div className="flex items-start gap-3">
                                                                {connectionStatus.success ? (
                                                                    <FiCheck className="text-green-500 text-xl flex-shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <FiAlertCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className={`text-sm font-medium ${connectionStatus.success ? 'text-green-500' : 'text-red-500'
                                                                        }`}>
                                                                        {connectionStatus.message}
                                                                    </p>
                                                                    {connectionStatus.requiresOAuth && (
                                                                        <button
                                                                            onClick={() => window.open(connectionStatus.loginUrl, '_blank')}
                                                                            className="mt-2 text-xs text-blue-500 hover:underline"
                                                                        >
                                                                            Complete OAuth Login →
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Connected Brokers Display */}
                                        <div
                                            className="w-full lg:w-72 shrink-0 border-t border-border-default lg:border-t-0 lg:border-l pt-10 lg:pt-0 lg:pl-10"
                                        >
                                            <div className="sticky top-6">
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6 flex items-center gap-2">
                                                    <div className="h-px flex-1 bg-border-subtle"></div>
                                                    Active Connections
                                                    <div className="h-px flex-1 bg-border-subtle"></div>
                                                </h4>

                                                <div className="space-y-4">
                                                    {initialFormData.broker ? (
                                                        <ConnectedBrokerCard
                                                            broker={initialFormData.broker}
                                                            clientId={initialFormData.clientId}
                                                            onClick={() => handleInstantConnect({
                                                                broker: initialFormData.broker,
                                                                apiKey: initialFormData.apiKey,
                                                                apiSecret: initialFormData.apiSecret,
                                                                clientId: initialFormData.clientId
                                                            })}
                                                            loading={testingConnection}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="rounded-2xl border border-dashed border-border-default p-8 text-center bg-transparent"
                                                        >
                                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-transparent mb-3">
                                                                <FiLink2 className="text-text-tertiary text-xl" />
                                                            </div>
                                                            <p className="text-xs text-text-secondary font-medium">No brokers connected yet</p>
                                                            <p className="text-[10px] text-text-tertiary mt-1">Configure your broker on the left to start trading</p>
                                                        </div>
                                                    )}


                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-[var(--border-subtle)] pt-8">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-red-500">
                                        <FiAlertCircle className="text-red-500" /> Danger Zone
                                    </h3>
                                    <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 md:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="text-center sm:text-left">
                                                <p className="font-semibold text-text-primary">Delete Account</p>
                                                <p className="text-xs md:text-sm text-text-secondary mt-1">Permanently remove your account and all associated data. This action cannot be undone.</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="w-full sm:w-auto shrink-0 rounded-lg bg-red-600/10 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/5"
                                            >
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- NOTIFICATIONS TAB --- */}
                        {activeTab === "notifications" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h2 className="text-xl font-semibold">Notification Preferences</h2>

                                <div className="space-y-4">
                                    {[
                                        { id: "tradeAlerts", label: "Trade Alerts", desc: "Get notified when orders execute" },
                                        { id: "portfolioAlerts", label: "Portfolio Updates", desc: "Daily P&L and position summaries" },
                                        { id: "systemMessages", label: "System Messages", desc: "Maintenance and platform updates" },
                                    ].map(item => (
                                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4 transition-all hover:bg-transparent">
                                            <div>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-sm text-text-secondary">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => handleSettingToggle(item.id)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.id] ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
                                            >
                                                <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${settings[item.id] ? "translate-x-5" : ""}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-text-tertiary">Delivery Channels</h3>
                                <div className="space-y-4">
                                    {[
                                        { id: "deliveryApp", label: "In-App Push", icon: FiBell },
                                        { id: "deliveryEmail", label: "Email Digest", icon: FiUser },
                                    ].map(item => (
                                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4 transition-all hover:bg-transparent">
                                            <div className="flex items-center gap-3">
                                                <item.icon className="text-text-secondary" />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <button
                                                onClick={() => handleSettingToggle(item.id)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.id] ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
                                            >
                                                <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${settings[item.id] ? "translate-x-5" : ""}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- SECURITY TAB --- */}
                        {activeTab === "security" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-xl font-semibold">Security Settings</h2>
                                    <p className="text-sm text-text-secondary">Manage your password and account security</p>
                                </div>

                                <div className="rounded-xl border border-border-default bg-transparent p-4 md:p-6">
                                    <h3 className="mb-4 text-lg font-medium">Update Password</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-text-secondary">Current Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                placeholder="Enter current password"
                                                className="w-full rounded-lg border border-border-default bg-transparent px-4 py-2.5 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10 transition-all text-sm md:text-base"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-secondary">New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                placeholder="Enter new password"
                                                className="w-full rounded-lg border border-border-default bg-transparent px-4 py-2.5 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-secondary">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                placeholder="Confirm new password"
                                                className="w-full rounded-lg border border-border-default bg-transparent px-4 py-2.5 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {passwordChangeStatus && (
                                        <div className={`mt-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${passwordChangeStatus.type === 'success'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                                            }`}>
                                            {passwordChangeStatus.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                                            {passwordChangeStatus.message}
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleUpdatePassword}
                                            disabled={isUpdatingPassword}
                                            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                                        >
                                            {isUpdatingPassword ? "Updating..." : "Update Password"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* --- CUSTOMISATION TAB --- */}
                        {activeTab === "preferences" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-xl font-semibold">User Customisation</h2>
                                    <p className="text-sm text-text-secondary">Customize your trading experience</p>
                                </div>

                                {/* Trading Mode */}
                                <div>
                                    <h3 className="mb-4 text-sm font-medium text-text-secondary">Trading Mode</h3>
                                    <div className="grid gap-3 md:gap-4 md:grid-cols-3">
                                        {[
                                            { id: "conservative", label: "Conservative", icon: FiShield, desc: "Low-risk defaults" },
                                            { id: "balanced", label: "Balanced", icon: FiTrendingUp, desc: "Standard risk-reward" },
                                            { id: "aggressive", label: "Aggressive", icon: FiZap, desc: "High-risk, max leverage" }
                                        ].map(mode => {
                                            const isActive = settings.tradingMode === mode.id;
                                            let activeClass = "";
                                            if (isActive) {
                                                switch (mode.id) {
                                                    case "conservative": activeClass = "bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-500/20"; break;
                                                    case "balanced": activeClass = "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-500/20"; break;
                                                    case "aggressive": activeClass = "bg-red-600 text-white border-transparent shadow-lg shadow-red-500/20"; break;
                                                    default: activeClass = "bg-gray-800 text-white";
                                                }
                                            } else {
                                                activeClass = "bg-transparent hover:bg-transparent hover:shadow-lg hover:-translate-y-0.5 text-text-secondary";
                                            }

                                            return (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => handleTradingModeSelect(mode.id)}
                                                    className={`group relative flex md:flex-col items-center gap-3 rounded-xl border p-4 md:p-6 text-left md:text-center transition-all duration-300 ${activeClass}`}
                                                >
                                                    <mode.icon className={`h-6 w-6 md:h-8 md:w-8 shrink-0 transition-colors duration-300 ${isActive ? "text-white" : "text-text-tertiary group-hover:text-text-primary"}`} />
                                                    <div>
                                                        <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${isActive ? "text-white" : "text-text-primary"}`}>{mode.label}</p>
                                                        <p className={`mt-0.5 md:mt-1.5 text-[10px] md:text-xs leading-relaxed ${isActive ? "text-white/80" : "text-text-tertiary"}`}>{mode.desc}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Theme Toggle */}
                                <div className="pt-4">
                                    <h3 className="mb-4 text-sm font-medium text-text-secondary">Appearance</h3>
                                    <div className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4">
                                        <div>
                                            <p className="font-medium text-text-primary">Theme Preference</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-transparent p-1 rounded-lg border border-border-default">
                                            <button
                                                onClick={() => theme === 'dark' && toggleTheme()}
                                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all ${theme === 'light' ? "bg-white text-blue-600 font-medium shadow-md shadow-black/5" : "text-text-tertiary hover:text-text-primary"
                                                    }`}
                                            >
                                                <FiSun /> Light
                                            </button>
                                            <button
                                                onClick={() => theme === 'light' && toggleTheme()}
                                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all ${theme === 'dark' ? "bg-gray-800 text-text-primary font-medium shadow-sm" : "text-text-tertiary hover:text-text-primary"
                                                    }`}
                                            >
                                                <FiMoon /> Dark
                                            </button>
                                        </div>
                                    </div>

                                    {/* Gradient Border Toggle */}
                                    {theme === 'dark' && (
                                        <div className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <p className="font-medium text-text-primary">Gradient Borders</p>
                                                <p className="text-xs text-text-secondary mt-0.5">Enable premium blue-violet borders around cards</p>
                                            </div>
                                            <button
                                                onClick={() => setGradientBorder(!gradientBorder)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${gradientBorder ? 'bg-blue-600' : 'bg-slate-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`${gradientBorder ? 'translate-x-6' : 'translate-x-1'
                                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* VFX Customization (Dark Mode Only) */}
                                {theme === 'dark' && (
                                    <div className="pt-4 animate-in fade-in duration-500 hidden md:block">
                                        <h3 className="mb-4 text-sm font-medium text-text-secondary">VFX Presets (Dark Mode Only)</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                            {[
                                                { id: 'midnight', label: 'Midnight', colors: 'from-blue-600 via-indigo-600 to-cyan-500', desc: 'Default Balance' },
                                                { id: 'solar', label: 'Solar Flare', colors: 'from-orange-500 via-amber-500 to-rose-500', desc: 'Warm Energy' },
                                                { id: 'forest', label: 'Neon Forest', colors: 'from-emerald-500 via-teal-500 to-lime-500', desc: 'Calm Growth' },
                                                { id: 'ocean', label: 'Deep Ocean', colors: 'from-blue-800 via-blue-600 to-cyan-600', desc: 'Icy Focus' },
                                                { id: 'royal', label: 'Royal Nebula', colors: 'from-indigo-600 via-violet-600 to-blue-500', desc: 'Premium Depth' }
                                            ].map((preset) => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => setVfxPreset(preset.id)}
                                                    className={`group relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 text-center
                                                        ${vfxPreset === preset.id
                                                            ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                                                            : "border-border-subtle bg-transparent hover:border-border-default"}
                                                    `}
                                                >
                                                    <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${preset.colors} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                                    <div>
                                                        <p className={`text-xs font-bold ${vfxPreset === preset.id ? 'text-blue-400' : 'text-text-primary'}`}>{preset.label}</p>
                                                        <p className="text-[10px] text-text-tertiary mt-0.5 whitespace-nowrap">{preset.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div >
            </div >

            {/* Aggressive Warning Modal */}
            {
                showAggressiveWarning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-white dark:bg-[#0b1220] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                                <FiAlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-center text-xl font-bold text-slate-900 dark:text-white">Aggressive Mode Warning</h3>
                            <p className="mt-2 text-center text-slate-500 dark:text-slate-300">
                                This mode increases trading risk significantly and is recommended only for experienced traders. Are you sure you want to proceed?
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowAggressiveWarning(false)}
                                    className="flex-1 rounded-lg border border-slate-200 bg-white py-3 font-medium text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-[var(--border-subtle)] dark:text-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAggressiveMode}
                                    className="flex-1 rounded-lg bg-red-600 py-3 font-medium text-white hover:bg-red-500 shadow-lg shadow-red-600/20"
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Email OTP Modal (Simulated View) */}
            {
                showEmailOtpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md rounded-2xl border border-border-default bg-white dark:bg-[#0b1220] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-text-primary">Change Email Address</h3>
                                <button onClick={() => setShowEmailOtpModal(false)}><FiX className="text-text-secondary hover:text-text-primary" /></button>
                            </div>

                            {!pendingEmail ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-text-secondary">Enter your new email address. We will send a verification code.</p>
                                    <input
                                        type="email"
                                        placeholder="New Email Address"
                                        className="w-full rounded-lg border border-border-default bg-transparent px-4 py-3 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') initiateEmailChange(e.currentTarget.value)
                                        }}
                                    />
                                    <button
                                        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousElementSibling;
                                            initiateEmailChange(input.value);
                                        }}
                                    >
                                        Send Verification Code
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-text-secondary">
                                        Enter the 6-digit code sent to <span className="text-text-primary font-medium">{pendingEmail}</span>
                                    </p>
                                    <input
                                        type="text"
                                        value={emailOtp}
                                        maxLength={6}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000 000"
                                        className="w-full rounded-lg border border-border-default bg-transparent px-4 py-3 text-center text-xl tracking-widest text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10"
                                    />
                                    <div className="flex justify-between text-xs text-text-tertiary">
                                        <span>Expires in 5:00</span>
                                        {otpTimer > 0 ? (
                                            <span>Resend in {otpTimer}s</span>
                                        ) : (
                                            <button className="text-blue-500 hover:underline">Resend Code</button>
                                        )}
                                    </div>
                                    <button
                                        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-500 disabled:opacity-50 shadow-md shadow-blue-600/20"
                                        disabled={emailOtp.length !== 6}
                                        onClick={verifyEmailChange}
                                    >
                                        Verify & Update
                                    </button>
                                    <button
                                        onClick={() => setPendingEmail("")}
                                        className="w-full text-sm text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        Change Email Address
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Verify Current Email OTP Modal */}
            {
                showVerifyEmailOtpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md rounded-2xl border border-border-default bg-white dark:bg-[#0b1220] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">Verify Email</h3>
                                <button onClick={() => setShowVerifyEmailOtpModal(false)}><FiX className="text-text-secondary hover:text-text-primary shadow-sm" /></button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-text-secondary">
                                    Enter the 6-digit code sent to your email to enable trade alerts.
                                </p>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={emailOtp}
                                        maxLength={6}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000 000"
                                        className="w-full rounded-lg border border-border-default bg-transparent px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-text-tertiary/20"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-text-tertiary uppercase font-medium tracking-wider">
                                    <span>5:00 MINUTES UNTIL EXPIRE</span>
                                    {otpTimer > 0 ? (
                                        <span>RESEND IN {otpTimer}S</span>
                                    ) : (
                                        <button onClick={handleInitiateVerification} className="text-blue-500 hover:underline">RESEND NOW</button>
                                    )}
                                </div>
                                <button
                                    className="w-full rounded-lg bg-[#1E1BFF] py-3.5 font-bold text-white hover:bg-[#1720cc] disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    disabled={loading || emailOtp.length !== 6}
                                    onClick={handleVerifyEmail}
                                >
                                    {loading ? (
                                        <>
                                            <i className="bx bx-loader-alt animate-spin text-lg"></i>
                                            <span>VERIFYING...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>VERIFY & ENABLE ALERTS</span>
                                            <i className="bx bx-check-shield text-lg"></i>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Email Change Modal */}
            {
                showEmailChangeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md rounded-2xl border border-blue-500/20 bg-white dark:bg-[#0b1220] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                                <FiAlertCircle className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-center text-xl font-bold text-text-primary">Change Email Address</h3>
                            <p className="mt-2 text-center text-text-secondary text-sm">
                                Enter your new email address. We'll send you a verification code to confirm the change.
                            </p>

                            <div className="mt-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">New Email Address</label>
                                    <input
                                        type="email"
                                        value={pendingEmail}
                                        onChange={(e) => setPendingEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full rounded-lg border border-border-default bg-transparent px-4 py-3 text-text-primary focus:border-blue-500 focus:outline-none focus:shadow-lg focus:shadow-blue-500/10"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowEmailChangeModal(false);
                                            setPendingEmail("");
                                        }}
                                        className="flex-1 rounded-lg border border-border-default bg-transparent py-3 text-sm font-medium text-text-secondary hover:bg-transparent hover:text-text-primary transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (pendingEmail && pendingEmail.includes("@")) {
                                                initiateEmailChange(pendingEmail);
                                                setShowEmailChangeModal(false);
                                            } else {
                                                alert("Please enter a valid email address");
                                            }
                                        }}
                                        disabled={!pendingEmail || !pendingEmail.includes("@")}
                                        className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                                    >
                                        Send Verification Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Account Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-white dark:bg-[#0b1220] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                                <FiAlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-center text-xl font-bold text-text-primary">Delete your account?</h3>
                            <p className="mt-2 text-center text-text-secondary">
                                This action is permanent and cannot be undone. All your trades, settings, and profile data will be forever lost.
                            </p>

                            <div className="mt-6 space-y-4">
                                <p className="text-sm text-center text-text-secondary">
                                    Please type <span className="font-bold text-text-primary tracking-widest">DELETE</span> to confirm
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    className="w-full rounded-lg border border-border-default bg-transparent px-4 py-3 text-center text-text-primary focus:border-red-500 focus:outline-none focus:shadow-lg focus:shadow-red-500/10"
                                />

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteConfirmText("");
                                        }}
                                        disabled={isDeleting}
                                        className="flex-1 rounded-lg border border-border-default bg-transparent py-3 text-sm font-medium text-text-secondary hover:bg-transparent hover:text-text-primary transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirmText !== "DELETE" || isDeleting}
                                        className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 shadow-lg shadow-red-600/20"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Permanently"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Broker List Data
const AVAILABLE_BROKERS = [
    { value: "zerodha", label: "Zerodha", icon: "🟦", image: zerodhaLogo },
    { value: "upstox", label: "Upstox", icon: "🟪", image: upstoxLogo },
    { value: "angelone", label: "Angel One", icon: "🔴", image: angelOneLogo },
    { value: "kotaksec", label: "Kotak Securities", icon: "🔴", image: kotakLogo },
    { value: "groww", label: "Groww", icon: "🟢", image: growwLogo }
];

const ConnectedBrokerCard = ({ broker, clientId, onClick, loading }) => {
    const brokerInfo = AVAILABLE_BROKERS.find(b => b.value === broker) || { label: broker, icon: "🏦" };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className="w-full text-left group relative flex items-center gap-4 rounded-2xl border border-border-default bg-gradient-to-br from-transparent to-transparent p-4 transition-all duration-300 hover:border-blue-500 hover:bg-transparent hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-wait"
        >
            <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-transparent border border-border-default group-hover:border-blue-500/20 transition-all"
            >
                {loading ? (
                    <div className="animate-spin text-blue-500">
                        <i className="bx bx-loader-alt text-xl"></i>
                    </div>
                ) : (
                    brokerInfo.image ? (
                        <img src={brokerInfo.image} alt={brokerInfo.label} className="h-7 w-7 object-contain group-hover:scale-110 transition-transform" />
                    ) : (
                        <span className="text-2xl">{brokerInfo.icon}</span>
                    )
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary truncate">{brokerInfo.label}</p>
                    <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-blue-500' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></span>
                </div>
                <p className="text-[10px] text-text-secondary font-mono mt-0.5 truncate uppercase tracking-tighter">ID: {clientId || 'ID_UNKNOWN'}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 whitespace-nowrap">
                    {loading ? 'CONNECTING' : 'CONNECT'}
                </div>
            </div>
        </button>
    );
};

export default SettingsPage;
