/**
 * @file MessageCard.jsx
 * @purpose Renders a summary card for a single message in the feed.
 * @responsibilities
 * - Displays message priority with visual indicators (color, border).
 * - Shows read/unread status.
 * - Handles pin toggling and click interactions.
 * - Supports hover animations and timestamp formatting.
 * @key_exports
 * - MessageCard (Default Component)
 * @dependencies
 * - React, react-icons
 * @lifecycle
 * - Rendered by MessagesPage.
 * @date 2026-02-03
 */

import React, { useState } from "react";
import { FiStar } from "react-icons/fi";

// =============================
// Component
// =============================

export default function MessageCard({
    message,
    Icon,
    priorityStyles,
    isPinned,
    onTogglePin,
    onClick,
    formatTimestamp,
    index,
}) {
    // eslint-disable-next-line no-unused-vars
    const [isHovered, setIsHovered] = useState(false);

    // =============================
    // Render Layer
    // =============================

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`
        bg-background-card backdrop-blur-xl rounded-lg border border-border-default
        p-3 cursor-pointer transition-all duration-300 group
        hover:bg-background-surface hover:border-border-default
        hover:shadow-lg hover:-translate-y-0.5
        ${priorityStyles.border} ${priorityStyles.bg} ${priorityStyles.glow}
        ${!message.read ? "ring-1 ring-blue-500/25 shadow-lg shadow-blue-500/5" : ""}
        animate-in fade-in slide-in-from-bottom-4 duration-500
      `}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={`
          w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
          bg-background-surface border border-border-default
          transition-all duration-300 group-hover:scale-105
          ${message.priority === "critical" ? "bg-red-500/15 border-red-500/30" : ""}
          ${message.priority === "high" ? "bg-amber-500/15 border-amber-500/30" : ""}
        `}
                >
                    <Icon
                        className={`text-base transition-all duration-300 ${message.priority === "critical"
                            ? "text-red-500"
                            : message.priority === "high"
                                ? "text-amber-500"
                                : message.category === "alerts"
                                    ? "text-blue-500"
                                    : message.category === "notifications"
                                        ? "text-green-500"
                                        : "text-text-tertiary"
                            }`}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                            <h3
                                className={`font-semibold text-sm transition-colors duration-200 ${!message.read ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
                                    }`}
                            >
                                {message.title}
                            </h3>
                            {isPinned && (
                                <FiStar className="text-blue-500 text-[10px] fill-blue-500 animate-in zoom-in duration-300" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-text-tertiary whitespace-nowrap font-medium">
                                {formatTimestamp(message.timestamp)}
                            </span>
                            {!message.read && (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50" />
                            )}
                        </div>
                    </div>

                    <p className="text-[11px] text-text-secondary mb-2 line-clamp-1 leading-relaxed">
                        {message.description}
                    </p>

                    {/* Metadata Pills */}
                    {message.metadata && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {Object.entries(message.metadata).slice(0, 3).map(([key, value]) => (
                                <span
                                    key={key}
                                    className="px-2 py-1 bg-background-surface border border-border-default rounded-md text-[11px] text-text-secondary font-mono transition-all duration-200 hover:bg-border-default hover:border-border-default"
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
}
