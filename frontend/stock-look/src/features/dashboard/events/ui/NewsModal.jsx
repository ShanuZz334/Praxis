import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// REUSING UI LOGIC FROM EVENT MODAL BUT ADAPTED FOR NEWS

function NewsInterpretationDesk({ news }) {
    if (!news) return null;
    return (
        <div className="h-full flex flex-col gap-4">
            <div className="bg-[#0b1220] border border-white/10 rounded-xl p-5 shadow-lg flex-1">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                    How To Read This News
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="text-sm font-semibold text-white/90 mb-1">Context</div>
                        <div className="text-xs text-white/60 leading-relaxed">
                            Source: <span className="text-white/80">{news.source}</span>.
                            Markets react to the surprise component vs consensus.
                        </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded border border-white/5 space-y-2">
                        <div className="text-xs text-white/50 mb-1 uppercase tracking-wider">Historical Check</div>
                        <div className="text-xs text-white/80 leading-relaxed">
                            Similar headlines in the past led to <span className="text-yellow-400 font-bold">Intraday Volatility</span> followed by immediate reversion.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NewsPlaybook({ news }) {
    if (!news) return null;
    const { playbook } = news;
    return (
        <div className="h-full flex flex-col gap-4">
            <div className="bg-[#0b1220] border border-white/10 rounded-xl p-5 shadow-lg flex-1">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                    Action Plan
                </h3>
                <div className="space-y-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs leading-relaxed">
                        <div className="font-bold text-blue-300 mb-1 uppercase text-[10px]">Equity Strategy</div>
                        <div className="text-blue-100">{playbook.equityBias}</div>
                    </div>
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs leading-relaxed">
                        <div className="font-bold text-purple-300 mb-1 uppercase text-[10px]">Options Strategy</div>
                        <div className="text-purple-100">{playbook.optionsBias}</div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-white/50 mb-1">
                            <span>Time Decay Relevance</span>
                            <span className="text-white/80">{playbook.timeDecay}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-slate-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewsModal({ open, onClose, news }) {
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

    if (!open || !news) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative flex items-stretch justify-center gap-6 max-w-[1400px] w-full h-[600px] pointer-events-none">
                {/* LEFT */}
                <div className="hidden lg:block w-[280px] pointer-events-auto">
                    <NewsInterpretationDesk news={news} />
                </div>

                {/* CENTER */}
                <div className="flex-1 min-w-0 bg-[#0b1220] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
                    <div className="shrink-0 p-6 border-b border-white/5 flex justify-between items-start bg-[#0b1220] z-10">
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight pr-6">{news.title}</h2>
                            <div className="text-sm text-white/40 mt-1 flex gap-4">
                                <span>{news.source}</span>
                                <span>•</span>
                                <span>Impact: {news.impactScore}/10</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition">
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 p-6 relative flex flex-col items-center justify-center bg-white/[0.01]">
                        <div className="absolute inset-0 m-6 border border-white/5 rounded bg-black/20 flex flex-col items-center justify-center">
                            <span className="text-white/20 font-mono text-sm">[ Live Market Chart: NIFTY 5m ]</span>
                            <span className="text-white/10 text-xs mt-2">Vertical marker at {new Date(news.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="hidden lg:block w-[280px] pointer-events-auto">
                    <NewsPlaybook news={news} />
                </div>
            </div>
        </div>,
        document.body
    );
}
