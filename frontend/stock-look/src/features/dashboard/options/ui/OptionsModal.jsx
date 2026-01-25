import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import OptionsHistoryChart from "./OptionsHistoryChart";

export default function OptionsModal({ open, onClose, card }) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* BACKDROP */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* MODAL CONTENT */}
            <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-[#0b1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">

                {/* HEADER */}
                <div className="shrink-0 p-6 border-b border-white/5 flex justify-between items-start bg-[#0b1220] z-10 select-none">
                    <div>
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                            {card.category} Analysis
                        </div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 leading-tight">
                            {card.label}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-lg font-mono text-blue-400 font-bold">{card.value} {card.unit}</span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${card.trend === 'up' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-white/60 border-white/10'}`}>
                                {card.change}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                    >
                        ✕
                    </button>
                </div>

                {/* BODY layout */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT PANEL: CONTEXT */}
                    <div className="w-1/3 border-r border-white/10 p-6 bg-white/[0.02] overflow-y-auto custom-scrollbar">
                        <h3 className="text-sm font-bold text-white mb-4">What this means</h3>
                        <p className="text-sm text-white/70 leading-relaxed mb-6 font-light">
                            {card.interpretation}. <br /><br />
                            This metric combines raw exchange data with derived algorithmic scoring to determine the directional bias of institutional positioning.
                        </p>

                        <h3 className="text-sm font-bold text-white mb-3">Key Data Points</h3>
                        <div className="space-y-3 text-xs text-white/60 font-mono">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span>Reference</span>
                                <span>Value</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Current Level</span>
                                <span className="text-white font-bold">{card.value}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bias Signal</span>
                                <span className={card.normalized > 0.6 ? 'text-green-400' : card.normalized < 0.4 ? 'text-red-400' : 'text-slate-400'}>
                                    {card.normalized > 0.6 ? 'Bullish' : card.normalized < 0.4 ? 'Bearish' : 'Neutral'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Confidence</span>
                                <span className={relColor}>High</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: VISUALIZATION (Placeholder for Charts) */}
                    <div className="flex-1 p-6 flex flex-col bg-[#05080f] relative group">

                        {/* Background Grid Accent */}
                        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:20px_20px] opacity-10 pointer-events-none" />

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
                <div className="shrink-0 p-4 border-t border-white/5 bg-[#0b1220] flex justify-between items-center text-xs text-white/30">
                    <span>Data refreshed: Real-time</span>
                    <span>Options Intelligence Engine v1.0</span>
                </div>
            </div>
        </div>,
        document.body
    );
}
