import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/shared/context/ThemeContext";
import OptionsHistoryChart from "./OptionsHistoryChart";

export default function OptionsModal({ open, onClose, card }) {
    const { theme } = useTheme();
    // 1. ESC Key Handler
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

    // Reliability Visuals
    const relColor = card.normalized > 0.6 ? "text-emerald-400" : card.normalized < 0.4 ? "text-red-400" : "text-yellow-400";

    return createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme}`}>
            {/* BACKDROP */}
            <div
                className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* MODAL CONTENT */}
            <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-background-tooltip border border-border-default rounded-2xl shadow-xl overflow-hidden pointer-events-auto">

                {/* HEADER */}
                <div className="shrink-0 p-4 md:p-6 border-b border-border-subtle flex justify-between items-start bg-transparent z-10 select-none">
                    <div>
                        <div className="text-[10px] md:text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1 md:mb-2">
                            {card.category} Analysis
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-text-primary leading-tight">
                            {card.label}
                        </h2>
                        <div className="flex items-center gap-2 md:gap-3 mt-1">
                            <span className="text-sm md:text-lg font-mono text-accent-primary font-bold">{card.value} {card.unit}</span>
                            <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded border ${card.trend === 'up' ? 'text-state-bullish-text border-emerald-500/20 bg-state-bullish-surface' : 'text-text-secondary border-border-subtle'}`}>
                                {card.change}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-background-elevated text-text-tertiary hover:text-text-primary hover:bg-background-subtle transition-colors border border-border-subtle"
                    >
                        ✕
                    </button>
                </div>

                {/* BODY layout */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden overflow-y-auto md:overflow-y-hidden">

                    {/* LEFT PANEL: CONTEXT */}
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border-subtle p-4 md:p-6 bg-background-elevated/40 shrink-0">
                        <h3 className="text-sm font-bold text-text-primary mb-3 md:mb-4">What this means</h3>
                        <p className="text-xs md:text-sm text-text-secondary leading-relaxed mb-4 md:mb-6 font-light">
                            {card.interpretation}. <br /><br />
                            This metric combines raw exchange data with derived algorithmic scoring to determine the directional bias of institutional positioning.
                        </p>

                        <h3 className="text-sm font-bold text-text-primary mb-3">Key Data Points</h3>
                        <div className="space-y-3 text-xs text-text-secondary font-mono">
                            <div className="flex justify-between border-b border-border-subtle pb-1 text-text-tertiary">
                                <span>Reference</span>
                                <span>Value</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Current Level</span>
                                <span className="text-text-primary font-bold">{card.value}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bias Signal</span>
                                <span className={card.normalized > 0.6 ? 'text-state-bullish-text' : card.normalized < 0.4 ? 'text-state-bearish-text' : 'text-text-tertiary'}>
                                    {card.normalized > 0.6 ? 'Bullish' : card.normalized < 0.4 ? 'Bearish' : 'Neutral'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Confidence</span>
                                <span className={relColor.replace('text-emerald-400', 'text-state-bullish-text').replace('text-red-400', 'text-state-bearish-text').replace('text-yellow-400', 'text-amber-600')}>High</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: VISUALIZATION */}
                    <div className="w-full md:flex-1 p-4 md:p-6 flex flex-col bg-transparent relative group min-h-[300px]">
                        <div className="w-full h-full relative z-10">
                            <OptionsHistoryChart
                                trend={card.trend}
                                baseValue={card.value}
                                label={card.label}
                            />
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="shrink-0 p-4 border-t border-border-subtle bg-background-card/75 flex justify-between items-center text-xs text-text-tertiary">
                    <span>Data refreshed: Real-time</span>
                    <span>Options Intelligence Engine v1.0</span>
                </div>
            </div>
        </div>,
        document.body
    );
}
