import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/shared/context/ThemeContext";
import GlobalInterpretationDesk from "./GlobalInterpretationDesk";
import GlobalMetricsDesk from "./GlobalMetricsDesk";
import GlobalHistoryChart from "./GlobalHistoryChart";

export default function GlobalStructureModal({ open, onClose, card }) {
    const { theme } = useTheme();
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

    // Reliability tier for footer
    const relVal = card.creditScore ? card.creditScore * 10 : 8.5;
    let relTier = 'Low';
    let relColor = 'text-slate-400';
    if (relVal >= 8) { relTier = 'High'; relColor = 'text-green-400'; }
    else if (relVal >= 6) { relTier = 'Medium'; relColor = 'text-yellow-400'; }

    return createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme}`}>
            {/* BACKDROP */}
            <div
                className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* MODAL LAYOUT (Three-panel) */}
            <div className="relative flex items-start justify-center gap-6 max-w-[1600px] w-full max-h-[95vh] pointer-events-none">

                {/* ⬅ LEFT FLOAT: INTERPRETATION DESK */}
                <div className="hidden lg:block w-[300px] pointer-events-auto">
                    <GlobalInterpretationDesk card={card} />
                </div>

                {/* 🧱 CENTER: POPUP CARD */}
                <div
                    className="
            flex-1 min-w-0 max-w-3xl pointer-events-auto
            flex flex-col
            bg-background-tooltip
            border border-border-default
            rounded-2xl
            shadow-xl
            overflow-hidden
            max-h-[85vh]
          "
                >
                    {/* FIXED HEADER */}
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
                                group
                                absolute top-5 right-5
                                w-8 h-8
                                flex items-center justify-center
                                rounded-full
                                bg-background-elevated
                                text-text-tertiary
                                hover:text-text-primary hover:bg-background-subtle
                                hover:scale-105 active:scale-95
                                transition-all duration-200
                                border border-border-subtle hover:border-border-default
                              "
                        >
                            <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
                        </button>
                    </div>

                    {/* SCROLLABLE CONTENT (CHART AREA) */}
                    <div className="
                        flex-1
                        overflow-y-auto
                        custom-scrollbar
                        p-6
                    ">

                        {/* ACTUAL CHART CONTAINER */}
                        <div className="
                            w-full min-h-[400px] h-[450px]
                            border border-border-subtle rounded-xl 
                            bg-background-elevated/40
                            p-4 relative
                            group
                        ">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent opacity-50" />

                            <div className="w-full h-full rounded-lg overflow-hidden relative z-10">
                                <GlobalHistoryChart card={card} />
                            </div>
                        </div>
                    </div>

                    {/* FIXED FOOTER */}
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

                {/* ➡ RIGHT FLOAT: METRICS DESK (AI ANALYSIS) */}
                <div className="hidden lg:block w-[240px] pointer-events-auto">
                    <GlobalMetricsDesk card={card} />
                </div>

            </div>
        </div>,
        document.body
    );
}
