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
    let sentimentColor = "text-text-tertiary";

    if (isBullish) {
        insightText = `Indicator is showing constructive strength (${card.raw} ${card.unit}), supporting the broader bullish thesis.`;
        contextText = "Momentum is accelerating upwards.";
        sentimentColor = "text-state-bullish-text";
    } else if (isBearish) {
        insightText = `Technical deterioration visible (${card.raw} ${card.unit}). Momentum is stalling or reversing downside.`;
        contextText = "Selling pressure dominating recent bars.";
        sentimentColor = "text-state-bearish-text";
    }

    return (
        <div className="
            w-[260px] shrink-0
            flex flex-col gap-4
            animate-in fade-in slide-in-from-right-4 duration-500
        ">
            {/* GLASS CONTAINER */}
            <div className="
                bg-background-tooltip
                border border-border-default
                rounded-2xl
                p-6
                shadow-2xl
                flex flex-col gap-6
            ">
                {/* HEADER LABEL */}
                <div className="flex items-center gap-3 border-b border-border-subtle pb-3 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em]">Quant AI Analysis</span>
                </div>

                {/* 1. AI INSIGHT (Dynamic) */}
                <div>
                    <div className={`text-[13px] font-bold leading-relaxed mb-5 ${sentimentColor}`}>
                        <span className="text-2xl mr-2 align-middle opacity-50">{isBullish ? '↗' : isBearish ? '↘' : '→'}</span>
                        {insightText}
                    </div>
                    <div className="bg-background-elevated/60 rounded-xl border border-border-subtle p-4">
                        <div className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-black mb-1.5 opacity-100">Market Context</div>
                        <div className="text-xs text-text-primary font-black leading-relaxed italic opacity-100">
                            "{contextText}"
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

                {/* 2. REGIME & TREND STATE */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-2.5 bg-background-elevated/40 rounded-lg border border-border-subtle">
                        <div className="text-[9px] text-text-secondary uppercase tracking-widest font-black opacity-100">Trend State</div>
                        <div className="text-xs font-black text-text-primary mt-1">{trendState}</div>
                    </div>
                    <div className="p-2.5 bg-background-elevated/40 rounded-lg border border-border-subtle text-right">
                        <div className="text-[9px] text-text-secondary uppercase tracking-widest font-black opacity-100">Regime</div>
                        <div className="text-xs font-black text-text-primary mt-1">{Math.abs(norm) > 0.5 ? 'Trending' : 'Range'}</div>
                    </div>
                </div>

                {/* DECORATIVE FOOTER */}
                <div className="mt-2 pt-4 border-t border-border-subtle text-[8px] text-text-tertiary font-black opacity-30 text-center uppercase tracking-[0.3em]">
                    Intelligence Engine v4.0
                </div>

            </div>
        </div>
    );
}
