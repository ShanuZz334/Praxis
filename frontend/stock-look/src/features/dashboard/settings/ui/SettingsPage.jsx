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
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
    FiMap,
    FiWifi,
    FiDatabase
} from "react-icons/fi";
import {
    Shield, Layers, Zap, Target, CheckCircle2, XCircle, BrainCircuit, Mail, Code2, Terminal
} from "lucide-react";
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
    generateRegistrationOptions,
    verifyRegistration,
} from "../../../../services/userService";
import { startRegistration } from "@simplewebauthn/browser";
import Loader from "../../../../shared/components/ui/Loader";

import { useTheme } from "../../../../shared/context/ThemeContext";
import { useProfile } from "@/shared/hooks/useProfile";
import GhostLogo from "../../../../shared/components/ui/GhostLogo";
import UiverseDropdown from "../../../../shared/components/ui/UiverseDropdown";
import { UniversalToggle } from "@/components/ui/universal-toggle";

const PAI_ACCESSORIES = [
    { id: 'none', label: 'None' },
    { id: 'helmet', label: 'Helmet' },
    { id: 'chain', label: 'Ghost Chain' },
    { id: 'tie', label: 'Business Tie' },
    { id: 'hair', label: 'Punk Hair' },
    { id: 'crown', label: 'Royal Crown' },
    { id: 'glasses', label: 'Sunglasses' },
    { id: 'bowtie', label: 'Bowtie' },
    { id: 'headband', label: 'Ninja Headband' },
    { id: 'headphones', label: 'DJ Headphones' }
];

const SettingsPage = () => {
    // Context
    const navigate = useNavigate();
    const { user, updateUser, token, } = useContext(UserContext);
    const {
        theme,
        toggleTheme,
        vfxPreset,
        setVfxPreset,
        gradientBorder,
        setGradientBorder,
        tradingMode,
        setTradingMode,
        tradingModeVfx,
        setTradingModeVfx,
        paiMascotColor,
        setPaiMascotColor,
        paiAccessory,
        setPaiAccessory,
        paiAudioStyle,
        setPaiAudioStyle,
        useOrbNav,
        setUseOrbNav
    } = useTheme();

    // Profile hook — wraps tradingMode with preset-switching side effect
    const { setProfile } = useProfile();

    // UI State
    const [activeTab, setActiveTab] = useState("account");
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null | "saving"

    // Calculator Keybindings State
    const defaultCalcBindings = {
        sin: 's',
        cos: 'c',
        tan: 't',
        log: 'l',
        sqrt: 'r',
        pi: 'p',
        fraction: 'f'
    };
    const [calcBindings, setCalcBindings] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('calcKeybindings')) || defaultCalcBindings;
        } catch {
            return defaultCalcBindings;
        }
    });

    const updateCalcBinding = (key, value) => {
        // Prevent uppercase or multi-character binds to keep it simple, but we can allow single characters.
        const newBinds = { ...calcBindings, [key]: value.toLowerCase().slice(0, 1) };
        setCalcBindings(newBinds);
        localStorage.setItem('calcKeybindings', JSON.stringify(newBinds));
    };

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
        tradingMode: "swing",
        theme: "dark",
        soundAlerts: true,
    });

    const [initialFormData, setInitialFormData] = useState({});
    const [initialSettings, setInitialSettings] = useState({});
    const [legacyVoiceContext, setLegacyVoiceContext] = useState(() => localStorage.getItem('paiLegacyVoiceContext') === 'true');

    // Manual Timers State
    const [manualExpiryConfigs, setManualExpiryConfigs] = useState(() => {
        const defaults = { 
            face_value: 30 * 24 * 60 * 60 * 1000, 
            global_default: 2 * 60 * 60 * 1000,
            mcap_gdp: 30 * 24 * 60 * 60 * 1000,
            eps_yoy: 30 * 24 * 60 * 60 * 1000,
            forward_eps: 7 * 24 * 60 * 60 * 1000,
            profit_margin: 30 * 24 * 60 * 60 * 1000,
            policy_tailwinds: 30 * 24 * 60 * 60 * 1000,
            fii_trend: 24 * 60 * 60 * 1000,
            mf_flows: 30 * 24 * 60 * 60 * 1000,
            system_liquidity: 24 * 60 * 60 * 1000
        };
        try {
            const stored = localStorage.getItem('praxis_manual_expiry_config');
            if (stored) return { ...defaults, ...JSON.parse(stored) };
        } catch (e) { }
        return defaults;
    });

    const handleManualExpiryChange = (key, valMs) => {
        setManualExpiryConfigs(prev => {
            const next = { ...prev, [key]: valMs };
            localStorage.setItem('praxis_manual_expiry_config', JSON.stringify(next));
            return next;
        });
        toast.success("Timer settings updated locally.");
    };

    const [technicalAiSensitivity, setTechnicalAiSensitivity] = useState(() => {
        try {
            const stored = localStorage.getItem('praxis_ai_sensitivity_technical');
            return stored ? parseInt(stored, 10) : 5;
        } catch {
            return 5;
        }
    });

    const handleTechnicalAiSensitivityChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setTechnicalAiSensitivity(val);
        localStorage.setItem('praxis_ai_sensitivity_technical', val.toString());
    };

    const [globalAiSensitivity, setGlobalAiSensitivity] = useState(() => {
        try {
            const stored = localStorage.getItem('praxis_ai_sensitivity_global');
            return stored ? parseInt(stored, 10) : 5;
        } catch {
            return 5;
        }
    });

    const handleGlobalAiSensitivityChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setGlobalAiSensitivity(val);
        localStorage.setItem('praxis_ai_sensitivity_global', val.toString());
    };

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
                    tradingMode: userData.preferences?.tradingMode || "swing",
                    theme: userData.preferences?.theme || "dark",
                    soundAlerts: userData.preferences?.soundAlerts ?? true,
                };

                // Migrate old v1 mode names from backend to new v2 profile keys
                const LEGACY_MAP = { conservative: 'intraday', balanced: 'swing', aggressive: 'positional' };
                const rawMode = userData.preferences?.tradingMode || 'swing';
                const migratedMode = LEGACY_MAP[rawMode] || rawMode;
                // Only override localStorage if it's the default 'swing' — respect user's explicit local choice
                const localMode = localStorage.getItem('stocky-trading-mode');
                const validProfiles = ['intraday', 'swing', 'positional'];
                const finalMode = validProfiles.includes(localMode) ? localMode : migratedMode;

                // Patch the loaded settings to use the resolved profile key
                loadedSettings.tradingMode = finalMode;

                setFormData(loadedFormData);
                setInitialFormData(loadedFormData);
                setSettings(loadedSettings);
                setInitialSettings(loadedSettings);

                // Sync ThemeContext with resolved profile
                setTradingMode(finalMode);

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
            setSaveStatus(null);
            toast.error("Please enter a valid email address.");
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
            toast.error("Failed to send OTP. Please try again.");
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
            setSaveStatus(null);
            toast.success("Email updated successfully.");
        } catch {
            console.error("Failed to verify OTP");
            toast.error("Invalid OTP. Please try again.");
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
            toast.error("Failed to send verification OTP");
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
            setSaveStatus(null);
            toast.success("Email verified successfully.");

            // Update Context
            if (updateUser && token) {
                updateUser({ ...user, isEmailVerified: true }, token);
            }
        } catch {
            console.error("Failed to verify email");
            toast.error("Invalid verification OTP.");
        } finally {
            setLoading(false);
        }
    };

    // -- Trading Profile Logic --
    const handleTradingModeSelect = (mode) => {
        // setProfile: updates ThemeContext + fires prompt preset switch on all headers
        setProfile(mode);
        setSettings(prev => ({ ...prev, tradingMode: mode }));
    };

    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const handleRegisterPasskey = async () => {
        try {
            setLoading(true);
            const options = await generateRegistrationOptions();
            let attResp;
            try {
                attResp = await startRegistration({ optionsJSON: options });
            } catch (error) {
                if (error.name === 'InvalidStateError') {
                    alert('Error: Authenticator was probably already registered by user');
                } else {
                    alert('Registration failed or cancelled.');
                }
                return;
            }
            const verificationResp = await verifyRegistration(attResp);
            if (verificationResp && verificationResp.verified) {
                alert('Device successfully registered for biometric sign in!');
            } else {
                alert('Verification failed.');
            }
        } catch (err) {
            console.error("Passkey registration error:", err);
            alert("Failed to register device. Your device might not support Passkeys.");
        } finally {
            setLoading(false);
        }
    };

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
                setSaveStatus(null);
                toast.success("Password changed successfully.");
            } else {
                setConnectionStatus({ success: false, message: data.message || 'Connection failed.' });
            }
        } catch (err) {
            setConnectionStatus({ success: false, message: 'Failed to connect. Please try again.' });
        } finally {
            setTestingConnection(false);
        }
    };

    // -- Delete Account Logic --
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
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
                    theme: settings.theme,
                    soundAlerts: settings.soundAlerts,
                    tradingMode: tradingMode,  // persist the active profile to backend
                })
            ]);

            // Sync Context (Updates Sidebar immediately)
            if (updateUser && token) {
                const updatedUser = {
                    ...user,
                    fullName: formData.fullName,
                    email: formData.email,
                    profileImage: formData.profileImage,
                    notificationSettings: {
                        tradeAlerts: settings.tradeAlerts,
                        portfolioAlerts: settings.portfolioAlerts,
                        systemMessages: settings.systemMessages,
                        deliveryApp: settings.deliveryApp,
                        deliveryEmail: settings.deliveryEmail
                    },
                    preferences: {
                        theme: settings.theme,
                        soundAlerts: settings.soundAlerts,
                        tradingMode: tradingMode,
                    }
                };
                updateUser(updatedUser, token);
            }

            // Update initial state to match current state (clears unsaved flag)
            setInitialFormData({ ...formData });
            setInitialSettings({ ...settings });

            setSaveStatus(null);
            toast.success("Settings saved successfully.");
        } catch {
            console.error("Save failed");
            setSaveStatus(null);
            toast.error("Failed to save changes.");
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
        { id: "manual_data", label: "Manual Data", icon: FiDatabase },
        { id: "about", label: "About", icon: FiInfo },
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
        <div className="min-h-screen px-4 md:px-6 pt-4 pb-8 text-text-primary font-sans w-full">
            <div className="w-full">

                {/* Header */}
                <div className="mb-4 md:mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="mt-0.5 text-[11px] md:text-sm text-text-secondary">Manage your account and customization</p>
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


                <div className="grid gap-4 md:gap-8 lg:grid-cols-[220px_1fr]">

                    {/* Sidebar / Tabs Navigation */}
                    <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 md:overflow-visible scrollbar-hide -mx-1 px-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-medium transition-all duration-300 shrink-0 ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/40 shadow-sm text-blue-500"
                                    : "text-text-secondary hover:bg-transparent hover:text-text-primary border border-transparent hover:border-[var(--border-default)] hover:shadow-sm"
                                    }`}
                            >
                                <tab.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-colors duration-300 ${activeTab === tab.id ? "text-blue-500" : ""}`} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Main Content Area */}
                    <div className="rounded-2xl border border-border-default bg-transparent p-3.5 sm:p-5 lg:p-8 shadow-xl shadow-black/5 backdrop-blur-sm min-w-0">

                        {/* --- ACCOUNT TAB --- */}
                        {activeTab === "account" && (
                            <div className="space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-base md:text-xl font-semibold">Profile Information</h2>
                                    <p className="text-[11px] md:text-sm text-text-secondary">Update your public profile and details</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-6">
                                    <div className="relative h-16 w-16 md:h-24 md:w-24 overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-[2px]">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-transparent">
                                            {formData.profileImage ? (
                                                <img src={formData.profileImage} alt="Profile" className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-lg md:text-2xl font-bold">{formData.fullName?.[0]?.toUpperCase() || "U"}</span>
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
                                            className="text-xs md:text-sm font-medium text-blue-500 hover:text-blue-400"
                                        >
                                            Upload New Picture
                                        </button>
                                        <p className="mt-0.5 text-[10px] md:text-xs text-text-tertiary">JPG, GIF or PNG. Max size 2MB.</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] md:text-sm font-medium text-text-secondary">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                                            placeholder="Enter your full name"
                                            className="w-full rounded-lg border border-border-default bg-transparent px-3 py-2 md:px-4 md:py-2.5 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:bg-transparent focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-200"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] md:text-sm font-medium text-text-secondary flex items-center justify-between w-full">
                                            <span>Email Address</span>
                                            {isEmailVerified ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    <FiCheck size={10} className="shrink-0" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                    <FiAlertCircle size={10} className="shrink-0" /> Unverified
                                                </span>
                                            )}
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="w-full cursor-not-allowed rounded-lg border border-border-default bg-transparent/50 px-3 py-2 md:px-4 md:py-2.5 text-text-secondary text-sm"
                                            />
                                            <button
                                                onClick={() => setShowEmailChangeModal(true)}
                                                className="w-full sm:shrink-0 sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-xs md:text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        {!isEmailVerified && (
                                            <div className="mt-2 p-3 rounded-xl border border-blue-500/30">
                                                <div className="flex items-start gap-3">
                                                    <div className="h-8 w-8 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                        <FiShield className="text-blue-500 text-sm" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[11px] md:text-sm font-semibold text-text-primary">Verify your mail</p>
                                                        <p className="text-[10px] md:text-xs text-text-secondary mt-0.5 leading-relaxed">
                                                            Verifying your email allows us to send you clean trade alerts and critical security notifications.
                                                        </p>
                                                        <button
                                                            onClick={handleInitiateVerification}
                                                            disabled={verifyingEmail}
                                                            className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            {verifyingEmail ? (
                                                                <><Loader size="xxs" color="blue" /> Requesting...</>
                                                            ) : (
                                                                <>Verify Now <i className="bx bx-right-arrow-alt text-base"></i></>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-border-default pt-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Data & Intelligence Feeds</label>
                                        </div>
                                        <div
                                            onClick={() => navigate("/dashboard/admin")}
                                            className="group cursor-pointer relative overflow-hidden bg-transparent border border-border-default rounded-2xl p-6 flex items-center justify-between hover:border-border-subtle hover:bg-background-elevated transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-5 relative z-10">
                                                <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 text-xl group-hover:scale-110 transition-transform duration-300">
                                                    <FiDatabase />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-extrabold text-text-primary">Data Acquisition Center</h3>
                                                    <p className="text-text-secondary text-[11px] mt-1 font-bold tracking-wide">Manage 30+ Market APIs & 10+ Web Scrapers.</p>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-text-tertiary group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 relative z-10">
                                                <FiLink2 size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-[var(--border-subtle)] pt-8">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-red-500">
                                        <FiAlertCircle className="text-red-500" /> Danger Zone
                                    </h3>
                                    <div className="rounded-xl border border-red-500/10 bg-red-500/5 px-4 md:px-6 pt-2">
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
                                            <UniversalToggle 
                                                checked={settings[item.id]} 
                                                onChange={() => handleSettingToggle(item.id)} 
                                            />
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
                                            <UniversalToggle 
                                                checked={settings[item.id]} 
                                                onChange={() => handleSettingToggle(item.id)} 
                                            />
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

                                <div className="rounded-xl border border-border-default bg-transparent px-4 md:px-6 pt-2 pb-6">
                                    <h3 className="mb-4 text-lg font-medium text-emerald-400 flex items-center gap-2">
                                        <Shield size={20} /> Biometric Sign-In (Passkey)
                                    </h3>
                                    <p className="text-sm text-text-secondary mb-4">
                                        Register your device's Fingerprint or FaceID to sign in instantly without a password.
                                    </p>
                                    <button
                                        onClick={handleRegisterPasskey}
                                        disabled={loading}
                                        className="rounded-lg bg-emerald-600/20 border border-emerald-500/50 px-6 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-600/40 transition-colors disabled:opacity-50"
                                    >
                                        Register this Device
                                    </button>
                                </div>

                                <div className="rounded-xl border border-border-default bg-transparent px-4 md:px-6 pt-2">
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

                                {/* Trading Profile */}
                                <div>
                                    <h3 className="mb-1 text-sm font-medium text-text-secondary">Trading Profile</h3>
                                    <p className="text-[11px] text-text-tertiary mb-4">Adjusts indicator weights and AI analysis style across all dashboard pages</p>
                                    <div className="grid gap-3 md:gap-4 md:grid-cols-3">
                                        {[
                                            { id: "positional", label: "Positional", icon: FiShield,    desc: "Fundamentals & macro focus",   activeClass: "bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-500/20" },
                                            { id: "swing",      label: "Swing",      icon: FiTrendingUp, desc: "Balanced technicals & fundamentals", activeClass: "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-500/20" },
                                            { id: "intraday",   label: "Intraday",   icon: FiZap,       desc: "Momentum & speed signals",     activeClass: "bg-orange-600 text-white border-transparent shadow-lg shadow-orange-500/20" },
                                        ].map(mode => {
                                            const isActive = tradingMode === mode.id;
                                            const activeClass = isActive
                                                ? mode.activeClass
                                                : "bg-transparent hover:bg-transparent hover:shadow-lg hover:-translate-y-0.5 text-text-secondary";

                                            return (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => handleTradingModeSelect(mode.id)}
                                                    className={`group relative flex md:flex-col items-center gap-3 rounded-xl border px-4 md:px-6 pt-2 text-left md:text-center transition-all duration-300 ${activeClass}`}
                                                >
                                                    <mode.icon className={`h-6 w-6 md:h-8 md:w-8 shrink-0 transition-colors duration-300 ${isActive ? "text-white" : "text-text-tertiary group-hover:text-text-primary"}`} />
                                                    <div>
                                                        <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${isActive ? "text-white" : "text-text-primary"}`}>{mode.label}</p>
                                                        <p className={`mt-0.5 md:mt-1.5 text-[10px] md:text-xs leading-relaxed ${isActive ? "text-white/80" : "text-text-tertiary"}`}>{mode.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* AI Settings */}
                                <div className="pt-4">
                                    <h3 className="mb-4 text-sm font-medium text-text-secondary">AI Settings</h3>
                                    <div className="flex flex-col gap-6 rounded-lg border border-border-default bg-transparent p-4">
                                        {/* Technical Sensitivity */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-text-primary">Technical Insight Sensitivity</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">Adjust how much the technical score must change before generating a new insight (higher = less frequent updates).</p>
                                                </div>
                                                <div className="bg-text-secondary/10 px-3 py-1 rounded-md">
                                                    <span className="font-semibold text-text-primary">{technicalAiSensitivity} pts</span>
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                step="1"
                                                value={technicalAiSensitivity}
                                                onChange={handleTechnicalAiSensitivityChange}
                                                className="w-full h-2 bg-[var(--border-default)] rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                                            />
                                            <div className="flex justify-between text-[10px] text-text-tertiary">
                                                <span>High Sensitivity (1)</span>
                                                <span>Low Sensitivity (20)</span>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-[var(--border-default)] opacity-50" />

                                        {/* Global Sensitivity */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-text-primary">Global Insight Sensitivity</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">Adjust the sensitivity threshold for all other dashboard modules (Fundamentals, Options, Master).</p>
                                                </div>
                                                <div className="bg-text-secondary/10 px-3 py-1 rounded-md">
                                                    <span className="font-semibold text-text-primary">{globalAiSensitivity} pts</span>
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                step="1"
                                                value={globalAiSensitivity}
                                                onChange={handleGlobalAiSensitivityChange}
                                                className="w-full h-2 bg-[var(--border-default)] rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                                            />
                                            <div className="flex justify-between text-[10px] text-text-tertiary">
                                                <span>High Sensitivity (1)</span>
                                                <span>Low Sensitivity (20)</span>
                                            </div>
                                        </div>
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

                                    {/* Orb Navigation Toggle */}
                                    <div className="space-y-3 mt-3">
                                        <div className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <p className="font-medium text-text-primary">Orb Navigation Layout</p>
                                                <p className="text-xs text-text-secondary mt-0.5">Replace standard sidebar with a dynamic radial floating menu</p>
                                            </div>
                                            <UniversalToggle 
                                                checked={useOrbNav} 
                                                onChange={() => setUseOrbNav(!useOrbNav)} 
                                            />
                                        </div>
                                    </div>


                                    {/* Gradient Border Toggle */}
                                    {theme === 'dark' && (
                                        <div className="space-y-3 mt-3">
                                            <div className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                <p className="font-medium text-text-primary">Gradient Borders</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">Enable premium blue-violet borders around cards</p>
                                                </div>
                                                <UniversalToggle 
                                                    checked={gradientBorder} 
                                                    onChange={() => setGradientBorder(!gradientBorder)} 
                                                />
                                            </div>

                                            {/* Mode-Synced Aesthetics Toggle */}
                                            <div className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                <p className="font-medium text-text-primary">Mode-Synced Aesthetics</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">Adapt gradient border colors to your Trading Mode</p>
                                                </div>
                                                <UniversalToggle 
                                                    checked={tradingModeVfx} 
                                                    onChange={() => setTradingModeVfx(!tradingModeVfx)} 
                                                />
                                            </div>
                                        </div>
                                    )}

                        {/* VFX Customization (Dark Mode Only) */}
                        {theme === 'dark' && (
                            <div className="pt-4 animate-in fade-in duration-500 hidden md:block">
                                <h3 className="mb-4 text-sm font-medium text-text-secondary">VFX Presets (Dark Mode Only)</h3>
                                {/* ... omitted for brevity but I need to keep the exact content ... */}
                                <div className="flex overflow-x-auto pb-4 gap-3 custom-scrollbar">
                                    {[
                                        { id: 'midnight', label: 'Midnight', colors: 'from-blue-600 via-indigo-600 to-cyan-500', desc: 'Default Balance' },
                                        { id: 'solar', label: 'Solar Flare', colors: 'from-orange-500 via-amber-500 to-rose-500', desc: 'Warm Energy' },
                                        { id: 'forest', label: 'Neon Forest', colors: 'from-emerald-500 via-teal-500 to-lime-500', desc: 'Calm Growth' },
                                        { id: 'ocean', label: 'Deep Ocean', colors: 'from-blue-800 via-blue-600 to-cyan-600', desc: 'Icy Focus' },
                                        { id: 'royal', label: 'Royal Nebula', colors: 'from-indigo-600 via-violet-600 to-blue-500', desc: 'Premium Depth' },
                                        { id: 'cosmos', label: 'Cosmos', colors: '', desc: 'Starry Night' },
                                        { id: 'meteors', label: 'Meteor Shower', colors: '', desc: 'Falling Stars' }
                                    ].map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => setVfxPreset(preset.id)}
                                            className={`min-w-[140px] flex-shrink-0 group relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 text-center
                                                ${vfxPreset === preset.id
                                                    ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                                                    : "border-border-subtle bg-transparent hover:border-border-default"}
                                            `}
                                        >
                                            <div className={`w-full h-12 rounded-lg relative overflow-hidden bg-[#02050e] opacity-80 group-hover:opacity-100 transition-opacity`}>
                                                {preset.id === 'cosmos' ? (
                                                    <div className="absolute inset-0">
                                                        <div id="stars"></div>
                                                        <div id="stars2"></div>
                                                        <div id="stars3"></div>
                                                    </div>
                                                ) : preset.id === 'meteors' ? (
                                                    <div className="meteors-container absolute inset-0"></div>
                                                ) : (
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${preset.colors}`} />
                                                )}
                                            </div>
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

                    {/* --- PAI PERSONALIZATION --- */}
                    <div className="pt-8 animate-in fade-in duration-500">
                        <h3 className="mb-4 text-sm font-medium text-text-secondary">PAI Personalization</h3>
                        
                        {/* PAI Mascot Color Picker */}
                        <div className="flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4">
                            <div>
                                <p className="font-medium text-text-primary">Mascot Color</p>
                                <p className="text-xs text-text-secondary mt-0.5">Customize the color of your floating PAI ghost</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border-subtle shadow-sm flex-shrink-0 group">
                                    <div 
                                        className="absolute inset-0 pointer-events-none transition-colors" 
                                        style={{ backgroundColor: paiMascotColor || '#FF0000' }} 
                                    />
                                    <input 
                                        type="color" 
                                        value={paiMascotColor || '#FF0000'}
                                        onChange={(e) => setPaiMascotColor(e.target.value)}
                                        className="absolute inset-[-10px] w-[60px] h-[60px] opacity-0 cursor-pointer"
                                        title="Choose Mascot Color"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PAI Mascot Accessory Picker */}
                        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border-default bg-transparent p-4">
                            <div>
                                <p className="font-medium text-text-primary">Mascot Accessory</p>
                                <p className="text-xs text-text-secondary mt-0.5">Choose a cute accessory for your PAI ghost (Scroll for more)</p>
                            </div>
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {PAI_ACCESSORIES.map(acc => (
                                    <div 
                                        key={acc.id}
                                        onClick={() => setPaiAccessory(acc.id)}
                                        className={`relative flex flex-col items-center justify-center flex-shrink-0 w-28 h-32 rounded-xl cursor-pointer border-2 transition-all snap-start ${
                                            paiAccessory === acc.id 
                                                ? 'border-blue-500 bg-blue-500/10' 
                                                : 'border-border-subtle bg-background-surface hover:border-border-default hover:bg-background-elevated'
                                        }`}
                                    >
                                        <div className="h-16 flex items-center justify-center scale-[0.35] pointer-events-none">
                                            <GhostLogo status="idle" accessory={acc.id} />
                                        </div>
                                        <span className="text-xs font-medium text-text-primary mt-4">{acc.label}</span>
                                        {paiAccessory === acc.id && (
                                            <div className="absolute top-2 right-2 text-blue-500">
                                                <FiCheck size={14} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PAI Voice Visualizer Toggle */}
                        <div className="mt-3 flex flex-col gap-4 rounded-lg border border-border-default bg-transparent p-4">
                            <div>
                                <p className="font-medium text-text-primary">PAI Voice Visualizer</p>
                                <p className="text-xs text-text-secondary mt-0.5">Select your preferred audio visualization style</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* 8-Bit Pixel Art Demo Card */}
                                <button 
                                    onClick={() => setPaiAudioStyle('pixel')}
                                    className={`relative overflow-hidden rounded-xl border p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${paiAudioStyle === 'pixel' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-border-default bg-background-surface hover:border-border-hover'}`}
                                >
                                    <div className="h-12 w-full flex items-center justify-center gap-1">
                                        {[3, 6, 4, 8, 5, 7, 4, 2].map((h, i) => (
                                            <div key={i} className={`w-3 bg-blue-400 animate-pulse`} style={{ height: `${h * 4}px`, animationDelay: `${i * 0.15}s`, borderRadius: '0px' }} />
                                        ))}
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className={`text-sm font-semibold ${paiAudioStyle === 'pixel' ? 'text-blue-400' : 'text-text-primary'}`}>8-Bit Pixel Art</p>
                                        <p className="text-[10px] text-text-tertiary mt-1">Retro blocky style</p>
                                    </div>
                                    {paiAudioStyle === 'pixel' && (
                                        <div className="absolute top-2 right-2 text-blue-500">
                                            <FiCheck size={14} />
                                        </div>
                                    )}
                                </button>
                                
                                {/* Smooth Wave Demo Card */}
                                <button 
                                    onClick={() => setPaiAudioStyle('bar')}
                                    className={`relative overflow-hidden rounded-xl border p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${paiAudioStyle === 'bar' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-border-default bg-background-surface hover:border-border-hover'}`}
                                >
                                    <div className="h-12 w-full flex items-center justify-center gap-1.5">
                                        {[4, 8, 5, 10, 6, 9, 5, 3].map((h, i) => (
                                            <div key={i} className={`w-2.5 bg-blue-400 rounded-full animate-pulse`} style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
                                        ))}
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className={`text-sm font-semibold ${paiAudioStyle === 'bar' ? 'text-blue-400' : 'text-text-primary'}`}>Smooth Wave</p>
                                        <p className="text-[10px] text-text-tertiary mt-1">Modern rounded bars</p>
                                    </div>
                                    {paiAudioStyle === 'bar' && (
                                        <div className="absolute top-2 right-2 text-blue-500">
                                            <FiCheck size={14} />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Legacy PAI Context Toggle */}
                        <div className="mt-3 flex items-center justify-between rounded-lg border border-border-default bg-transparent p-4">
                            <div>
                                <p className="font-medium text-text-primary">Legacy NLP Mention Method (PAI Voice)</p>
                                <p className="text-xs text-text-secondary mt-0.5">Use explicit @mentions (regex matching) instead of the Auto-Context engine</p>
                            </div>
                            <UniversalToggle 
                                checked={legacyVoiceContext} 
                                onChange={() => {
                                    const newValue = !legacyVoiceContext;
                                    setLegacyVoiceContext(newValue);
                                    localStorage.setItem('paiLegacyVoiceContext', newValue ? 'true' : 'false');
                                    toast.success(newValue ? 'Legacy Mention Method Enabled' : 'Auto-Context Engine Enabled');
                                }} 
                            />
                        </div>
                    </div>


                    {/* Calculator Keybindings Customization */}
                    <div className="pt-6 border-t border-border-subtle animate-in fade-in duration-500">
                            <div>
                                <h3 className="text-sm font-medium text-text-primary">Calculator Keybindings</h3>
                                <p className="text-xs text-text-secondary mt-1">Map your physical keyboard keys to the scientific functions.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                {Object.entries(calcBindings).map(([funcKey, mappedChar]) => (
                                    <div key={funcKey} className="flex flex-col gap-1">
                                        <label className="text-xs text-text-tertiary capitalize">{funcKey === 'fraction' ? 'a/b (Fraction)' : funcKey}</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                maxLength={1}
                                                value={mappedChar}
                                                onChange={(e) => updateCalcBinding(funcKey, e.target.value)}
                                                className="w-full bg-background-elevated border border-border-default rounded-md px-3 py-2 text-sm text-center uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="Key"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {/* --- MANUAL DATA TAB --- */}
                        {activeTab === "manual_data" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-xl font-semibold">Manual Data Settings</h2>
                                    <p className="text-sm text-text-secondary">Configure expiration timers for your manual data overrides.</p>
                                </div>
                                <div className="space-y-8">
                                    {/* GLOBAL SETTINGS */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold tracking-wider text-emerald-500 uppercase border-b border-border-default pb-2">Global Settings</h3>
                                        <div className="rounded-xl border border-border-default bg-background-surface/30 p-5 space-y-5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                                    <FiDatabase size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium text-text-primary">Global Default Timer</h3>
                                                    <p className="text-xs text-text-tertiary mb-3 mt-1">Expiration time for any manual input without a specific timer.</p>
                                                    <UiverseDropdown
                                                        options={[
                                                            { value: 2 * 60 * 60 * 1000, label: "2 Hours" },
                                                            { value: 24 * 60 * 60 * 1000, label: "24 Hours" },
                                                            { value: 7 * 24 * 60 * 60 * 1000, label: "7 Days" },
                                                            { value: 30 * 24 * 60 * 60 * 1000, label: "30 Days" }
                                                        ]}
                                                        value={manualExpiryConfigs.global_default}
                                                        onChange={(val) => handleManualExpiryChange("global_default", Number(val))}
                                                        className="w-full max-w-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* FUNDAMENTALS MODULE */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold tracking-wider text-blue-500 uppercase border-b border-border-default pb-2">Fundamentals Module</h3>
                                        
                                        <div className="space-y-3">
                                            <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider pl-1">Company Metrics</h4>
                                            <div className="rounded-xl border border-border-default bg-background-surface/30 p-5 space-y-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                                        <FiDatabase size={16} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-medium text-text-primary">Face Value Timer</h3>
                                                        <p className="text-xs text-text-tertiary mb-3 mt-1">Specific expiration time for Face Value (rarely changes).</p>
                                                        <UiverseDropdown
                                                            options={[
                                                                { value: 24 * 60 * 60 * 1000, label: "24 Hours" },
                                                                { value: 7 * 24 * 60 * 60 * 1000, label: "7 Days" },
                                                                { value: 30 * 24 * 60 * 60 * 1000, label: "30 Days" },
                                                                { value: 365 * 24 * 60 * 60 * 1000, label: "1 Year" }
                                                            ]}
                                                            value={manualExpiryConfigs.face_value}
                                                            onChange={(val) => handleManualExpiryChange("face_value", Number(val))}
                                                            className="w-full max-w-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider pl-1">Index Metrics</h4>
                                            {[
                                                { key: "mcap_gdp", label: "M-Cap/GDP Timer", desc: "Specific expiration time for M-Cap to GDP ratio." },
                                                { key: "eps_yoy", label: "EPS YoY Timer", desc: "Specific expiration time for EPS YoY." },
                                                { key: "forward_eps", label: "Forward EPS Timer", desc: "Specific expiration time for Forward EPS." },
                                                { key: "profit_margin", label: "Profit Margin Timer", desc: "Specific expiration time for Profit Margin." },
                                            ].map((metric) => (
                                                <div key={metric.key} className="rounded-xl border border-border-default bg-background-surface/30 p-5 space-y-5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                                            <FiDatabase size={16} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-sm font-medium text-text-primary">{metric.label}</h3>
                                                            <p className="text-xs text-text-tertiary mb-3 mt-1">{metric.desc}</p>
                                                            <UiverseDropdown
                                                                options={[
                                                                    { value: 2 * 60 * 60 * 1000, label: "2 Hours" },
                                                                    { value: 24 * 60 * 60 * 1000, label: "24 Hours" },
                                                                    { value: 7 * 24 * 60 * 60 * 1000, label: "7 Days" },
                                                                    { value: 30 * 24 * 60 * 60 * 1000, label: "30 Days" },
                                                                    { value: 365 * 24 * 60 * 60 * 1000, label: "1 Year" }
                                                                ]}
                                                                value={manualExpiryConfigs[metric.key]}
                                                                onChange={(val) => handleManualExpiryChange(metric.key, Number(val))}
                                                                className="w-full max-w-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GLOBAL & MACRO MODULE */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold tracking-wider text-indigo-500 uppercase border-b border-border-default pb-2">Global & Macro Module</h3>
                                        <div className="space-y-3">
                                            <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider pl-1">Liquidity & Policy Metrics</h4>
                                            {[
                                                { key: "policy_tailwinds", label: "Policy Tailwinds Timer", desc: "Specific expiration time for Policy Tailwinds." },
                                                { key: "fii_trend", label: "FII Trend Timer", desc: "Specific expiration time for FII Trend." },
                                                { key: "mf_flows", label: "MF Flows Timer", desc: "Specific expiration time for MF Flows." },
                                                { key: "system_liquidity", label: "Sys Liquidity Timer", desc: "Specific expiration time for System Liquidity." }
                                            ].map((metric) => (
                                                <div key={metric.key} className="rounded-xl border border-border-default bg-background-surface/30 p-5 space-y-5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                                                            <FiDatabase size={16} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-sm font-medium text-text-primary">{metric.label}</h3>
                                                            <p className="text-xs text-text-tertiary mb-3 mt-1">{metric.desc}</p>
                                                            <UiverseDropdown
                                                                options={[
                                                                    { value: 2 * 60 * 60 * 1000, label: "2 Hours" },
                                                                    { value: 24 * 60 * 60 * 1000, label: "24 Hours" },
                                                                    { value: 7 * 24 * 60 * 60 * 1000, label: "7 Days" },
                                                                    { value: 30 * 24 * 60 * 60 * 1000, label: "30 Days" },
                                                                    { value: 365 * 24 * 60 * 60 * 1000, label: "1 Year" }
                                                                ]}
                                                                value={manualExpiryConfigs[metric.key]}
                                                                onChange={(val) => handleManualExpiryChange(metric.key, Number(val))}
                                                                className="w-full max-w-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- ABOUT TAB --- */}
                        {activeTab === "about" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Hero */}
                                <div className="text-center space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold uppercase tracking-widest">
                                        <Terminal size={12} />
                                        System Version 2.0
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-text-primary leading-tight">
                                        Precision Intelligence{" "}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">
                                            For Discretionary Traders
                                        </span>
                                    </h2>
                                    <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
                                        Praxis is not a signal service. It is an{" "}
                                        <span className="text-blue-500 font-medium">institutional-grade decision support system</span>{" "}
                                        designed to align market context, probability, and risk execution.
                                    </p>
                                </div>

                                {/* Pillars */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { icon: Shield, title: "Risk First", desc: "Capital preservation is the axiom.", color: "text-emerald-400", bg: "bg-emerald-500/5", border: "hover:border-emerald-500/30" },
                                        { icon: Layers, title: "Context Aware", desc: "Signals filtered through regime logic.", color: "text-blue-400", bg: "bg-blue-500/5", border: "hover:border-blue-500/30" },
                                        { icon: BrainCircuit, title: "Process Driven", desc: "Systematizing discretion with frameworks.", color: "text-purple-400", bg: "bg-purple-500/5", border: "hover:border-purple-500/30" },
                                        { icon: Target, title: "Execution Focus", desc: "Tools built for precision entry and exit.", color: "text-amber-400", bg: "bg-amber-500/5", border: "hover:border-amber-500/30" },
                                    ].map(({ icon: Icon, title, desc, color, bg, border }) => (
                                        <div key={title} className={`group p-5 rounded-2xl bg-background-card border border-border-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${border}`}>
                                            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon size={20} />
                                            </div>
                                            <h3 className="text-sm font-bold text-text-primary mb-1 group-hover:text-blue-500 transition-colors">{title}</h3>
                                            <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Why Praxis + Comparison */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold">Why <span className="text-blue-500">Praxis</span>?</h3>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            Most retail tools flood you with noise — endless alerts, lagging indicators, and "buy/sell" signals with zero context.
                                            Praxis is built to answer: <span className="text-text-primary italic font-medium">"Is this trade structurally sound?"</span>
                                        </p>
                                        <div className="p-5 rounded-2xl bg-background-card border border-border-default relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative z-10 flex items-start gap-3">
                                                <Zap className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-text-primary mb-1">The "Edge"</h4>
                                                    <p className="text-xs text-text-secondary">Praxis synthesizes Volatility (Options), Valuation (Fundamentals), and Macros (Global) simultaneously.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-background-card border border-border-default rounded-2xl overflow-hidden shadow-xl">
                                        <div className="grid grid-cols-2 text-xs font-bold uppercase tracking-widest border-b border-border-default">
                                            <div className="p-3 text-text-tertiary bg-background-surface">Retail Tools</div>
                                            <div className="p-3 text-blue-500 bg-blue-500/10">Praxis Ecosystem</div>
                                        </div>
                                        <div className="divide-y divide-border-default text-xs">
                                            {[
                                                ["Lagging Indicators", "Predictive Volatility Models"],
                                                ["Generic 'Buy' Alerts", "Regime-Filtered Setups"],
                                                ["Isolated Charts", "Multi-Factor Synthesis"],
                                                ["Unmanaged Risk", "Dynamic Drawdown Controls"],
                                                ["Emotional Trading", "Journaled Discipline"],
                                            ].map(([old, neo]) => (
                                                <div key={old} className="grid grid-cols-2 hover:bg-background-surface transition-colors">
                                                    <div className="p-3 text-text-tertiary border-r border-border-default flex items-center gap-2">
                                                        <XCircle size={12} className="opacity-50 shrink-0" />
                                                        <span className="line-through">{old}</span>
                                                    </div>
                                                    <div className="p-3 text-text-primary font-medium flex items-center gap-2">
                                                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                                        {neo}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Who it's for */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
                                        <h3 className="text-base font-bold text-emerald-500 mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" /> Built For
                                        </h3>
                                        <ul className="space-y-3">
                                            {["Systems traders seeking consistency", "Option sellers managing Greek exposure", "Swing traders focused on fundamentals", "Anyone who journals their execution"].map(t => (
                                                <li key={t} className="flex items-start gap-2 text-sm text-text-secondary">
                                                    <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />{t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-red-500/[0.02] border border-red-500/20 hover:border-red-500/30 transition-colors">
                                        <h3 className="text-base font-bold text-red-500 mb-4 flex items-center gap-2">
                                            <XCircle className="w-5 h-5" /> Not For
                                        </h3>
                                        <ul className="space-y-3">
                                            {["Gamblers looking for 'guaranteed' calls", "Impulsive zero-day (0DTE) heroes", "People expecting automation/bots", "Those unwilling to manage risk"].map(t => (
                                                <li key={t} className="flex items-start gap-2 text-sm text-text-tertiary">
                                                    <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />{t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-border-default pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-tertiary">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-background-surface">
                                            <Code2 size={18} className="text-text-secondary" />
                                        </div>
                                        <div>
                                            <div className="text-text-primary font-medium">Engineered by Shanif</div>
                                            <div className="text-xs opacity-70">v2.4.0-stable</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <a href="mailto:praxis.prop@gmail.com" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                                            <Mail size={14} /> praxis.prop@gmail.com
                                        </a>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Systems Operational
                                        </div>
                                    </div>
                                </div>
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
                        <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-border-default bg-white dark:bg-[#0b1220] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Email Address</h3>
                                <button onClick={() => setShowEmailOtpModal(false)}><FiX className="text-slate-400 dark:text-text-secondary hover:text-slate-700 dark:hover:text-text-primary" /></button>
                            </div>

                            {!pendingEmail ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">Enter your new email address. We will send a verification code.</p>
                                    <input
                                        type="email"
                                        placeholder="New Email Address"
                                        className="w-full rounded-lg border border-gray-300 dark:border-border-default bg-gray-50 dark:bg-transparent px-4 py-3 text-slate-900 dark:text-text-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#1E1BFF] focus:outline-none focus:ring-1 focus:ring-[#1E1BFF]/20 transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') initiateEmailChange(e.currentTarget.value)
                                        }}
                                    />
                                    <button
                                        className="w-full rounded-lg bg-[#1E1BFF] py-3 font-medium text-white hover:bg-[#1720cc] shadow-md shadow-blue-600/20"
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
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Enter the 6-digit code sent to <span className="text-slate-900 dark:text-white font-medium">{pendingEmail}</span>
                                    </p>
                                    <input
                                        type="text"
                                        value={emailOtp}
                                        maxLength={6}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000 000"
                                        className="w-full rounded-lg border border-gray-300 dark:border-border-default bg-gray-50 dark:bg-transparent px-4 py-3 text-center text-xl tracking-widest text-slate-900 dark:text-text-primary placeholder:text-gray-300 focus:border-[#1E1BFF] focus:outline-none focus:ring-1 focus:ring-[#1E1BFF]/20"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-text-tertiary">
                                        <span>Expires in 5:00</span>
                                        {otpTimer > 0 ? (
                                            <span>Resend in {otpTimer}s</span>
                                        ) : (
                                            <button className="text-[#1E1BFF] hover:underline">Resend Code</button>
                                        )}
                                    </div>
                                    <button
                                        className="w-full rounded-lg bg-[#1E1BFF] py-3 font-medium text-white hover:bg-[#1720cc] disabled:opacity-50 shadow-md shadow-blue-600/20"
                                        disabled={emailOtp.length !== 6}
                                        onClick={verifyEmailChange}
                                    >
                                        Verify & Update
                                    </button>
                                    <button
                                        onClick={() => setPendingEmail("")}
                                        className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-text-primary transition-colors"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-border-default bg-white dark:bg-[#0b1220] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Verify Email</h3>
                                <button onClick={() => setShowVerifyEmailOtpModal(false)}><FiX className="text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-text-primary" /></button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-text-secondary">
                                    Enter the 6-digit code sent to your email to enable trade alerts.
                                </p>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={emailOtp}
                                        maxLength={6}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000 000"
                                        className="w-full rounded-lg border border-gray-300 dark:border-border-default bg-gray-50 dark:bg-transparent px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 dark:text-text-primary focus:border-[#1E1BFF] focus:outline-none focus:ring-1 focus:ring-[#1E1BFF]/30 transition-all placeholder:text-gray-300 dark:placeholder:text-text-tertiary/20"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 dark:text-text-tertiary uppercase font-medium tracking-wider">
                                    <span>5:00 MINUTES UNTIL EXPIRE</span>
                                    {otpTimer > 0 ? (
                                        <span>RESEND IN {otpTimer}S</span>
                                    ) : (
                                        <button onClick={handleInitiateVerification} className="text-[#1E1BFF] hover:underline">RESEND NOW</button>
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
                            <h3 className="text-center text-xl font-bold text-slate-900 dark:text-white">Change Email Address</h3>
                            <p className="mt-2 text-center text-slate-500 dark:text-slate-300 text-sm">
                                Enter your new email address. We'll send you a verification code to confirm the change.
                            </p>

                            <div className="mt-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Email Address</label>
                                    <input
                                        type="email"
                                        value={pendingEmail}
                                        onChange={(e) => setPendingEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full rounded-lg border border-gray-300 dark:border-border-default bg-gray-50 dark:bg-transparent px-4 py-3 text-slate-900 dark:text-text-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#1E1BFF] focus:outline-none focus:ring-1 focus:ring-[#1E1BFF]/20"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowEmailChangeModal(false);
                                            setPendingEmail("");
                                        }}
                                        className="flex-1 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-slate-800 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
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
                                        className="flex-1 rounded-lg bg-[#1E1BFF] py-3 text-sm font-semibold text-white hover:bg-[#1720cc] disabled:opacity-50 shadow-lg shadow-blue-600/20"
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
                            <h3 className="text-center text-xl font-bold text-slate-900 dark:text-white">Delete your account?</h3>
                            <p className="mt-2 text-center text-slate-500 dark:text-slate-300">
                                This action is permanent and cannot be undone. All your trades, settings, and profile data will be forever lost.
                            </p>

                            <div className="mt-6 space-y-4">
                                <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                                    Please type <span className="font-bold text-slate-900 dark:text-white tracking-widest">DELETE</span> to confirm
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    className="w-full rounded-lg border border-gray-300 dark:border-border-default bg-gray-50 dark:bg-transparent px-4 py-3 text-center text-slate-900 dark:text-text-primary placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                                />

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteConfirmText("");
                                        }}
                                        disabled={isDeleting}
                                        className="flex-1 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-slate-800 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
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


export default SettingsPage;
