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
    FiChevronDown
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

const SettingsPage = () => {
    // Context
    const { user, updateUser, token, theme, setTheme } = useContext(UserContext);

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
    const getModeColor = (mode) => {
        switch (mode) {
            case "conservative": return "border-blue-500 text-blue-400";
            case "balanced": return "border-purple-500 text-purple-400";
            case "aggressive": return "border-red-500 text-red-500";
            default: return "border-gray-700 text-[var(--text-secondary)]";
        }
    };

    const getModeGradient = (mode) => {
        switch (mode) {
            case "conservative": return "from-blue-600/20 to-cyan-600/20";
            case "balanced": return "from-purple-600/20 to-indigo-600/20";
            case "aggressive": return "from-red-600/20 to-orange-600/20";
            default: return "";
        }
    }

    const tabs = [
        { id: "account", label: "Account", icon: FiUser },
        { id: "notifications", label: "Notifications", icon: FiBell },
        { id: "security", label: "Security", icon: FiLock },
        { id: "preferences", label: "Preferences", icon: FiSettings },
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
        <div className="min-h-screen p-4 text-[var(--text-primary)] md:p-8 font-sans">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="mt-1 text-[var(--text-secondary)]">Manage your account and preferences</p>
                    </div>
                </div>

                {/* Unsaved Changes Bar - Sticky */}
                {hasUnsavedChanges && (
                    <div className="sticky top-4 z-50 mb-6 flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-200">You have unsaved changes</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={discardChanges} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Discard</button>
                            <button
                                onClick={saveAllChanges}
                                disabled={saveStatus === "saving"}
                                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 disabled:opacity-50"
                            >
                                {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Save Feedback Toast (could be improved, but minimal inline for now) */}
                {saveStatus === "success" && !hasUnsavedChanges && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-green-400">
                        <FiCheck /> Changes saved successfully
                    </div>
                )}

                {saveStatus === "error" && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400">
                        <FiAlertCircle /> Failed to save changes
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[240px_1fr]">

                    {/* Sidebar Navigation */}
                    <nav className="flex flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-[var(--text-primary)] shadow-[0_0_24px_rgba(59,130,246,0.15)]"
                                    : "text-[var(--text-secondary)] hover:bg-[#0a0f1e]/70 hover:text-[var(--text-primary)] border border-transparent hover:border-white/[0.1] hover:shadow-lg hover:-translate-y-0.5"
                                    }`}
                            >
                                <tab.icon className={`h-5 w-5 transition-colors duration-300 ${activeTab === tab.id ? "text-blue-400" : "group-hover:text-blue-400"}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Main Content Area */}
                    <div className="rounded-2xl border border-white/[0.07] bg-[var(--bg-surface)] p-6 lg:p-8 shadow-xl shadow-black/5 backdrop-blur-sm">

                        {/* --- ACCOUNT TAB --- */}
                        {activeTab === "account" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-xl font-semibold">Profile Information</h2>
                                    <p className="text-sm text-[var(--text-secondary)]">Update your public profile and details</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-[2px]">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0d1226]">
                                            {formData.profileImage ? (
                                                <img src={formData.profileImage} alt="Profile" className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold">{formData.fullName?.[0]?.toUpperCase() || "U"}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/gif"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-sm font-medium text-blue-400 hover:text-blue-300"
                                        >
                                            Upload New Picture
                                        </button>
                                        <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. Max size 2MB.</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                                            className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:bg-[#0a0f1e]/80 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
                                            Email Address
                                            {isEmailVerified ? (
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                    <FiCheck className="text-[10px]" /> Verified
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20 flex items-center gap-1">
                                                    <FiAlertCircle className="text-[10px]" /> Unverified
                                                </span>
                                            )}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                value={formData.email}
                                                disabled // Not directly editable needs OTP flow trigger
                                                className="w-full cursor-not-allowed rounded-lg border border-white/[0.07] bg-[var(--input-bg)]/50 px-4 py-2.5 text-[var(--text-secondary)]"
                                            />
                                            <button
                                                onClick={() => setShowEmailChangeModal(true)}
                                                className="shrink-0 rounded-lg border border-white/[0.07] px-4 py-2 text-sm font-medium hover:bg-white/5 hover:border-white/[0.15] transition-all active:scale-95"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        {!isEmailVerified && (
                                            <div className="mt-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 animate-in fade-in slide-in-from-top-2 duration-500">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                        <FiShield className="text-blue-400 text-lg" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Verify your mail</p>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                                            Verifying your email allows us to send you clean trade alerts and critical security notifications.
                                                        </p>
                                                        <button
                                                            onClick={handleInitiateVerification}
                                                            disabled={verifyingEmail}
                                                            className="mt-3 text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
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

                                <div className="border-t border-white/[0.07] pt-8">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
                                        <FiLink2 className="text-blue-400" /> Broker Integration
                                    </h3>
                                    <div className="flex flex-col lg:flex-row gap-10">
                                        {/* Left Side: Configuration Form */}
                                        <div className="flex-1 space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium text-gray-300">Select Broker</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                                    {AVAILABLE_BROKERS.map((broker) => (
                                                        <button
                                                            key={broker.value}
                                                            type="button"
                                                            onClick={() => handleInputChange("broker", broker.value)}
                                                            className={`flex flex-col items-center gap-2 rounded-xl p-3 transition-all border ${formData.broker === broker.value
                                                                ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/10'
                                                                : 'bg-[#0a0f1e]/50 border-white/[0.07] hover:bg-[#0a0f1e]/70 hover:border-white/[0.15] hover:shadow-lg hover:-translate-y-0.5'
                                                                }`}
                                                        >
                                                            <div className="h-10 w-10 flex items-center justify-center p-1">
                                                                {broker.image ? (
                                                                    <img src={broker.image} alt={broker.label} className="h-full w-full object-contain filter drop-shadow-md" />
                                                                ) : (
                                                                    <span className="text-xl">{broker.icon}</span>
                                                                )}
                                                            </div>
                                                            <span className={`text-[10px] font-bold tracking-tight text-center transition-colors uppercase ${formData.broker === broker.value ? 'text-blue-400' : 'text-gray-500'}`}>
                                                                {broker.label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                {formData.broker && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        <label className="text-sm font-medium text-gray-300">API Key</label>
                                                        <input
                                                            type="password"
                                                            value={formData.apiKey}
                                                            onChange={(e) => handleInputChange("apiKey", e.target.value)}
                                                            placeholder="Enter your broker API key"
                                                            className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-200"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {formData.broker && (
                                                <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">API Secret</label>
                                                        <input
                                                            type="password"
                                                            value={formData.apiSecret}
                                                            onChange={(e) => handleInputChange("apiSecret", e.target.value)}
                                                            placeholder="Enter your broker API secret"
                                                            className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Client ID</label>
                                                        <input
                                                            type="text"
                                                            value={formData.clientId}
                                                            onChange={(e) => handleInputChange("clientId", e.target.value)}
                                                            placeholder="Your broker client ID"
                                                            className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {formData.broker && (
                                                <div className="space-y-4">
                                                    <p className="text-xs text-[var(--text-secondary)]">
                                                        {formData.broker === 'zerodha' && (
                                                            <a href="https://kite.trade/docs/connect/v3/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                                How to get Zerodha API credentials →
                                                            </a>
                                                        )}
                                                        {formData.broker === 'upstox' && (
                                                            <a href="https://upstox.com/developer/api-documentation/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                                How to get Upstox API credentials →
                                                            </a>
                                                        )}
                                                        {formData.broker === 'angelone' && (
                                                            <a href="https://smartapi.angelbroking.com/docs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                                How to get Angel One API credentials →
                                                            </a>
                                                        )}
                                                    </p>

                                                    {/* Test Connection Button */}
                                                    <button
                                                        type="button"
                                                        onClick={testBrokerConnection}
                                                        disabled={!formData.broker || !formData.apiKey || !formData.apiSecret || testingConnection}
                                                        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-[var(--text-primary)] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
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
                                                                    <FiCheck className="text-green-400 text-xl flex-shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <FiAlertCircle className="text-red-400 text-xl flex-shrink-0 mt-0.5" />
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className={`text-sm font-medium ${connectionStatus.success ? 'text-green-400' : 'text-red-400'
                                                                        }`}>
                                                                        {connectionStatus.message}
                                                                    </p>
                                                                    {connectionStatus.requiresOAuth && (
                                                                        <button
                                                                            onClick={() => window.open(connectionStatus.loginUrl, '_blank')}
                                                                            className="mt-2 text-xs text-blue-400 hover:underline"
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
                                        <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border-main)] pt-10 lg:pt-0 lg:pl-10">
                                            <div className="sticky top-6">
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                                    <div className="h-px flex-1 bg-white/5"></div>
                                                    Active Connections
                                                    <div className="h-px flex-1 bg-white/5"></div>
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
                                                        <div className="rounded-2xl border border-dashed border-[var(--border-main)] p-8 text-center bg-white/[0.01]">
                                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-3">
                                                                <FiLink2 className="text-gray-600 text-xl" />
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-medium">No brokers connected yet</p>
                                                            <p className="text-[10px] text-gray-600 mt-1">Configure your broker on the left to start trading</p>
                                                        </div>
                                                    )}


                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/[0.07] pt-8">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-red-500">
                                        <FiAlertCircle className="text-red-500" /> Danger Zone
                                    </h3>
                                    <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)]">Delete Account</p>
                                                <p className="text-sm text-[var(--text-secondary)]">Permanently remove your account and all associated data. This action cannot be undone.</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="shrink-0 rounded-lg bg-red-600/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-600 hover:text-[var(--text-primary)] transition-all shadow-lg shadow-red-500/5"
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
                                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[var(--glass-bg)] p-4 transition-all hover:border-white/[0.15] hover:bg-white/[0.05]">
                                            <div>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => handleSettingToggle(item.id)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.id] ? "bg-blue-600" : "bg-gray-700"}`}
                                            >
                                                <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${settings[item.id] ? "translate-x-5" : ""}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Delivery Channels</h3>
                                <div className="space-y-4">
                                    {[
                                        { id: "deliveryApp", label: "In-App Push", icon: FiBell },
                                        { id: "deliveryEmail", label: "Email Digest", icon: FiUser }, // Using user icon as placeholder for email or generically
                                    ].map(item => (
                                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[var(--glass-bg)] p-4 transition-all hover:border-white/[0.15] hover:bg-white/[0.05]">
                                            <div className="flex items-center gap-3">
                                                <item.icon className="text-[var(--text-secondary)]" />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <button
                                                onClick={() => handleSettingToggle(item.id)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.id] ? "bg-blue-600" : "bg-gray-700"}`}
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
                                    <p className="text-sm text-[var(--text-secondary)]">Manage your password and account security</p>
                                </div>

                                <div className="rounded-xl border border-white/[0.07] bg-[var(--input-bg)]/50 p-6">
                                    <h3 className="mb-4 text-lg font-medium">Update Password</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-300">Current Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-2.5 focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                            />
                                        </div>
                                    </div>

                                    {passwordChangeStatus && (
                                        <div className={`mt-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${passwordChangeStatus.type === 'success'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                            }`}>
                                            {passwordChangeStatus.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                                            {passwordChangeStatus.message}
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleUpdatePassword}
                                            disabled={isUpdatingPassword}
                                            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-blue-500 disabled:opacity-50"
                                        >
                                            {isUpdatingPassword ? "Updating..." : "Update Password"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* --- PREFERENCES TAB --- */}
                        {activeTab === "preferences" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-xl font-semibold">User Preferences</h2>
                                    <p className="text-sm text-[var(--text-secondary)]">Customize your trading experience</p>
                                </div>

                                {/* Trading Mode */}
                                <div>
                                    <h3 className="mb-4 text-sm font-medium text-gray-300">Trading Mode</h3>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {[
                                            { id: "conservative", label: "Conservative", icon: FiShield, desc: "Low-risk defaults, safety first" },
                                            { id: "balanced", label: "Balanced", icon: FiTrendingUp, desc: "Standard risk-reward ratio" },
                                            { id: "aggressive", label: "Aggressive", icon: FiZap, desc: "High-risk, max leverage" }
                                        ].map(mode => {
                                            const isActive = settings.tradingMode === mode.id;
                                            return (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => handleTradingModeSelect(mode.id)}
                                                    className={`group relative flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all duration-300 ${isActive
                                                        ? `${getModeColor(mode.id)} border-transparent bg-gradient-to-b ${getModeGradient(mode.id)} ring-1 ring-white/10 shadow-[0_0_24px_rgba(59,130,246,0.15)]`
                                                        : "border-white/[0.07] bg-[var(--input-bg)]/50 hover:border-white/[0.15] hover:bg-white/[0.05] hover:shadow-lg hover:-translate-y-0.5"
                                                        }`}
                                                >
                                                    <mode.icon className={`h-8 w-8 transition-colors duration-300 ${isActive ? "text-[var(--text-primary)]" : "text-gray-500 group-hover:text-[var(--text-secondary)]"}`} />
                                                    <div>
                                                        <p className={`font-semibold transition-colors duration-300 ${isActive ? "text-[var(--text-primary)]" : "text-gray-300"}`}>{mode.label}</p>
                                                        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Theme Toggle */}
                                <div className="pt-4">
                                    <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">Appearance</h3>
                                    <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[var(--glass-bg)] p-4">
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)]">Theme Preference</p>
                                            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <FiInfo className="text-blue-400" />
                                                {theme === 'dark' ? 'Dark mode is recommended for focus & reduced eye strain' : 'Light mode provides better readability in bright environments'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-[var(--input-bg)] p-1 rounded-lg border border-white/[0.07]">
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all ${theme === 'light' ? "bg-blue-600 text-[var(--text-primary)] font-medium shadow-md shadow-blue-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                    }`}
                                            >
                                                <FiSun /> Light
                                            </button>
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all ${theme === 'dark' ? "bg-[#1e293b] text-[var(--text-primary)] font-medium shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                    }`}
                                            >
                                                <FiMoon /> Dark
                                            </button>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0d1226] p-6 shadow-2xl">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                                <FiAlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-center text-xl font-bold text-[var(--text-primary)]">Aggressive Mode Warning</h3>
                            <p className="mt-2 text-center text-[var(--text-secondary)]">
                                This mode increases trading risk significantly and is recommended only for experienced traders. Are you sure you want to proceed?
                            </p>
                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => setShowAggressiveWarning(false)}
                                    className="flex-1 rounded-lg border border-white/[0.07] py-2.5 font-medium text-gray-300 hover:bg-white/5 hover:border-white/[0.15] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAggressiveMode}
                                    className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-[var(--text-primary)] hover:bg-red-500"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-[#0d1226] p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Change Email Address</h3>
                                <button onClick={() => setShowEmailOtpModal(false)}><FiX className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                            </div>

                            {!pendingEmail ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-[var(--text-secondary)]">Enter your new email address. We will send a verification code.</p>
                                    <input
                                        type="email"
                                        placeholder="New Email Address"
                                        className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') initiateEmailChange(e.currentTarget.value)
                                        }}
                                    />
                                    <button
                                        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-[var(--text-primary)] hover:bg-blue-500"
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
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Enter the 6-digit code sent to <span className="text-[var(--text-primary)] font-medium">{pendingEmail}</span>
                                    </p>
                                    <input
                                        type="text"
                                        value={emailOtp}
                                        maxLength={6}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000 000"
                                        className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-3 text-center text-xl tracking-widest text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Expires in 5:00</span>
                                        {otpTimer > 0 ? (
                                            <span>Resend in {otpTimer}s</span>
                                        ) : (
                                            <button className="text-blue-400 hover:underline">Resend Code</button>
                                        )}
                                    </div>
                                    <button
                                        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-[var(--text-primary)] hover:bg-blue-500 disabled:opacity-50"
                                        disabled={emailOtp.length !== 6}
                                        onClick={verifyEmailChange}
                                    >
                                        Verify & Update
                                    </button>
                                    <button
                                        onClick={() => setPendingEmail("")}
                                        className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-[#0d1226] p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Verify Email</h3>
                                <button onClick={() => setShowVerifyEmailOtpModal(false)}><FiX className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm" /></button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Enter the 6-digit code sent to your email to enable trade alerts.
                                </p>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={emailOtp}
                                        maxLength={6}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000 000"
                                        className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-[var(--text-primary)]/5"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                                    <span>5:00 MINUTES UNTIL EXPIRE</span>
                                    {otpTimer > 0 ? (
                                        <span>RESEND IN {otpTimer}S</span>
                                    ) : (
                                        <button onClick={handleInitiateVerification} className="text-blue-400 hover:underline">RESEND NOW</button>
                                    )}
                                </div>
                                <button
                                    className="w-full rounded-lg bg-[#1E1BFF] py-3.5 font-bold text-[var(--text-primary)] hover:bg-[#1720cc] disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl border border-blue-500/20 bg-[#0d1226] p-6 shadow-2xl">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                                <FiAlertCircle className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-center text-xl font-bold text-[var(--text-primary)]">Change Email Address</h3>
                            <p className="mt-2 text-center text-[var(--text-secondary)] text-sm">
                                Enter your new email address. We'll send you a verification code to confirm the change.
                            </p>

                            <div className="mt-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">New Email Address</label>
                                    <input
                                        type="email"
                                        value={pendingEmail}
                                        onChange={(e) => setPendingEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowEmailChangeModal(false);
                                            setPendingEmail("");
                                        }}
                                        className="flex-1 rounded-lg border border-white/[0.07] py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-all hover:border-white/[0.15]"
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
                                        className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/20"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0d1226] p-6 shadow-2xl">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                                <FiAlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-center text-xl font-bold text-[var(--text-primary)]">Delete your account?</h3>
                            <p className="mt-2 text-center text-[var(--text-secondary)]">
                                This action is permanent and cannot be undone. All your trades, settings, and profile data will be forever lost.
                            </p>

                            <div className="mt-6 space-y-4">
                                <p className="text-sm text-center text-gray-300">
                                    Please type <span className="font-bold text-[var(--text-primary)] tracking-widest">DELETE</span> to confirm
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    className="w-full rounded-lg border border-white/[0.07] bg-[var(--input-bg)] px-4 py-3 text-center text-[var(--text-primary)] focus:border-red-500/50 focus:outline-none focus:shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                />

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteConfirmText("");
                                        }}
                                        disabled={isDeleting}
                                        className="flex-1 rounded-lg border border-white/[0.07] py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-all hover:border-white/[0.15]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirmText !== "DELETE" || isDeleting}
                                        className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-red-500 disabled:opacity-50 shadow-lg shadow-red-600/20"
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
            className="w-full text-left group relative flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] to-transparent p-4 transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.05] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-wait"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/[0.07] group-hover:border-blue-500/20 transition-all">
                {loading ? (
                    <div className="animate-spin text-blue-400">
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
                    <p className="font-semibold text-[var(--text-primary)] truncate">{brokerInfo.label}</p>
                    <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-blue-400' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5 truncate uppercase tracking-tighter">ID: {clientId || 'ID_UNKNOWN'}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 whitespace-nowrap">
                    {loading ? 'CONNECTING' : 'CONNECT'}
                </div>
            </div>
        </button>
    );
};

export default SettingsPage;
