import React from 'react';

/**
 * Interpretation Desk (Left Floating Panel)
 * Displays functional insights about the selected metric.
 */
export default function InterpretationDesk({ card }) {
    const content = getInterpretation(card);

    return (
        <div className="
            w-[280px] shrink-0
            flex flex-col gap-4
            animate-in fade-in slide-in-from-right-4 duration-500
        ">
            {/* GLASS CONTAINER */}
            <div className="
                relative overflow-hidden
                bg-[#0b1220]/80 backdrop-blur-xl
                border border-white/10
                rounded-2xl
                p-5
                shadow-2xl
                flex flex-col gap-5
            ">
                {/* AI INSIGHT SUMMARY */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400 text-xs font-bold tracking-wider uppercase">AI Insight</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed font-light">
                        {content.summary}
                    </p>
                </div>

                {/* REGIME TAG */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-xs text-white/50 mb-1 uppercase tracking-wide">Market Regime</div>
                    <div className={`text-lg font-medium flex items-center gap-2 ${content.regimeColor}`}>
                        <span className="w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                        {content.regime}
                    </div>
                </div>

                {/* HISTORICAL CONTEXT */}
                <div>
                    <div className="text-xs text-white/50 mb-3 uppercase tracking-wide">Historical Context</div>
                    <div className="space-y-3">
                        {content.historyPoints.map((point, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs text-white/70">
                                <span className="mt-1 w-1 h-1 rounded-full bg-white/20 shrink-0" />
                                <span>{point}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RISK/CONFIRMATION NARRATIVE */}
                <div className={`
                    p-3 rounded-lg border
                    ${content.isRisk
                        ? 'bg-red-500/10 border-red-500/20 text-red-100'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100'}
                `}>
                    <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                        {content.isRisk ? '⚠ Risk Alert' : '✓ Confirmation'}
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed">
                        {content.narrative}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// HELPER: Generate Interpretation Content
// ----------------------------------------------------------------------
function getInterpretation(card) {
    // Default Fallback
    const base = {
        summary: "Metric tracking steady within expected volatility bands. No immediate structural shift detected.",
        regime: "Neutral",
        regimeColor: "text-gray-400",
        historyPoints: [
            "Trading near 5-year average",
            "Volatility remains subdued",
            "Consistent with broader sector trends"
        ],
        narrative: "Monitor for breakout above recent resistance levels to confirm trend continuation.",
        isRisk: false
    };

    if (!card) return base;

    const id = card.id;
    const norm = card.normalized || 0;
    const isHigh = norm > 0.5;
    const isLow = norm < -0.5;

    // --- CUSTOM LOGIC PER METRIC (Sample of 36) ---

    // 1. VALUATION: NIFTY PE
    if (id === 'nifty_pe') {
        return {
            summary: isHigh
                ? "Index valuations have expanded significantly, pricing in aggressive growth assumptions."
                : "Valuations have cooled to attractive levels, offering a margin of safety for long-term entry.",
            regime: isHigh ? "Expensive" : isLow ? "Undervalued" : "Fair Value",
            regimeColor: isHigh ? "text-red-400" : isLow ? "text-emerald-400" : "text-blue-400",
            historyPoints: [
                `Currently in the ${isHigh ? '85th+' : isLow ? 'bottom 20' : '40-60th'} percentile`,
                "Mean reversion likely over 12m horizon",
                "Premium spread vs Emerging Markets"
            ],
            narrative: isHigh
                ? "Upside capped by multiple compression risk. Earnings growth must do the heavy lifting."
                : "Classic accumulation zone supported by historical mean reversion setups.",
            isRisk: isHigh
        };
    }

    // 2. EARNINGS: EPS GROWTH
    if (id === 'eps_yoy' || id === 'earnings_revision') {
        const isStrong = norm > 0.2;
        return {
            summary: isStrong
                ? "Corporate earnings engines are firing, with broad-based upgrades supporting the rally."
                : "Earnings momentum is decelerating, creating headwinds for further index expansion.",
            regime: isStrong ? "Expansion" : "Slowdown",
            regimeColor: isStrong ? "text-emerald-400" : "text-orange-400",
            historyPoints: [
                "Growth driven by Banking & Auto",
                "Margins stabilizing despite input costs",
                "Revisions breadth remains positive"
            ],
            narrative: isStrong
                ? "Fundamentals justify current price action. Dip buying remains favored."
                : "Price vs Earnings divergence widening. Caution warranted.",
            isRisk: !isStrong
        };
    }

    // 3. MACRO: GDP / CPI
    if (id === 'mcap_gdp' || id === 'cpi') {
        const isHot = id === 'cpi' ? norm > 0.5 : norm > 0.8;
        return {
            summary: "Macro backdrop remains the primary driver. Global liquidity cycles are turning favorable.",
            regime: isHot ? "Overheated" : "Stable",
            regimeColor: isHot ? "text-red-400" : "text-blue-400",
            historyPoints: [
                "GDP growth outpaces global peers",
                "Inflation trajectory controlled",
                "Fiscal prudence maintained"
            ],
            narrative: "Macro stability commands a premium valuation for Indian equities.",
            isRisk: isHot
        };
    }

    // 4. LIQUIDITY: FII / DII
    if (id === 'fii' || id === 'dii' || card.category === 'Liquidity') {
        const positiveFlows = card.raw > 0;
        return {
            summary: positiveFlows
                ? "Liquidity abundance is driving asset inflation across quality tiers."
                : "Liquidity withdrawal is compressing multiples in high-beta pockets.",
            regime: positiveFlows ? "Liquidity Surplus" : "Tightening",
            regimeColor: positiveFlows ? "text-emerald-400" : "text-red-400",
            historyPoints: [
                positiveFlows ? "Sustained inflows for 3 months" : "Selling absorption by DIIs",
                "System liquidity remains neutral",
                "Flow dominance shifting to Large Caps"
            ],
            narrative: "Follow the money. Momentum remains strong while flows persist.",
            isRisk: !positiveFlows
        };
    }

    // 5. SECTOR / BREADTH
    if (card.category === 'Sector' || id.includes('sector')) {
        return {
            summary: "Sector rotation is evident. Capital is moving from defensive to cyclicals.",
            regime: "Rotation",
            regimeColor: "text-blue-400",
            historyPoints: [
                "Leadership narrowing to top 5 weights",
                "Small-cap participation lagging",
                "Relative strength vs Nifty is rising"
            ],
            narrative: "Focus on leaders. Laggards are likely value traps in this environment.",
            isRisk: false
        };
    }

    // 6. RISK / STRESS
    if (card.category === 'Risk' || id === 'vix' || id === 'sovereign_risk') {
        const isStress = norm > 0.5;
        return {
            summary: isStress
                ? "Systemic stress indicators are flashing warning signals. Hedging is advised."
                : "Financial conditions remain loose with no immediate stress visible.",
            regime: isStress ? "High Stress" : "Calm",
            regimeColor: isStress ? "text-red-400" : "text-emerald-400",
            historyPoints: [
                "VIX below long-term average",
                "Credit spreads stable",
                "Currency volatility managed"
            ],
            narrative: isStress
                ? "Reduce beta exposure. Cash conservation is priority."
                : "Environment supports risk-taking strategies.",
            isRisk: isStress
        };
    }

    // Generic Logic for others based on Normalized Score
    if (norm > 0.6) {
        return {
            summary: "Metric is extended to the upside. Statistical probability favors a pause or correction.",
            regime: "Extreme Bullish",
            regimeColor: "text-red-400",
            historyPoints: ["2 Standard Deviations > Mean", "Historic resistance zone", "Euphoria phase"],
            narrative: "Risk/Reward is unfavorable for fresh entries. Tighten stops.",
            isRisk: true
        };
    }
    if (norm < -0.6) {
        return {
            summary: "Metric is deeply depressed. Surrender selling may be nearing exhaustion.",
            regime: "Extreme Bearish",
            regimeColor: "text-emerald-400",
            historyPoints: ["2 Standard Deviations < Mean", "Historic support zone", "Capitulation phase"],
            narrative: "Contrarian opportunity emerging. Watch for reversal signals.",
            isRisk: false
        };
    }

    return base;
}
