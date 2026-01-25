import React, { useState, useMemo } from "react";
import {
    FiBell,
    FiAlertTriangle,
    FiInfo,
    FiCheckCircle,
    FiTrendingUp,
    FiActivity,
    FiSearch,
    FiFilter,
    FiStar,
    FiX,
    FiBarChart2,
    FiFileText,
    FiPieChart,
} from "react-icons/fi";

const MessagesPage = () => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [pinnedIds, setPinnedIds] = useState([]);

    // Enhanced mock messages data with priority and rich metadata
    const messages = [
        {
            id: 1,
            category: "alerts",
            priority: "critical",
            title: "NIFTY 50 Resistance Breakout",
            description: "Crossed key resistance level with strong volume",
            content: "NIFTY 50 has broken above the critical resistance level at ₹20,850 with 15% higher than average volume. This could signal a continuation of the uptrend. Consider reviewing your positions and stop-loss levels.",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: false,
            icon: FiAlertTriangle,
            metadata: {
                symbol: "NIFTY 50",
                level: "₹20,850",
                change: "+1.2%",
                volume: "+15%",
            },
            actions: [
                { label: "View Chart", icon: FiBarChart2 },
                { label: "Create Alert", icon: FiBell },
            ],
        },
        {
            id: 2,
            category: "notifications",
            priority: "normal",
            title: "Trade Executed Successfully",
            description: "Buy order filled at market price",
            content: "Your buy order for 100 shares of RELIANCE at ₹2,450 has been executed successfully. Order ID: #REL2450100. Total value: ₹2,45,000.",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            read: false,
            icon: FiCheckCircle,
            metadata: {
                symbol: "RELIANCE",
                qty: "100",
                price: "₹2,450",
                value: "₹2,45,000",
            },
            actions: [
                { label: "View Order", icon: FiFileText },
                { label: "View Holdings", icon: FiPieChart },
            ],
        },
        {
            id: 3,
            category: "alerts",
            priority: "high",
            title: "Portfolio Alert: Daily Gain",
            description: "Strong performance across holdings",
            content: "Your portfolio has gained 5.2% today, outperforming NIFTY 50 by 3.8%. Current value: ₹8,45,230. Top performers: TCS (+8.2%), INFY (+6.5%), RELIANCE (+4.1%).",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            read: false,
            icon: FiTrendingUp,
            metadata: {
                change: "+5.2%",
                value: "₹8,45,230",
                gainToday: "+₹41,850",
                outperformance: "+3.8%",
            },
            actions: [{ label: "View Portfolio", icon: FiPieChart }],
        },
        {
            id: 4,
            category: "notifications",
            priority: "normal",
            title: "Dividend Credited",
            description: "Quarterly dividend from TCS",
            content: "Dividend of ₹1,250 from TCS has been credited to your trading account. Ex-dividend date: Jan 20, 2026. Record date: Jan 22, 2026.",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            read: true,
            icon: FiCheckCircle,
            metadata: {
                symbol: "TCS",
                amount: "₹1,250",
                type: "Quarterly",
            },
            actions: [],
        },
        {
            id: 5,
            category: "system",
            priority: "low",
            title: "Scheduled System Maintenance",
            description: "Brief downtime this weekend",
            content: "Scheduled maintenance will occur on Sunday, 2:00 AM - 4:00 AM IST. Trading will be unavailable during this period. Please plan accordingly.",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            read: true,
            icon: FiInfo,
            metadata: {
                date: "Sunday, Jan 26",
                time: "2:00 AM - 4:00 AM IST",
            },
            actions: [],
        },
        {
            id: 6,
            category: "alerts",
            priority: "critical",
            title: "Stop Loss Triggered",
            description: "Position auto-closed to limit loss",
            content: "Your stop loss order for HDFC BANK at ₹1,580 has been triggered. 50 shares sold at ₹1,578. Total loss: ₹110. Position closed to protect capital.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            read: true,
            icon: FiAlertTriangle,
            metadata: {
                symbol: "HDFC BANK",
                qty: "50",
                price: "₹1,578",
                loss: "-₹110",
            },
            actions: [{ label: "View Order", icon: FiFileText }],
        },
    ];

    // Categories with icons
    const categories = [
        {
            id: "all",
            label: "All Messages",
            icon: FiBell,
            count: messages.length,
        },
        {
            id: "alerts",
            label: "Alerts",
            icon: FiAlertTriangle,
            count: messages.filter((m) => m.category === "alerts").length,
        },
        {
            id: "notifications",
            label: "Notifications",
            icon: FiCheckCircle,
            count: messages.filter((m) => m.category === "notifications").length,
        },
        {
            id: "system",
            label: "System",
            icon: FiInfo,
            count: messages.filter((m) => m.category === "system").length,
        },
    ];

    // Quick filters
    const quickFilters = [
        { id: "all", label: "All" },
        { id: "unread", label: "Unread" },
        { id: "today", label: "Today" },
        { id: "priority", label: "High Priority" },
    ];

    // Filter and search logic
    const filteredMessages = useMemo(() => {
        let result = messages;

        // Category filter
        if (activeCategory !== "all") {
            result = result.filter((m) => m.category === activeCategory);
        }

        // Quick filter
        if (activeFilter === "unread") {
            result = result.filter((m) => !m.read);
        } else if (activeFilter === "today") {
            const today = new Date().setHours(0, 0, 0, 0);
            result = result.filter((m) => m.timestamp >= today);
        } else if (activeFilter === "priority") {
            result = result.filter((m) => m.priority === "critical" || m.priority === "high");
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (m) =>
                    m.title.toLowerCase().includes(query) ||
                    m.description.toLowerCase().includes(query) ||
                    m.metadata?.symbol?.toLowerCase().includes(query)
            );
        }

        // Sort: pinned first, then by priority, then by timestamp
        result.sort((a, b) => {
            const aPinned = pinnedIds.includes(a.id);
            const bPinned = pinnedIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;

            const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }

            return b.timestamp - a.timestamp;
        });

        return result;
    }, [messages, activeCategory, activeFilter, searchQuery, pinnedIds]);

    const unreadCount = messages.filter((m) => !m.read).length;
    const criticalCount = messages.filter((m) => m.priority === "critical" && !m.read).length;

    const togglePin = (id) => {
        setPinnedIds((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        return `${days}d ago`;
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case "critical":
                return {
                    border: "border-l-4 border-l-red-500/70",
                    bg: "bg-red-500/[0.07]",
                    glow: "",
                };
            case "high":
                return {
                    border: "border-l-4 border-l-amber-500/70",
                    bg: "bg-amber-500/[0.07]",
                    glow: "",
                };
            default:
                return { border: "", bg: "", glow: "" };
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">Messages</h1>
                            <p className="text-sm text-gray-400">
                                {unreadCount > 0 ? (
                                    <>
                                        <span className="text-blue-400 font-medium">{unreadCount} unread</span>
                                        {criticalCount > 0 && (
                                            <>
                                                {" · "}
                                                <span className="text-red-400 font-medium">
                                                    {criticalCount} need attention
                                                </span>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    "You're all caught up"
                                )}
                            </p>
                        </div>
                        <button className="px-4 py-2.5 text-xs text-gray-400 hover:text-white transition-all duration-200 flex items-center gap-2 border border-white/10 rounded-lg hover:bg-white/[0.07] hover:border-white/20 active:scale-95">
                            <FiCheckCircle className="text-sm" />
                            Mark all as read
                        </button>
                    </div>

                    {/* AI Summary */}
                    {criticalCount > 0 && (
                        <div className="bg-gradient-to-r from-red-500/[0.12] to-amber-500/[0.12] border border-red-500/30 rounded-xl p-4 mb-5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                    <FiAlertTriangle className="text-red-400 text-base" />
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium leading-relaxed">
                                        {criticalCount} important alert{criticalCount > 1 ? "s" : ""} need your
                                        attention today
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                                        Review critical market movements and portfolio changes
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors duration-200" />
                        <input
                            type="text"
                            placeholder="Search by symbol, keyword, or order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-[#0a0f1e]/60 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-[#0a0f1e]/80 transition-all duration-200 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-1 space-y-5">
                        {/* Categories */}
                        <div className="bg-[#0a0f1e]/50 backdrop-blur-xl rounded-xl border border-white/[0.07] p-3.5 shadow-lg">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3.5 px-2">
                                Categories
                            </h3>
                            <div className="space-y-1.5">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive = activeCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`
                        w-full flex items-center justify-between px-3.5 py-3 rounded-lg
                        transition-all duration-300 group
                        ${isActive
                                                    ? "bg-gradient-to-r from-blue-600/25 to-purple-600/25 text-white shadow-[0_0_24px_rgba(59,130,246,0.2)] border border-blue-500/30"
                                                    : "text-gray-400 hover:text-white hover:bg-white/[0.07] border border-transparent hover:border-white/10"
                                                }
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`text-base transition-colors duration-300 ${isActive ? "text-blue-400" : "group-hover:text-blue-400"}`} />
                                                <span className="text-sm font-medium">{cat.label}</span>
                                            </div>
                                            {cat.count > 0 && (
                                                <span
                                                    className={`
                          px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-300
                          ${isActive
                                                            ? "bg-blue-500/30 text-blue-200"
                                                            : "bg-white/[0.07] text-gray-500 group-hover:bg-white/10 group-hover:text-gray-400"
                                                        }
                        `}
                                                >
                                                    {cat.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Filters */}
                        <div className="bg-[#0a0f1e]/50 backdrop-blur-xl rounded-xl border border-white/[0.07] p-3.5 shadow-lg">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3.5 px-2">
                                Quick Filters
                            </h3>
                            <div className="space-y-1.5">
                                {quickFilters.map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id)}
                                        className={`
                      w-full text-left px-3.5 py-2.5 rounded-lg text-sm
                      transition-all duration-300
                      ${activeFilter === filter.id
                                                ? "bg-white/[0.12] text-white font-medium shadow-sm"
                                                : "text-gray-400 hover:text-white hover:bg-white/[0.07]"
                                            }
                    `}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-3">
                        {filteredMessages.length === 0 ? (
                            <div className="bg-[#0a0f1e]/50 backdrop-blur-xl rounded-xl border border-white/[0.07] p-20 text-center shadow-lg">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center mx-auto mb-5">
                                    <FiBell className="text-4xl text-gray-600" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium mb-2">
                                    {searchQuery ? "No messages match your search" : "All caught up!"}
                                </p>
                                <p className="text-gray-500 text-xs">
                                    {searchQuery
                                        ? "Try adjusting your search terms"
                                        : "We'll notify you when something important happens"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredMessages.map((message, index) => {
                                    const Icon = message.icon;
                                    const priorityStyles = getPriorityStyles(message.priority);
                                    const isPinned = pinnedIds.includes(message.id);

                                    return (
                                        <MessageCard
                                            key={message.id}
                                            message={message}
                                            Icon={Icon}
                                            priorityStyles={priorityStyles}
                                            isPinned={isPinned}
                                            onTogglePin={() => togglePin(message.id)}
                                            onClick={() => setSelectedMessage(message)}
                                            formatTimestamp={formatTimestamp}
                                            index={index}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Detail Modal */}
                {selectedMessage && (
                    <MessageDetailModal
                        message={selectedMessage}
                        onClose={() => setSelectedMessage(null)}
                        formatTimestamp={formatTimestamp}
                    />
                )}
            </div>
        </div>
    );
};

// Message Card Component
const MessageCard = ({
    message,
    Icon,
    priorityStyles,
    isPinned,
    onTogglePin,
    onClick,
    formatTimestamp,
    index,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`
        bg-[#0a0f1e]/50 backdrop-blur-xl rounded-lg border border-white/[0.07]
        p-3 cursor-pointer transition-all duration-300 group
        hover:bg-[#0a0f1e]/70 hover:border-white/[0.15]
        hover:shadow-lg hover:-translate-y-0.5
        ${priorityStyles.border} ${priorityStyles.bg} ${priorityStyles.glow}
        ${!message.read ? "ring-1 ring-blue-500/25 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : ""}
        animate-in fade-in slide-in-from-bottom-4 duration-500
      `}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={`
          w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
          bg-gradient-to-br from-white/10 to-white/5 border border-white/10
          transition-all duration-300 group-hover:scale-105
          ${message.priority === "critical" ? "bg-red-500/15 border-red-500/30" : ""}
          ${message.priority === "high" ? "bg-amber-500/15 border-amber-500/30" : ""}
        `}
                >
                    <Icon
                        className={`text-base transition-all duration-300 ${message.priority === "critical"
                            ? "text-red-400"
                            : message.priority === "high"
                                ? "text-amber-400"
                                : message.category === "alerts"
                                    ? "text-blue-400"
                                    : message.category === "notifications"
                                        ? "text-green-400"
                                        : "text-gray-400"
                            }`}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                            <h3
                                className={`font-semibold text-sm transition-colors duration-200 ${!message.read ? "text-white" : "text-gray-300 group-hover:text-white"
                                    }`}
                            >
                                {message.title}
                            </h3>
                            {isPinned && (
                                <FiStar className="text-blue-400 text-[10px] fill-blue-400 animate-in zoom-in duration-300" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 whitespace-nowrap font-medium">
                                {formatTimestamp(message.timestamp)}
                            </span>
                            {!message.read && (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            )}
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-400 mb-2 line-clamp-1 leading-relaxed">
                        {message.description}
                    </p>

                    {/* Metadata Pills */}
                    {message.metadata && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {Object.entries(message.metadata).slice(0, 3).map(([key, value]) => (
                                <span
                                    key={key}
                                    className="px-2 py-1 bg-white/[0.06] border border-white/10 rounded-md text-[11px] text-gray-300 font-mono transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                                >
                                    {value}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Message Detail Modal Component
const MessageDetailModal = ({ message, onClose, formatTimestamp }) => {
    const Icon = message.icon;

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-[#0a0f1e] border border-white/[0.12] rounded-2xl max-w-2xl w-full p-7 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-7">
                    <div className="flex items-center gap-4">
                        <div
                            className={`
              w-14 h-14 rounded-xl flex items-center justify-center
              bg-gradient-to-br from-white/10 to-white/5 border border-white/[0.12]
              shadow-lg
            `}
                        >
                            <Icon className="text-2xl text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white tracking-tight">{message.title}</h2>
                            <p className="text-xs text-gray-400 mt-1 font-medium">
                                {formatTimestamp(message.timestamp)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-all duration-200 p-1.5 hover:bg-white/10 rounded-lg active:scale-90"
                    >
                        <FiX className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="bg-[#02050e]/60 rounded-xl p-5 border border-white/[0.07] mb-6 shadow-inner">
                    <p className="text-sm text-gray-300 leading-relaxed">{message.content}</p>
                </div>

                {/* Metadata */}
                {message.metadata && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {Object.entries(message.metadata).map(([key, value]) => (
                            <div key={key} className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.07] hover:bg-white/[0.09] transition-all duration-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="text-sm text-white font-semibold font-mono">{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {message.actions.map((action, idx) => {
                        const ActionIcon = action.icon;
                        return (
                            <button
                                key={idx}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-95"
                            >
                                <ActionIcon className="text-base" />
                                {action.label}
                            </button>
                        );
                    })}
                    <button className="px-5 py-3 bg-white/[0.07] hover:bg-white/[0.12] text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95">
                        Mark as Read
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
