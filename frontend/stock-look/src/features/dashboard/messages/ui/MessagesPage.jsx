/**
 * @file MessagesPage.jsx
 * @purpose The main container for the Messages feature.
 * @responsibilities
 * - Manages state for filters, search, and active messages.
 * - Displays the categorized list of messages.
 * - Handles message selection and modal display.
 * @key_exports
 * - MessagesPage (Default Component)
 * @dependencies
 * - React, useState, useMemo
 * - react-icons/fi
 * - MessageCard, MessageDetailModal (Sub-components)
 * - messagesData (Data Source)
 * @lifecycle
 * - Main route for /dashboard/messages.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useState, useMemo } from "react";
import {
    FiBell,
    FiAlertTriangle,
    FiCheckCircle,
    FiSearch,
} from "react-icons/fi";
import { MOCK_MESSAGES, MESSAGE_CATEGORIES, QUICK_FILTERS } from "../data/messagesData";
import MessageCard from "./MessageCard";
import MessageDetailModal from "./MessageDetailModal";

// =============================
// Component
// =============================

const MessagesPage = () => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [pinnedIds, setPinnedIds] = useState([]);

    // =============================
    // Data & Filtering Logic
    // =============================

    const messages = MOCK_MESSAGES;
    const categories = MESSAGE_CATEGORIES.map(cat => ({
        ...cat,
        count: cat.filterFn ? messages.filter(cat.filterFn).length : messages.length
    }));

    const filteredMessages = useMemo(() => {
        let result = messages;
        if (activeCategory !== "all") {
            result = result.filter((m) => m.category === activeCategory);
        }

        if (activeFilter === "unread") {
            result = result.filter((m) => !m.read);
        } else if (activeFilter === "today") {
            const today = new Date().setHours(0, 0, 0, 0);
            result = result.filter((m) => m.timestamp >= today);
        } else if (activeFilter === "priority") {
            result = result.filter((m) => m.priority === "critical" || m.priority === "high");
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (m) =>
                    m.title.toLowerCase().includes(query) ||
                    m.description.toLowerCase().includes(query) ||
                    m.metadata?.symbol?.toLowerCase().includes(query)
            );
        }

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

    // =============================
    // Helpers & Handlers
    // =============================

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

    // =============================
    // Render Layer
    // =============================

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-semibold text-text-primary mb-2 tracking-tight">Messages</h1>
                            <p className="text-sm text-text-secondary">
                                {unreadCount > 0 ? (
                                    <>
                                        <span className="text-blue-500 font-medium">{unreadCount} unread</span>
                                        {criticalCount > 0 && (
                                            <>
                                                {" · "}
                                                <span className="text-red-500 font-medium">
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
                        <button className="px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary transition-all duration-200 flex items-center gap-2 border border-border-default rounded-lg hover:bg-background-surface hover:border-border-default active:scale-95">
                            <FiCheckCircle className="text-sm" />
                            Mark all as read
                        </button>
                    </div>

                    {/* AI Summary */}
                    {criticalCount > 0 && (
                        <div className="bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/30 rounded-xl p-4 mb-5 shadow-lg shadow-red-500/10">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                    <FiAlertTriangle className="text-red-500 text-base" />
                                </div>
                                <div>
                                    <p className="text-sm text-text-primary font-medium leading-relaxed">
                                        {criticalCount} important alert{criticalCount > 1 ? "s" : ""} need your
                                        attention today
                                    </p>
                                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                                        Review critical market movements and portfolio changes
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-blue-500 transition-colors duration-200" />
                        <input
                            type="text"
                            placeholder="Search by symbol, keyword, or order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-background-card border border-border-default rounded-xl text-text-primary text-sm placeholder-text-tertiary focus:outline-none focus:border-blue-500 focus:bg-background-card transition-all duration-200 focus:shadow-lg focus:shadow-blue-500/10"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-1 space-y-5">
                        {/* Categories */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-2">
                                Categories
                            </h3>
                            <div className="space-y-1">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive = activeCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`
                                                w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium
                                                transition-all duration-300 group
                                                ${isActive
                                                    ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 text-blue-600 shadow-md shadow-blue-500/10"
                                                    : "text-text-secondary hover:bg-background-surface hover:text-text-primary border border-transparent hover:border-border-default hover:shadow-sm hover:-translate-y-0.5"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`text-base transition-colors duration-300 ${isActive ? "text-blue-500" : "group-hover:text-blue-500"}`} />
                                                <span>{cat.label}</span>
                                            </div>
                                            {cat.count > 0 && (
                                                <span
                                                    className={`
                                                        px-2 py-0.5 rounded text-[10px] font-bold transition-all duration-300
                                                        ${isActive
                                                            ? "bg-blue-500/20 text-blue-600"
                                                            : "bg-background-surface text-text-tertiary group-hover:bg-background-card group-hover:text-text-secondary"
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
                        <div className="space-y-2 mt-8">
                            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-2">
                                Quick Filters
                            </h3>
                            <div className="space-y-1">
                                {QUICK_FILTERS.map((filter) => {
                                    const isActive = activeFilter === filter.id;
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => setActiveFilter(filter.id)}
                                            className={`
                                                w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium
                                                transition-all duration-300 group
                                                ${isActive
                                                    ? "bg-background-card text-text-primary border border-border-default shadow-sm"
                                                    : "text-text-secondary hover:text-text-primary hover:bg-background-surface border border-transparent hover:border-border-default hover:-translate-y-0.5"
                                                }
                                            `}
                                        >
                                            {filter.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-3">
                        {filteredMessages.length === 0 ? (
                            <div className="bg-background-card backdrop-blur-xl rounded-xl border border-border-default p-20 text-center shadow-lg">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border-default flex items-center justify-center mx-auto mb-5">
                                    <FiBell className="text-4xl text-text-tertiary" />
                                </div>
                                <p className="text-text-secondary text-sm font-medium mb-2">
                                    {searchQuery ? "No messages match your search" : "All caught up!"}
                                </p>
                                <p className="text-text-tertiary text-xs">
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

export default MessagesPage;
