/**
 * @file NewsCard.jsx
 * @purpose A specialized display card for individual news items.
 * @responsibilities
 * - Displays news metadata: Source, Timestamp, Impact Badge.
 * - Shows headlines and takeaways with clear hierarchy.
 * - Visualizes AI Confidence/Impact Score via a bottom progress bar.
 * - Supports hover and selection states for parent interactions.
 * - Renders semantic tags (Bullish/Bearish arrows).
 * @key_exports
 * - NewsCard (Default Component)
 * @dependencies
 * - date-fns: For relative time formatting.
 * @lifecycle
 * - Rendered by NewsFeed list.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { formatDistanceToNow, parseISO } from 'date-fns';

// =============================
// Main Component
// =============================
export default function NewsCard({ news, onHover, onClick, isSelected }) {
    const {
        title,
        source,
        timestamp,
        category,
        impactScore,
        takeaway,
        tags
    } = news;

    // 1. Impact Badge & Color Logic
    let impactColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    let impactLabel = "Low Impact";

    if (impactScore >= 8) {
        impactColor = "text-red-400 bg-red-500/10 border-red-500/20";
        impactLabel = "High Impact";
    } else if (impactScore >= 5) {
        impactColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
        impactLabel = "Medium Impact";
    }

    // 2. Tag Rendering Helper
    const renderTag = (tag, idx) => {
        const isUp = tag.bias === 'up';
        const isDown = tag.bias === 'down';
        const color = isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-slate-400';
        const arrow = isUp ? '↑' : isDown ? '↓' : '-';

        return (
            <span key={idx} className="flex items-center gap-1 text-[10px] bg-background-surface px-1.5 py-0.5 rounded border border-border-default">
                <span className="text-text-secondary">{tag.label}</span>
                <span className={`font-bold ${color}`}>{arrow}</span>
            </span>
        );
    };

    return (
        <div
            className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer
            ${isSelected ? 'bg-background-surface border-border-default' : 'bg-background-card border-border-default hover:bg-background-surface hover:border-border-default'}
        `}
            onMouseEnter={() => onHover(news)}
            onClick={() => onClick(news)}
        >
            {/* Header: Metadata & Badge */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{source}</span>
                    <span className="text-[10px] text-text-tertiary">•</span>
                    <span className="text-[10px] text-text-tertiary">
                        {formatDistanceToNow(parseISO(timestamp), { addSuffix: true })}
                    </span>
                </div>
                <div className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${impactColor}`}>
                    {impactLabel}
                </div>
            </div>

            {/* Content: Title & Takeaway */}
            <div className="mb-3">
                <h3 className="text-sm font-semibold text-text-primary leading-snug mb-2 group-hover:text-blue-500 transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {takeaway}
                </p>
            </div>

            {/* Footer: Tags */}
            <div className="flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold text-text-tertiary py-0.5 bg-background-surface px-1.5 rounded">
                    {category}
                </span>
                {tags.map(renderTag)}
            </div>

            {/* Bottom Impact Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-background-surface rounded-b-xl overflow-hidden">
                <div
                    className="h-full bg-blue-500/50"
                    style={{ width: `${(impactScore / 10) * 100}%` }}
                />
            </div>

        </div>
    );
}
