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
} from "react-icons/fi";
import MessageCard from "./MessageCard";
import MessageDetailModal from "./MessageDetailModal";

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

export default function MessagesPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [pinnedIds, setPinnedIds] = useState([]);

    // Empty state for data
    const messages = [];
    const categories = MESSAGE_CATEGORIES.map(cat => ({
        ...cat,
        count: 0
    }));

    const filteredMessages = [];

    const handlePin = (id, e) => {
        e.stopPropagation();
        setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto text-text-primary">
            {/* 1. Header & Global Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
                        Inbox &amp; Alerts
                    </h1>
                    <p className="text-sm text-text-tertiary mt-1">Real-time system notifications and AI insights</p>
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
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold hidden lg:block
                                    ${activeCategory === cat.id ? 'bg-blue-500/20 text-blue-500' : 'bg-background-elevated text-text-tertiary'}
                                `}>
                                    {cat.count}
                                </span>
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
                            filteredMessages.map((msg) => (
                                <MessageCard
                                    key={msg.id}
                                    message={msg}
                                    isPinned={pinnedIds.includes(msg.id)}
                                    onPin={(e) => handlePin(msg.id, e)}
                                    onClick={() => setSelectedMessage(msg)}
                                />
                            ))
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
            />
        </div>
    );
}
