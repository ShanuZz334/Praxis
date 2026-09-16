/**
 * @file MessageDetailModal.jsx
 * @purpose Renders the detailed view of a message in a modal.
 * @responsibilities
 * - Displays full message content and metadata.
 * - Sanitizes raw technical error strings into clean human-readable text.
 * - Prevents modal viewport clipping with responsive max-height and scrolling.
 * - Provides action buttons based on message type.
 * - Handles 'Mark as Read' and close interactions.
 * @key_exports
 * - MessageDetailModal (Default Component)
 * @dependencies
 * - React, react-icons
 * @lifecycle
 * - Rendered by MessagesPage.
 */

import React from "react";
import { FiX } from "react-icons/fi";
import { cleanAiText, cleanMetadataValue } from "@/shared/utils/aiErrorSanitizer";

// =============================
// Component
// =============================

export default function MessageDetailModal({ message, onClose, formatTimestamp }) {
    if (!message) return null;

    const Icon = message.icon;
    const providerHint = message.metadata?.Provider || '';
    const displayContent = cleanAiText(message.content || message.description, providerHint);

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-background-card border border-border-default rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 md:p-7 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Fixed top */}
                <div className="flex items-start justify-between mb-5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-background-surface border border-border-default shadow-lg shrink-0"
                        >
                            {Icon && <Icon className="text-2xl text-blue-500" />}
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-text-primary tracking-tight">{message.title}</h2>
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

                {/* Body - Scrollable content & metadata */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-5 space-y-4">
                    {/* Content */}
                    <div className="bg-background-surface rounded-xl p-4 md:p-5 border border-border-default shadow-inner">
                        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{displayContent}</p>
                    </div>

                    {/* Metadata */}
                    {message.metadata && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(message.metadata).map(([key, value]) => {
                                if (value === null || value === undefined || value === '') return null;
                                const cleanVal = cleanMetadataValue(value, providerHint);
                                const isLong = String(cleanVal).length > 35 || key.toLowerCase() === 'reason';

                                return (
                                    <div 
                                        key={key} 
                                        className={`bg-background-surface/70 rounded-xl p-3.5 border border-border-default hover:bg-background-surface transition-all duration-200 ${isLong ? 'sm:col-span-2' : ''}`}
                                    >
                                        <p className="text-[10px] md:text-xs text-text-tertiary uppercase tracking-wider mb-1.5 font-semibold">
                                            {key.replace(/([A-Z])/g, " $1").trim()}
                                        </p>
                                        <p className={`text-xs md:text-sm text-text-primary break-words ${isLong ? 'font-sans font-medium leading-relaxed' : 'font-mono font-semibold'}`}>
                                            {cleanVal}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions - Fixed bottom */}
                <div className="flex gap-3 shrink-0 pt-2 border-t border-border-default/40">
                    {message.actions?.map((action, idx) => {
                        const ActionIcon = action.icon;
                        return (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (action.onClick) action.onClick(message.id);
                                    onClose();
                                }}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-95"
                            >
                                {ActionIcon && <ActionIcon className="text-base" />}
                                {action.label}
                            </button>
                        );
                    })}
                    <button 
                        onClick={() => onClose()}
                        className="px-5 py-2.5 bg-background-surface hover:bg-border-default text-text-secondary hover:text-text-primary border border-border-default rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                    >
                        Mark as Read &amp; Close
                    </button>
                </div>
            </div>
        </div>
    );
}
