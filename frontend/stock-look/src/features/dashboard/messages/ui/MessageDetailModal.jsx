/**
 * @file MessageDetailModal.jsx
 * @purpose Renders the detailed view of a message in a modal.
 * @responsibilities
 * - Displays full message content and metadata.
 * - Provides action buttons based on message type.
 * - Handles 'Mark as Read' and close interactions.
 * @key_exports
 * - MessageDetailModal (Default Component)
 * @dependencies
 * - React, react-icons
 * @lifecycle
 * - Rendered by MessagesPage.
 * @date 2026-02-03
 */

import React from "react";
import { FiX } from "react-icons/fi";

// =============================
// Component
// =============================

export default function MessageDetailModal({ message, onClose, formatTimestamp }) {
    if (!message) return null;

    const Icon = message.icon;

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-background-card border border-border-default rounded-2xl max-w-2xl w-full p-7 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-7">
                    <div className="flex items-center gap-4">
                        <div
                            className={`
              w-14 h-14 rounded-xl flex items-center justify-center
              bg-background-surface border border-border-default
              shadow-lg
            `}
                        >
                            <Icon className="text-2xl text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary tracking-tight">{message.title}</h2>
                            <p className="text-xs text-text-secondary mt-1 font-medium">
                                {formatTimestamp(message.timestamp)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-tertiary hover:text-text-primary transition-all duration-200 p-1.5 hover:bg-background-surface rounded-lg active:scale-90"
                    >
                        <FiX className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="bg-background-surface rounded-xl p-5 border border-border-default mb-6 shadow-inner">
                    <p className="text-sm text-text-primary leading-relaxed">{message.content}</p>
                </div>

                {/* Metadata */}
                {message.metadata && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {Object.entries(message.metadata).map(([key, value]) => (
                            <div key={key} className="bg-background-card rounded-xl p-4 border border-border-default hover:bg-background-surface transition-all duration-200">
                                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2 font-semibold">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="text-sm text-text-primary font-semibold font-mono">{value}</p>
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
                    <button className="px-5 py-3 bg-background-surface hover:bg-border-default text-text-secondary hover:text-text-primary border border-border-default rounded-xl text-sm font-medium transition-all duration-200 active:scale-95">
                        Mark as Read
                    </button>
                </div>
            </div>
        </div>
    );
}
