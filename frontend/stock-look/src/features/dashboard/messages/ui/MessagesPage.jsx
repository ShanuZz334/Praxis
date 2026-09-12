/**
 * @file MessagesPage.jsx
 * @purpose The main container for the Messages feature.
 * @responsibilities
 * - Manages state for filters, search, and active messages.
 * - Displays the categorized list of messages (Empty initially).
 * - Handles message selection and modal display.
 * @key_exports
 * - MessagesPage (Default Component)
 * @lifecycle
 * - Main route for /dashboard/messages.
 */

import React, { useState, useMemo } from "react";
import {
    FiBell,
    FiAlertTriangle,
    FiCheckCircle,
    FiSearch,
    FiTrash2,
} from "react-icons/fi";
import MessageCard from "./MessageCard";
import MessageDetailModal from "./MessageDetailModal";
import { useNotificationStore } from "@/shared/context/NotificationContext";

const MESSAGE_CATEGORIES = [
    { id: "all", label: "All Messages" },
    { id: "alerts", label: "System Alerts" },
    { id: "updates", label: "Updates" }
];

const QUICK_FILTERS = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "pinned", label: "Pinned" }
];

const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins || 1}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getMessageStyles = (msg) => {
    let Icon = FiBell;
    let priorityStyles = { border: 'border-border-default', bg: 'bg-background-card', glow: '' };
    
    if (msg.priority === 'critical') {
        Icon = FiAlertTriangle;
        priorityStyles = { border: 'border-red-500/30', bg: 'bg-red-500/5', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.1)]' };
    } else if (msg.priority === 'high') {
        Icon = FiAlertTriangle;
        priorityStyles = { border: 'border-amber-500/30', bg: 'bg-amber-500/5', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' };
    } else if (msg.category === 'updates') {
        Icon = FiCheckCircle;
    }
    
    return { Icon, priorityStyles };
};

export default function MessagesPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [pinnedIds, setPinnedIds] = useState([]);

    const { notifications, removeNotification, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotificationStore();

    // Map notifications to the format expected by the page
    const messages = notifications.map(n => ({
        ...n,
        // Ensure required fields exist if they were omitted
        category: n.category || 'alerts',
        priority: n.priority || 'normal',
    }));

    const categories = MESSAGE_CATEGORIES.map(cat => ({
        ...cat,
        count: cat.id === 'all' 
            ? messages.length 
            : messages.filter(m => m.category === cat.id).length
    }));

    const filteredMessages = messages.filter(msg => {
        if (activeCategory !== "all" && msg.category !== activeCategory) return false;
        if (activeFilter === "unread" && msg.read) return false;
        if (activeFilter === "pinned" && !pinnedIds.includes(msg.id)) return false;
        if (searchQuery && !msg.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !msg.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handlePin = (id, e) => {
        e.stopPropagation();
        setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] px-4 md:px-6 pt-4 animate-in fade-in duration-500 w-full text-text-primary">
            {/* 1. Header & Global Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                <div className="flex items-center gap-3.5">
                    {/* Bell Icon with live notification badge */}
                    <div className="relative p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                        <FiBell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm ring-2 ring-background-app tabular-nums animate-in zoom-in-50 duration-200">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
                                Inbox &amp; Alerts
                            </h1>
                            {unreadCount > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    {unreadCount} Unread
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-text-tertiary mt-0.5">Real-time system notifications and AI telemetry insights</p>
                    </div>
                </div>

                {/* Quick actions: Mark all read / Clear all */}
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-500 hover:bg-blue-500/10 border border-blue-500/20 transition-all active:scale-95 cursor-pointer"
                            title="Mark all notifications as read"
                        >
                            <FiCheckCircle size={13} />
                            Mark all read
                        </button>
                    )}
                    {messages.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 border border-border-default/40 transition-all active:scale-95 cursor-pointer"
                            title="Clear all notifications"
                        >
                            <FiTrash2 size={13} />
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* 2. Left Sidebar: Categories & Filters */}
                <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0 overflow-y-auto invisibleScroll">
                    {/* Categories */}
                    <div className="bg-background-surface/30 backdrop-blur-xl rounded-xl border border-border-default p-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 hide-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 lg:shrink whitespace-nowrap
                                    ${activeCategory === cat.id
                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                        : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span>{cat.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {cat.id === 'alerts' && messages.some(m => m.category === 'alerts' && !m.read) && (
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse hidden lg:block" />
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold hidden lg:block
                                        ${activeCategory === cat.id ? 'bg-blue-500/20 text-blue-500' : 'bg-background-elevated text-text-tertiary'}
                                    `}>
                                        {cat.count}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Quick Filters */}
                    <div className="bg-background-surface/30 backdrop-blur-xl rounded-xl border border-border-default p-3 hidden lg:block">
                        <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3 px-2">Quick Filters</div>
                        <div className="space-y-1">
                            {QUICK_FILTERS.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all duration-200
                                        ${activeFilter === filter.id
                                            ? 'bg-background-elevated text-text-primary border-border-subtle'
                                            : 'text-text-tertiary hover:bg-background-elevated hover:text-text-secondary border-transparent'
                                        }`}
                                >
                                    <span>{filter.label}</span>
                                    {activeFilter === filter.id && <FiCheckCircle className="text-blue-500" size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Main Content: Search & Message List */}
                <div className="flex-1 flex flex-col bg-background-surface/30 backdrop-blur-xl rounded-2xl border border-border-default overflow-hidden min-h-0">
                    
                    {/* Toolbar */}
                    <div className="p-4 border-b border-border-default bg-background-card/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shrink-0">
                        <div className="relative w-full sm:w-80">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-background-input border border-border-default rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <div className="text-xs text-text-tertiary font-mono">
                            {filteredMessages.length} Messages
                        </div>
                    </div>

                    {/* Message List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                        {filteredMessages.length > 0 ? (
                            filteredMessages.map((msg) => {
                                const { Icon, priorityStyles } = getMessageStyles(msg);
                                return (
                                    <MessageCard
                                        key={msg.id}
                                        message={msg}
                                        Icon={Icon}
                                        priorityStyles={priorityStyles}
                                        formatTimestamp={formatTimestamp}
                                        isPinned={pinnedIds.includes(msg.id)}
                                        onTogglePin={(e) => handlePin(msg.id, e)}
                                        onClick={() => {
                                            markAsRead(msg.id);
                                            setSelectedMessage({ ...msg, icon: Icon });
                                        }}
                                        onRemove={() => removeNotification(msg.id)}
                                    />
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-tertiary space-y-4">
                                <FiBell size={48} className="opacity-20" />
                                <div className="text-center">
                                    <p className="text-lg font-medium text-text-secondary">Inbox Empty</p>
                                    <p className="text-sm">You have no messages matching the current criteria.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Modal */}
            <MessageDetailModal
                message={selectedMessage}
                isOpen={!!selectedMessage}
                onClose={() => setSelectedMessage(null)}
                isPinned={selectedMessage ? pinnedIds.includes(selectedMessage.id) : false}
                onPin={handlePin}
                formatTimestamp={formatTimestamp}
            />
        </div>
    );
}
