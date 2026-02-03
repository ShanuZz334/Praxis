/**
 * @file GlobalStructureModal.jsx
 * @purpose Detail view modal for a specific Global Market Card.
 * @responsibilities
 * - Displays a deep-dive view when a user clicks a GlobalCard.
 * - Integrates three key sub-panels: Interpretation, Chart/History, and AI Metrics.
 * - Manages modal lifecycle (portals, backdrop, escape key).
 * @key_exports
 * - GlobalStructureModal (Default Component)
 * @dependencies
 * - GlobalInterpretationDesk: Educational sidebar.
 * - GlobalMetricsDesk: AI Analysis sidebar.
 * - GlobalHistoryChart: Trend visualization.
 * - ThemeContext: For theme-aware portal rendering.
 * @lifecycle
 * - Rendered by ForeignPage when `selectedCard` is present.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/shared/context/ThemeContext";
import GlobalInterpretationDesk from "./GlobalInterpretationDesk";
import GlobalMetricsDesk from "./GlobalMetricsDesk";
import GlobalHistoryChart from "./GlobalHistoryChart";

// =============================
// Main Component
// =============================
export default function GlobalStructureModal({ open, onClose, card }) {
    const { theme } = useTheme();

    // 1. Lifecycle: Keyboard & Scroll Lock
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open || !card) return null;

    // 2. Portal Render
    return createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme}`}>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-6 max-w-[1600px] w-full max-h-[90vh] lg:max-h-[95vh] pointer-events-none overflow-y-auto lg:overflow-visible">

                {/* LEFT: Interpretation */}
                <div className="w-full lg:w-[300px] pointer-events-auto order-2 lg:order-1 shrink-0">
                    <GlobalInterpretationDesk card={card} />
                </div>

                {/* CENTER: Main Chart & Details */}
                <div className="
                    flex-1 min-w-0 max-w-3xl pointer-events-auto
                    flex flex-col
                    bg-background-tooltip
                    border border-border-default
                    rounded-2xl
                    shadow-xl
                    overflow-hidden
                    max-h-none lg:max-h-[85vh]
                    order-1 lg:order-2
                    min-h-[450px]
                ">
                    {/* Header */}
                    <div className="relative shrink-0 p-6 border-b border-border-subtle flex justify-between items-start bg-transparent z-10 select-none">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary leading-tight pr-8">
                                {card.label}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-mono text-state-bullish-text bg-state-bullish-surface px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                                <span className="text-sm text-text-tertiary border-l border-border-subtle pl-2">
                                    {card.category}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="
                                group absolute top-5 right-5 w-8 h-8
                                flex items-center justify-center rounded-full
                                bg-background-elevated text-text-tertiary
                                hover:text-text-primary hover:bg-background-subtle
                                hover:scale-105 active:scale-95 transition-all duration-200
                                border border-border-subtle hover:border-border-default
                            "
                        >
                            <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
                        </button>
                    </div>

                    {/* Content (Chart) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="w-full min-h-[400px] h-[450px] border border-border-subtle rounded-xl bg-background-elevated/40 p-4 relative group">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent opacity-50" />
                            <div className="w-full h-full rounded-lg overflow-hidden relative z-10">
                                <GlobalHistoryChart card={card} />
                            </div>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="shrink-0 p-5 border-t border-border-subtle bg-background-card/75 backdrop-blur-xl z-10">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-text-primary">
                            <div>
                                <div className="text-text-tertiary uppercase tracking-wider mb-1">Raw Value</div>
                                <div className="font-mono text-text-primary text-sm font-bold">
                                    {card.raw} <span className="text-[10px] font-normal text-text-tertiary">{card.unit}</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-text-tertiary uppercase tracking-wider mb-1">Credit</div>
                                <div className="font-mono text-text-primary font-bold">
                                    {card.creditAllocation || '?'}/150
                                </div>
                            </div>
                            <div>
                                <div className="text-text-tertiary uppercase tracking-wider mb-1">Signal</div>
                                <div className={`font-mono font-bold ${card.normalized > 0.3 ? 'text-state-bullish-text' :
                                    card.normalized < -0.3 ? 'text-state-bearish-text' :
                                        'text-amber-600'
                                    }`}>
                                    {card.normalized > 0.3 ? 'Bullish' : card.normalized < -0.3 ? 'Bearish' : 'Neutral'}
                                </div>
                            </div>
                            <div>
                                <div className="text-text-tertiary uppercase tracking-wider mb-1">Category</div>
                                <div className="text-text-primary">{card.category}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: AI Metrics */}
                <div className="w-full lg:w-[240px] pointer-events-auto order-3 shrink-0">
                    <GlobalMetricsDesk card={card} />
                </div>

            </div>
        </div>,
        document.body
    );
}
