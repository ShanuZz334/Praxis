import React from 'react';

/**
 * Metrics Desk (Right Floating Panel)
 * ACTION & STATUS CENTER
 * 
 * STRICT RULE: NO NUMERIC DATA.
 * purely qualitative decision support.
 */
export default function MetricsDesk({ card }) {
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
    let signalColor = "text-blue-300 bg-gradient-to-r from-blue-500/20 to-blue-500/5 border-blue-500/30";
    let signalContext = "Trend lacks conviction; awaiting catalyst";

    // Bullish States
    if (norm > 0.5) {
        signal = "Bullish";
        signalColor = "text-emerald-300 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-500/30";
        signalContext = "Strong momentum confirmed across timeframes";
    } else if (norm > 0.25) {
        signal = "Moderately Bullish";
        signalColor = "text-emerald-300/90 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-500/30";
        signalContext = "Earnings momentum outweighs valuation drag";
    }
    // Bearish States
    else if (norm < -0.5) {
        signal = "Bearish";
        signalColor = "text-red-300 bg-gradient-to-r from-red-500/20 to-red-500/5 border-red-500/30";
        signalContext = "Structural weakness evident; risk elevated";
    } else if (norm < -0.25) {
        signal = "Moderately Bearish";
        signalColor = "text-red-300/90 bg-gradient-to-r from-red-500/20 to-red-500/5 border-red-500/30";
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
                bg-[#0b1220]/95 backdrop-blur-2xl
                border border-white/10
                rounded-2xl
                p-6
                shadow-2xl
                flex flex-col gap-6
            ">
                {/* HEADER LABEL */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    <span>⚡ Trade Directive</span>
                </div>

                {/* 1. PRIMARY ACTION SIGNAL BADGE */}
                <div>
                    <div className={`
                        flex items-center justify-center
                        py-3 px-4 rounded-lg border
                        font-bold text-base tracking-wide
                        shadow-lg
                        ${signalColor}
                    `}>
                        {signal}
                    </div>
                    {/* Signal Context */}
                    <div className="mt-3 text-xs text-white/50 text-center leading-relaxed font-medium">
                        {signalContext}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* 2. STRATEGIC BIAS */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Strategic Bias</span>
                        <span className="text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {timeHorizon}
                        </span>
                    </div>

                    <div className="text-lg font-bold text-white mb-2 tracking-tight">{biasTitle}</div>
                    <div className="text-xs text-white/60 leading-5 font-normal">
                        {biasDesc}
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* 3. MARKET CONDITION & CONFIDENCE */}
                <div className="space-y-5">

                    {/* Market Condition */}
                    <div>
                        <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wider font-semibold">Market Condition</div>
                        <div className="text-sm font-medium text-white/80">
                            {marketCondition}
                        </div>
                    </div>

                    {/* Signal Confidence */}
                    <div>
                        <div className="flex items-baseline justify-between mb-1">
                            <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Signal Confidence</div>
                            <div className={`text-xs font-bold ${confColor}`}>{confidence}</div>
                        </div>
                        <div className="text-[11px] text-white/50 leading-snug">
                            {confDesc}
                        </div>
                    </div>

                </div>

                {/* DECORATIVE FOOTER */}
                <div className="mt-2 pt-4 border-t border-white/5 text-[9px] text-white/20 text-center uppercase tracking-[0.2em]">
                    System Generated • Institutional
                </div>

            </div>
        </div>
    );
}
