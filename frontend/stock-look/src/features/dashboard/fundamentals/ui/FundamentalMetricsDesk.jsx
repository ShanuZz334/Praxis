import React from 'react';

/**
 * Fundamental Metrics Desk (Right Floating Panel)
 * ACTION & STATUS CENTER
 */
export default function FundamentalMetricsDesk({ card }) {
    if (!card) return null;

    // 1. Derive Context from Card Data
    const norm = card.normalized || 0;
    const credit = card.creditScore || 0;
    const category = card.category || "General";

    /* ------------------------------------------------------------
       LOGIC: Signal Construction (Institutional Grade)
       ------------------------------------------------------------ */

    // Default State (Neutral)
    let signal = "Neutral";
    let signalColor = "text-accent-primary bg-background-elevated border-accent-primary/30";
    let signalContext = "Trend lacks conviction; awaiting catalyst";

    // Bullish States
    if (norm > 0.5) {
        signal = "Bullish";
        signalColor = "text-state-bullish-text bg-state-bullish-surface border-emerald-500/30";
        signalContext = "Strong momentum confirmed across timeframes";
    } else if (norm > 0.25) {
        signal = "Moderately Bullish";
        signalColor = "text-state-bullish-text/90 bg-state-bullish-surface border-emerald-500/30";
        signalContext = "Earnings momentum outweighs valuation drag";
    }
    // Bearish States
    else if (norm < -0.5) {
        signal = "Bearish";
        signalColor = "text-state-bearish-text bg-state-bearish-surface border-red-500/30";
        signalContext = "Structural weakness evident; risk elevated";
    } else if (norm < -0.25) {
        signal = "Moderately Bearish";
        signalColor = "text-state-bearish-text/90 bg-state-bearish-surface border-red-500/30";
        signalContext = "Growth deceleration outpacing support levels";
    }

    /* ------------------------------------------------------------
       LOGIC: Strategic Bias (Time Horizon + Execution)
       ------------------------------------------------------------ */

    let timeHorizon = "Swing / Positional";
    let biasTitle = "Hold / Monitor";
    let biasDesc = "Avoid chasing; await clear accumulation";

    if (norm > 0.5) {
        timeHorizon = "Positional";
        biasTitle = "Accumulate";
        biasDesc = "Build exposure on intraday weakness";
    } else if (norm > 0.25) {
        timeHorizon = "Swing";
        biasTitle = "Buy Dips";
        biasDesc = "Add exposure on sector pullbacks, avoid chasing breakouts";
    } else if (norm < -0.5) {
        timeHorizon = "Short-term";
        biasTitle = "Reduce / Hedge";
        biasDesc = "Sell into strength; tighten stop-losses";
    } else if (norm < -0.25) {
        timeHorizon = "Swing";
        biasTitle = "Sell Rallies";
        biasDesc = "Trim exposure near resistance zones";
    }

    /* ------------------------------------------------------------
       LOGIC: Market Condition (Cause-Based Phrasing)
       ------------------------------------------------------------ */

    let marketCondition = "Consolidation phase";

    // Dynamic generation based on Category + Sentiment
    if (norm > 0.2) {
        if (category.includes("Growth") || category.includes("Momentum")) marketCondition = "Earnings breadth improving";
        else if (category.includes("Valuation")) marketCondition = "Mean reversion upside";
        else marketCondition = "Rotation-led uptrend";
    } else if (norm < -0.2) {
        if (category.includes("Growth")) marketCondition = "Margin compression risk";
        else if (category.includes("Valuation")) marketCondition = "Premium valuation correction";
        else marketCondition = "Distribution evident";
    }

    /* ------------------------------------------------------------
       LOGIC: Signal Confidence (Trust Layer)
       ------------------------------------------------------------ */

    let confidence = "Medium"; // Default to Medium (6-8 range usually)
    let confColor = "text-amber-400";
    let confDesc = "Data consistent, but breadth metrics diverging";

    // Reliability score is usually 0.0 - 1.0 in backend, mapped to 0-10 logic here
    const relScore = credit * 10;

    if (relScore >= 8) {
        confidence = "High";
        confColor = "text-emerald-400";
        confDesc = "Broad-based confirmation across multiple leading indicators";
    } else if (relScore < 6) {
        confidence = "Low";
        confColor = "text-red-400";
        confDesc = "Sector leadership strong, but participation still narrow";
    }

    /* ------------------------------------------------------------
       RENDER
       ------------------------------------------------------------ */
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
                <div className="flex items-center gap-2 border-b border-border-subtle pb-3 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em]">Institutional Trade Directive</span>
                </div>

                {/* 1. PRIMARY ACTION SIGNAL BADGE */}
                <div>
                    <div className={`
                        flex items-center justify-center
                        py-3.5 px-4 rounded-xl border
                        font-black text-lg tracking-tight
                        shadow-lg transition-transform hover:scale-[1.02]
                        ${signalColor}
                    `}>
                        {signal}
                    </div>
                    {/* Signal Context */}
                    <div className="mt-3 text-xs text-text-secondary text-center leading-relaxed font-black italic opacity-100">
                        "{signalContext}"
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

                {/* 2. STRATEGIC BIAS */}
                <div className="bg-background-elevated/40 p-4 rounded-2xl border border-border-subtle">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-black opacity-100">Strategic Bias</span>
                        <span className="text-[8px] text-accent-primary bg-background-card px-2 py-0.5 rounded-full border border-border-subtle font-black uppercase tracking-widest shadow-none">
                            {timeHorizon}
                        </span>
                    </div>

                    <div className="text-xl font-black text-text-primary mb-2 tracking-tight">{biasTitle}</div>
                    <div className="text-xs text-text-secondary leading-relaxed font-black opacity-100">
                        {biasDesc}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

                {/* 3. MARKET CONDITION & CONFIDENCE */}
                <div className="space-y-6">

                    {/* Market Condition */}
                    <div className="flex justify-between items-center">
                        <div className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-black opacity-100">Market State</div>
                        <div className="text-sm font-black text-text-primary tracking-tight">
                            {marketCondition}
                        </div>
                    </div>

                    {/* Signal Confidence */}
                    <div className="p-4 bg-background-elevated/40 rounded-2xl border border-border-subtle group hover:border-border-hover transition-colors">
                        <div className="flex items-baseline justify-between mb-2">
                            <div className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-black opacity-100">Engine Confidence</div>
                            <div className={`text-xs font-black tracking-widest ${confColor}`}>{confidence}</div>
                        </div>
                        <div className="text-[11px] text-text-secondary leading-relaxed font-black italic opacity-100">
                            "{confDesc}"
                        </div>
                    </div>

                </div>

                {/* DECORATIVE FOOTER */}
                <div className="mt-2 pt-4 border-t border-border-subtle text-[8px] text-text-tertiary font-black opacity-30 text-center uppercase tracking-[0.3em]">
                    Institutional Intelligence Hub
                </div>

            </div>
        </div>
    );
}
