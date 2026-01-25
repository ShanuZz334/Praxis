import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// LEFT PANEL: How To Read
function EventInterpretationDesk({ event }) {
    if (!event) return null;

    return (
        <div className="h-full flex flex-col gap-4">
            {/* CARD 1: EXPLAINER */}
            <div className="bg-[#0b1220] border border-white/10 rounded-xl p-5 shadow-lg flex-1">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                    How To Read This Event
                </h3>

                <div className="space-y-4">
                    <div>
                        <div className="text-sm font-semibold text-white/90 mb-1">What it measures</div>
                        <div className="text-xs text-white/60 leading-relaxed">
                            {event.category === 'Macro' ? "Inflation pressure and purchasing power. High values erode real returns." :
                                event.category === 'Corporate' ? "Company health and forward guidance." :
                                    "Global macro sentiment spillover."}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-semibold text-white/90 mb-1">Relevance</div>
                        <div className="text-xs text-white/60 leading-relaxed">
                            Market prices in expectations. We trade the <span className="text-yellow-400">Deviation</span> from consensus.
                        </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded border border-white/5 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">Lower than Est</span>
                            <span className="text-green-400 font-bold">Bullish</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">Higher than Est</span>
                            <span className="text-red-400 font-bold">Bearish</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">In-Line</span>
                            <span className="text-blue-400 font-bold">Vol Crush</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

// RIGHT PANEL: Trading Playbook
function EventTradingPlaybook({ event }) {
    if (!event) return null;

    const playbook = event.playbook || { before: 'Neutral', after: 'React to level' };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* PLAYBOOK CARD */}
            <div className="bg-[#0b1220] border border-white/10 rounded-xl p-5 shadow-lg flex-1">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                    Trading Playbook
                </h3>

                <div className="space-y-6">

                    {/* BEFORE */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                            <span className="text-xs font-bold text-white uppercase">Before Event (T-1)</span>
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-100">
                            {playbook.before}
                        </div>
                    </div>

                    {/* AFTER */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <span className="text-xs font-bold text-white uppercase">After Event (T+0)</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-100">
                            {playbook.after}
                        </div>
                    </div>

                    {/* IV GAUGE */}
                    <div>
                        <div className="flex justify-between text-xs text-white/50 mb-1">
                            <span>IV Expectation</span>
                            <span>Crush Likely</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[70%] bg-gradient-to-r from-red-500 to-green-500" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}


export default function EventDeepDiveModal({ open, onClose, event }) {
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

    if (!open || !event) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* BACKDROP */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            {/* LAYOUT CONTAINER */}
            <div className="relative flex items-stretch justify-center gap-6 max-w-[1400px] w-full h-[600px] pointer-events-none">

                {/* LEFT */}
                <div className="hidden lg:block w-[280px] pointer-events-auto">
                    <EventInterpretationDesk event={event} />
                </div>

                {/* CENTER */}
                <div className="flex-1 min-w-0 bg-[#0b1220] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="shrink-0 p-6 border-b border-white/5 flex justify-between items-start bg-[#0b1220] z-10">
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{event.title}</h2>
                            <div className="text-sm text-white/40 mt-1 flex gap-4">
                                <span>{event.category}</span>
                                <span>•</span>
                                <span>Impact: {event.impactScore}/10</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition">
                            ✕
                        </button>
                    </div>

                    {/* Chart Area Payload */}
                    <div className="flex-1 p-6 relative flex flex-col items-center justify-center bg-white/[0.01]">
                        {/* Mock Chart Visualization */}
                        <div className="absolute inset-0 m-6 border border-white/5 rounded bg-black/20 flex flex-col items-center justify-center">
                            <span className="text-white/20 font-mono text-sm">[ Interactive Candle Chart would go here ]</span>
                            <span className="text-white/10 text-xs mt-2">Showing 30-day Nifty candles with Vertical Event markers</span>

                            {/* Mock Vertical Line */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-yellow-500/50 border-l border-dashed border-yellow-500">
                                <div className="absolute top-2 left-2 bg-yellow-500 text-black text-[9px] font-bold px-1 rounded">EVENT</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 p-4 border-t border-white/5 bg-[#0b1220]/50 backdrop-blur-sm">
                        <div className="flex justify-between text-xs text-white/40">
                            <span>Source: NSE / Custom Engine</span>
                            <span>Last Updated: Live</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="hidden lg:block w-[280px] pointer-events-auto">
                    <EventTradingPlaybook event={event} />
                </div>

            </div>
        </div>,
        document.body
    );
}
