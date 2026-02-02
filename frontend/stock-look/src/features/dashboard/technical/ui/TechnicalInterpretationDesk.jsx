import React from 'react';

// Static Educational Content Map (Simplified for brevity, can be expanded)
const getEducationalContent = (category, label) => {
    const l = label.toLowerCase();

    if (l.includes('rsi')) {
        return {
            usage: "Measures the speed and change of price movements.",
            read: "• Above 80: Overbought (Potential Sell)\n• Below 20: Oversold (Potential Buy)\n• Crossing 50: Trend Confirmation",
            keyPoint: "Watch for Divergence: If price makes a higher high but RSI makes a lower high, a reversal may be imminent."
        };
    }
    if (l.includes('macd')) {
        return {
            usage: "Trend-following momentum indicator.",
            read: "• MACD > Signal: Bullish\n• MACD < Signal: Bearish\n• Histogram expanding: Momentum increasing",
            keyPoint: "Centerline Crossovers indicate a change in the primary trend direction."
        };
    }
    if (l.includes('adx')) {
        return {
            usage: "Quantifies trend strength regardless of direction.",
            read: "• ADX > 25: Strong Trend\n• ADX < 20: Weak/Sideways Market\n• Rising ADX: Trend strengthening",
            keyPoint: "ADX does not indicate direction. Combine with Price Action to determine Bullish/Bearish bias."
        };
    }
    if (category === 'Trend') {
        return {
            usage: "Identifies the general direction of the market prices.",
            read: "• Price > Indicator: Bullish Bias\n• Price < Indicator: Bearish Bias\n• Slope Up: Uptrend",
            keyPoint: "Trend indicators lag price but are excellent for filtering out noise in strong moves."
        };
    }
    if (category === 'Momentum') {
        return {
            usage: "Identifies the speed of price movement.",
            read: "• High Values: Strong Upward Momentum\n• Low Values: Strong Downward Momentum\n• Extremes: Reversal Warning",
            keyPoint: "Momentum often precedes price. Look for momentum slowing down before price reverses."
        };
    }
    if (category === 'Volatility') {
        return {
            usage: "Measures the rate of price fluctuations.",
            read: "• High Value: High Risk/Opportunity\n• Low Value: Consolidation/Squeeze\n• Spikes: Panic or Euphoria",
            keyPoint: "Low volatility periods are often followed by explosive breakouts (The Squeeze)."
        };
    }

    // Default
    return {
        usage: "Technical analysis tool for market structure.",
        read: "• Compare current value to historical mean.\n• Look for confirmation with price action.\n• Watch for extremes.",
        keyPoint: "Always use in conjunction with other signals for higher probability setups."
    };
};

export default function TechnicalInterpretationDesk({ card }) {
    if (!card) return null;

    const edu = getEducationalContent(card.category, card.label);

    return (
        <div className="
            w-full lg:w-[280px] shrink-0
            flex flex-col gap-4
            animate-in fade-in slide-in-from-right-4 duration-500
        ">
            <div className="
                relative overflow-hidden
                bg-background-tooltip
                border border-border-default
                rounded-2xl
                p-5
                shadow-2xl
                flex flex-col gap-5
            ">
                {/* HEADER */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-md bg-background-elevated flex items-center justify-center border border-border-subtle text-accent-primary text-xs font-bold font-serif italic">i</div>
                    <span className="text-accent-primary text-[11px] font-bold tracking-widest uppercase">Indicator Guide</span>
                </div>

                {/* 1. OVERVIEW / USAGE */}
                <div>
                    <h3 className="text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide opacity-50">Definition</h3>
                    <p className="text-xs text-text-secondary leading-relaxed font-normal">
                        {card.desc || edu.usage}
                    </p>
                </div>

                {/* 2. HOW TO READ */}
                <div className="bg-background-elevated/40 rounded-xl p-4 border border-border-subtle transition-all hover:border-border-hover">
                    <h3 className="text-[10px] font-extrabold text-accent-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 bg-accent-primary rounded-full" />
                        Market Interpretation
                    </h3>
                    <div className="text-xs text-text-secondary leading-loose whitespace-pre-line font-medium pl-1">
                        {edu.read}
                    </div>
                </div>

                {/* 3. MAJOR POINT / PRO TIP */}
                <div className="relative pl-1">
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-amber-500/40 rounded-full" />
                    <div className="pl-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-amber-600 text-[10px] font-black tracking-wider uppercase">Pro Insight</span>
                        </div>
                        <p className="text-xs text-text-tertiary leading-relaxed italic font-medium">
                            "{edu.keyPoint}"
                        </p>
                    </div>
                </div>

                {/* DECORATIVE */}
                <div className="mt-auto pt-4 border-t border-border-subtle text-[9px] text-text-tertiary opacity-30 text-center uppercase tracking-[0.3em] font-light">
                    Stocky Education Module
                </div>
            </div>
        </div>
    );
}
