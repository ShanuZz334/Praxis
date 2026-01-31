import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// REUSING UI LOGIC FROM EVENT MODAL BUT ADAPTED FOR NEWS

function NewsInterpretationDesk({ news }) {
    if (!news) return null;
    return (
        <div className="h-full flex flex-col gap-4">
            <div className="bg-background-card/98 border border-border-default backdrop-blur-xl rounded-xl p-5 shadow-md flex-1">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                    How To Read This News
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="text-sm font-semibold text-text-primary mb-1">Context</div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                            Source: <span className="text-text-primary">{news.source}</span>.
                            Markets react to the surprise component vs consensus.
                        </div>
                    </div>
                    <div className="p-3 bg-background-elevated/40 rounded border border-border-subtle space-y-2">
                        <div className="text-xs text-text-tertiary mb-1 uppercase tracking-wider">Historical Check</div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                            Similar headlines in the past led to <span className="text-amber-600 font-bold">Intraday Volatility</span> followed by immediate reversion.
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
            <div className="bg-background-card/98 border border-border-default backdrop-blur-xl rounded-xl p-5 shadow-md flex-1">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                    Action Plan
                </h3>
                <div className="space-y-4">
                    <div className="p-3 bg-background-elevated/40 border border-border-subtle rounded-lg text-xs leading-relaxed">
                        <div className="font-bold text-accent-primary mb-1 uppercase text-[10px]">Equity Strategy</div>
                        <div className="text-text-secondary">{playbook.equityBias}</div>
                    </div>
                    <div className="p-3 bg-background-elevated/40 border border-border-subtle rounded-lg text-xs leading-relaxed">
                        <div className="font-bold text-purple-600 mb-1 uppercase text-[10px]">Options Strategy</div>
                        <div className="text-text-secondary">{playbook.optionsBias}</div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-text-tertiary mb-1">
                            <span>Time Decay Relevance</span>
                            <span className="text-text-secondary">{playbook.timeDecay}</span>
                        </div>
                        <div className="h-1 bg-background-subtle rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-text-tertiary opacity-30" />
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
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative flex items-stretch justify-center gap-6 max-w-[1400px] w-full h-[600px] pointer-events-none">
                {/* LEFT */}
                <div className="hidden lg:block w-[280px] pointer-events-auto">
                    <NewsInterpretationDesk news={news} />
                </div>

                {/* CENTER */}
                <div className="flex-1 min-w-0 bg-background-card/98 border border-border-default backdrop-blur-3xl rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto">
                    <div className="shrink-0 p-8 border-b border-border-subtle flex justify-between items-start bg-transparent z-10">
                        <div>
                            <h2 className="text-2xl font-black text-text-primary leading-tight pr-10 tracking-tighter">{news.title}</h2>
                            <div className="text-[10px] font-black text-text-tertiary mt-2.5 flex gap-4 uppercase tracking-[0.2em] opacity-60">
                                <span className="text-accent-primary">{news.source}</span>
                                <span>•</span>
                                <span>Impact Vector: <span className="text-text-primary">{news.impactScore}/10</span></span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-xl bg-background-elevated text-text-tertiary hover:text-accent-primary hover:bg-background-subtle transition-all border border-border-default active:scale-95 shadow-sm">
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 p-6 relative flex flex-col items-center justify-center bg-transparent">
                        <div className="absolute inset-0 m-6 border border-border-subtle rounded bg-background-elevated/40 flex flex-col items-center justify-center">
                            <span className="text-text-tertiary font-mono text-sm opacity-50">[ Live Market Chart: NIFTY 5m ]</span>
                            <span className="text-text-tertiary text-xs mt-2 opacity-30">Vertical marker at {new Date(news.timestamp).toLocaleTimeString()}</span>
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
