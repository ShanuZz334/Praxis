import React from 'react';

/**
 * Technical Metrics Desk -> Now "AI Insight"
 * Provides dynamic analysis of the current signal.
 */
export default function TechnicalMetricsDesk({ card }) {
    if (!card) return null;

    // 1. Derive Context
    const norm = card.normalized || 0;
    const trendState = card.trendState || "Stable";

    // AI LOGIC (Moved from InterpretationDesk)
    const isBullish = norm > 0.2;
    const isBearish = norm < -0.2;

    // Generate AI Insight Text
    let insightText = "Indicator is neutral, suggesting consolidation or lack of clear directional bias.";
    let contextText = "Market awaits a catalyst.";
    let sentimentColor = "text-slate-400";

    if (isBullish) {
        insightText = `Indicator is showing constructive strength (${card.raw} ${card.unit}), supporting the broader bullish thesis.`;
        contextText = "Momentum is accelerating upwards.";
        sentimentColor = "text-emerald-400";
    } else if (isBearish) {
        insightText = `Technical deterioration visible (${card.raw} ${card.unit}). Momentum is stalling or reversing downside.`;
        contextText = "Selling pressure dominating recent bars.";
        sentimentColor = "text-red-400";
    }

    return (
        <div className="
            w-[260px] shrink-0
            flex flex-col gap-4
            animate-in fade-in slide-in-from-right-4 duration-500
        ">
            {/* GLASS CONTAINER */}
            <div className="
                bg-[#0b1220]/95 backdrop-blur-2xl
                border border-white/10
                rounded-2xl
                p-6
                shadow-2xl
                flex flex-col gap-6
            ">
                {/* HEADER LABEL */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse box-shadow-purple" />
                    <span className="text-[10px] font-bold text-purple-200/80 uppercase tracking-[0.2em]">AI Analysis</span>
                </div>

                {/* 1. AI INSIGHT (Dynamic) */}
                <div>
                    <div className={`text-[13px] font-medium leading-relaxed mb-4 ${sentimentColor} drop-shadow-sm`}>
                        <span className="text-2xl mr-2 align-middle opacity-50">{isBullish ? '↗' : isBearish ? '↘' : '→'}</span>
                        {insightText}
                    </div>
                    <div className="bg-gradient-to-r from-white/[0.04] to-transparent rounded-l-lg border-l-2 border-white/20 p-3 pl-4">
                        <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1.5">Market Context</div>
                        <div className="text-xs text-white/80 font-normal leading-snug italic">
                            "{contextText}"
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* 2. REGIME & TREND STATE */}
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Trend State</div>
                        <div className="text-xs font-bold text-white/90 mt-0.5">{trendState}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Regime</div>
                        <div className="text-xs font-bold text-white/90 mt-0.5">{Math.abs(norm) > 0.5 ? 'Trending' : 'Range'}</div>
                    </div>
                </div>



                {/* DECORATIVE FOOTER */}
                <div className="mt-2 pt-4 border-t border-white/5 text-[9px] text-white/20 text-center uppercase tracking-[0.2em]">
                    Stocky Intelligence
                </div>

            </div>
        </div>
    );
}
