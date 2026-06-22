/**
 * @file EventDeepDiveModal.jsx
 * @purpose Comprehensive modal view for detailed event analysis.
 * @responsibilities
 * - Displays deeper context for a selected event ("How to Read").
 * - Provides actionable trading playbooks (Before/After strategy).
 * - Visualizes IV expectations and market impact vectors.
 * - Handles modal lifecycle (Mount/Unmount/Portal).
 * @key_exports
 * - EventDeepDiveModal (Default Component)
 * @dependencies
 * - react-dom: For Portal rendering.
 * @lifecycle
 * - Triggered by user interaction on an EventCard.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// =============================
// Helper Components
// =============================

/**
 * EventInterpretationDesk
 * Left panel: Explains the fundamental significance of the event.
 */
function EventInterpretationDesk({ event }) {
    if (!event) return null;

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="bg-background-card/98 border border-border-default backdrop-blur-xl rounded-xl p-5 shadow-md flex-1">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                    How To Read This Event
                </h3>

                <div className="space-y-4">
                    <div>
                        <div className="text-sm font-semibold text-text-primary mb-1">What it measures</div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                            {event.category === 'Macro' ? "Inflation pressure and purchasing power. High values erode real returns." :
                                event.category === 'Corporate' ? "Company health and forward guidance." :
                                    "Global macro sentiment spillover."}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-semibold text-text-primary mb-1">Relevance</div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                            Market prices in expectations. We trade the <span className="text-amber-600">Deviation</span> from consensus.
                        </div>
                    </div>

                    <div className="p-3 bg-background-elevated/40 rounded border border-border-subtle space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-text-secondary">Lower than Est</span>
                            <span className="text-state-bullish-text font-bold">Bullish</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-text-secondary">Higher than Est</span>
                            <span className="text-state-bearish-text font-bold">Bearish</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-text-secondary">In-Line</span>
                            <span className="text-accent-primary font-bold">Vol Crush</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * EventTradingPlaybook
 * Right panel: Suggested trading actions based on event phases.
 */
function EventTradingPlaybook({ event }) {
    if (!event) return null;

    const playbook = event.playbook || { before: 'Neutral', after: 'React to level' };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="bg-background-card/98 border border-border-default backdrop-blur-xl rounded-xl p-5 shadow-md flex-1">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                    Trading Playbook
                </h3>

                <div className="space-y-6">
                    {/* Phase 1: Before */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            <span className="text-xs font-bold text-text-primary uppercase">Before Event (T-1)</span>
                        </div>
                        <div className="p-3 bg-background-elevated/40 border border-border-subtle rounded-lg text-xs text-text-secondary">
                            {playbook.before}
                        </div>
                    </div>

                    {/* Phase 2: After */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-accent-primary rounded-full" />
                            <span className="text-xs font-bold text-text-primary uppercase">After Event (T+0)</span>
                        </div>
                        <div className="p-3 bg-background-elevated/40 border border-border-subtle rounded-lg text-xs text-text-secondary">
                            {playbook.after}
                        </div>
                    </div>

                    {/* IV Gauge Visualization */}
                    <div>
                        <div className="flex justify-between text-xs text-text-tertiary mb-1">
                            <span>IV Expectation</span>
                            <span>Crush Likely</span>
                        </div>
                        <div className="h-1 bg-background-subtle rounded-full overflow-hidden">
                            <div className="h-full w-[70%] bg-gradient-to-r from-state-bearish-text to-state-bullish-text" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================
// Main Component
// =============================
export default function EventDeepDiveModal({ open, onClose, event }) {
    // Escape Key Handler
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden"; // Prevent background scroll
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open || !event) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-6 max-w-[1400px] w-full h-[85vh] lg:h-[600px] pointer-events-none overflow-y-auto lg:overflow-visible">

                {/* Left Panel */}
                <div className="w-full lg:w-[280px] pointer-events-auto shrink-0 order-2 lg:order-1">
                    <EventInterpretationDesk event={event} />
                </div>

                {/* Center Main Panel */}
                <div className="flex-1 min-w-0 bg-background-card/98 border border-border-default backdrop-blur-3xl rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto order-1 lg:order-2 min-h-[400px]">
                    {/* Header */}
                    <div className="shrink-0 p-4 md:p-8 border-b border-border-subtle flex justify-between items-start bg-transparent z-10">
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tighter leading-tight">
                                {event.title}
                            </h2>
                            <div className="text-[10px] font-black text-text-tertiary mt-2 flex gap-4 uppercase tracking-[0.2em] opacity-60">
                                <span className="text-accent-primary">{event.category}</span>
                                <span>•</span>
                                <span>Impact Score: <span className="text-text-primary">{event.impactScore}/10</span></span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-xl bg-background-elevated text-text-tertiary hover:text-accent-primary hover:bg-background-subtle transition-all border border-border-default active:scale-95 shadow-sm"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chart Visualization Placeholder */}
                    <div className="flex-1 p-6 relative flex flex-col items-center justify-center bg-transparent">
                        <div className="absolute inset-0 m-6 border border-border-subtle rounded bg-background-elevated/40 flex flex-col items-center justify-center">
                            <span className="text-text-tertiary font-mono text-sm opacity-50">
                                [ Interactive Candle Chart would go here ]
                            </span>
                            <span className="text-text-tertiary text-xs mt-2 opacity-30">
                                Showing 30-day Nifty candles with Vertical Event markers
                            </span>

                            {/* Mock Vertical Event Marker */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-500/50 border-l border-dashed border-amber-500">
                                <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-1 rounded">
                                    EVENT
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 p-4 border-t border-border-subtle bg-background-card/50 backdrop-blur-sm">
                        <div className="flex justify-between text-xs text-text-tertiary">
                            <span>Source: NSE / Custom Engine</span>
                            <span>Last Updated: Live</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full lg:w-[280px] pointer-events-auto shrink-0 order-3">
                    <EventTradingPlaybook event={event} />
                </div>

            </div>
        </div>,
        document.body
    );
}
