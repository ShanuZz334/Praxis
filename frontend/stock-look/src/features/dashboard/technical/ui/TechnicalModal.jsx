import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import TechnicalInterpretationDesk from "./TechnicalInterpretationDesk";
import TechnicalMetricsDesk from "./TechnicalMetricsDesk";
import TechnicalHistoryChart from "./TechnicalHistoryChart";

export default function TechnicalModal({ open, onClose, children, card }) {
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

    // Reliability tier for footer (matched logic)
    const relVal = card.creditScore ? card.creditScore * 10 : 8.5;
    let relTier = 'Low';
    let relColor = 'text-slate-400';
    if (relVal >= 8) { relTier = 'High'; relColor = 'text-green-400'; }
    else if (relVal >= 6) { relTier = 'Medium'; relColor = 'text-yellow-400'; }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* BACKDROP */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* MODAL LAYOUT (Exact match to FundamentalModal) */}
            <div className="relative flex items-start justify-center gap-6 max-w-[1600px] w-full max-h-[95vh] pointer-events-none">

                {/* ⬅ LEFT FLOAT: INTERPRETATION DESK */}
                <div className="hidden lg:block w-[300px] pointer-events-auto">
                    <TechnicalInterpretationDesk card={card} />
                </div>

                {/* 🧱 CENTER: POPUP CARD */}
                <div
                    className="
            flex-1 min-w-0 max-w-3xl pointer-events-auto
            flex flex-col
            bg-[#0b1220]
            border border-white/10
            rounded-2xl
            shadow-2xl
            overflow-hidden
            max-h-[85vh]
          "
                >
                    {/* FIXED HEADER */}
                    <div className="relative shrink-0 p-6 border-b border-white/5 flex justify-between items-start bg-[#0b1220] z-10 select-none">
                        <div>
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 leading-tight pr-8">
                                {card.label}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                                <span className="text-sm text-white/40 border-l border-white/10 pl-2">
                                    {card.desc || `Technical ID: ${card.id}`}
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
                                bg-white/5
                                text-white/40
                                hover:text-white hover:bg-white/10
                                hover:scale-105 active:scale-95
                                transition-all duration-200
                                border border-white/5 hover:border-white/10
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
                        bg-[url('/grid.svg')] bg-[length:20px_20px] bg-fixed opacity-100
                    ">


                        {/* ACTUAL CHART CONTAINER */}
                        <div className="
                            w-full min-h-[400px] h-[450px]
                            border border-white/10 rounded-xl 
                            bg-gradient-to-b from-white/[0.02] to-transparent
                            p-4 relative
                            shadow-inner 
                            group
                        ">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

                            <div className="w-full h-full rounded-lg overflow-hidden relative z-10">
                                <TechnicalHistoryChart
                                    trend={card.signal}
                                    baseValue={card.raw}
                                    label={card.label}
                                />

                                {/* WATERMARK */}
                                <div className="
                                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                    text-white/[0.02] text-7xl font-black tracking-[0.2em] 
                                    pointer-events-none select-none
                                    whitespace-nowrap blur-[1px] -z-10
                                ">
                                    STOCKY PRO
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FIXED FOOTER */}
                    <div className="shrink-0 p-5 border-t border-white/5 bg-[#0b1220]/80 backdrop-blur-xl z-10">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div>
                                <div className="text-white/30 uppercase tracking-wider mb-1">Raw Value</div>
                                <div className="font-mono text-white/80 text-sm font-bold">
                                    {card.raw} <span className="text-[10px] font-normal text-white/40">{card.unit}</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-white/30 uppercase tracking-wider mb-1">Reliability</div>
                                <div className={`font-medium ${relColor}`}>{relTier} ({relVal.toFixed(1)}/10)</div>
                            </div>
                            <div>
                                <div className="text-white/30 uppercase tracking-wider mb-1">Impact Weight</div>
                                <div className="font-mono text-white/80">{(card.weight || 1).toFixed(2)}x</div>
                            </div>
                            <div>
                                <div className="text-white/30 uppercase tracking-wider mb-1">Category</div>
                                <div className="text-white/80">{card.category}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ➡ RIGHT FLOAT: METRICS DESK (ACTION SIGNAL) */}
                <div className="hidden lg:block w-[240px] pointer-events-auto">
                    <TechnicalMetricsDesk card={card} />
                </div>

            </div>
        </div>,
        document.body
    );
}
