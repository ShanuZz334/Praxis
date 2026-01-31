import React from 'react';

// Static Educational Content Map for Fundamentals
const getEducationalContent = (category, label) => {
    const Cat = (category || '').toLowerCase();

    if (Cat === 'valuation') {
        return {
            usage: "Measures whether the market is cheap or expensive relative to historical norms.",
            read: "• Low PE/PB: Potential Value / Undervalued\n• High PE/PB: Potential Overvaluation / Growth Premium\n• Watch Yield Spreads vs Bonds.",
            keyPoint: "Mean reversion is powerful in valuation. Extremes rarely persist indefinitely without earnings catching up."
        };
    }
    if (Cat === 'earnings') {
        return {
            usage: "Tracks corporate profitability and growth trajectory.",
            read: "• Rising EPS: Strong fundamental support\n• Earnings Miss: Potential for sharp correction\n• Margins: Measure of pricing power.",
            keyPoint: "Price follows earnings in the long run. Acceleration in EPS growth is the strongest driver of multi-baggers."
        };
    }
    if (Cat === 'macro') {
        return {
            usage: "Broad economic indicators affecting all asset classes.",
            read: "• GDP Growth: Economic Engine\n• CPI (Inflation): Rate Sensitivity\n• Policy Stance: Dovish (Buy) vs Hawkish (Sell).",
            keyPoint: "Don't fight the Fed. Macro liquidity tides lift or sink all boats."
        };
    }
    if (Cat === 'liquidity') {
        return {
            usage: "Measures the flow of money into equities.",
            read: "• FII/DII Inflows: Bullish Fuel\n• System Liquidity: Banking surplus/deficit\n• High Flows: Valuation expansion.",
            keyPoint: "Liquidity drives short-term price diverging from fundamentals. Follow the big money flows."
        };
    }
    if (Cat === 'sector') {
        return {
            usage: "Health of specific industry groups.",
            read: "• Rotation: Money moving from expensive to cheap sectors\n• Concentration: Market breadth health.",
            keyPoint: "Sector leadership changes in every cycle. Ensure you are in the leading sectors, not lagging ones."
        };
    }
    if (Cat === 'corporate') {
        return {
            usage: "Balance sheet health and credit cycles.",
            read: "• Credit Growth: Capec Cycle indicator\n• Corp Debt: Systemic risk monitor\n• Tax Env: Profitability impact.",
            keyPoint: "A deleveraging cycle is painful but sets the stage for a structurally sound bull run."
        };
    }
    if (Cat === 'global') {
        return {
            usage: "International correlations and external shocks.",
            read: "• USDINR: Currency stability\n• Crude: Input cost pressure\n• Global Growth: Export demand.",
            keyPoint: "In a connected world, EM markets like India often trade as a high-beta proxy to US Tech or Global Risk."
        };
    }
    if (Cat === 'risk') {
        return {
            usage: "Systemic stress indicators.",
            read: "• Sovereign Risk: CDS Spreads\n• NPA: Banking Health\n• Volatility: Fear Index.",
            keyPoint: "Risk happens slowly, then all at once. Watch for stress signs in bond and currency markets first."
        };
    }

    // Default
    return {
        usage: "Fundamental metric for market analysis.",
        read: "• Compare current value to historical mean.\n• Look for trend changes.\n• Verify source data integrity.",
        keyPoint: "Fundamentals tell you what to buy, Technicals tell you when to buy."
    };
};

export default function FundamentalInterpretationDesk({ card }) {
    if (!card) return null;

    const edu = getEducationalContent(card.category, card.label);

    return (
        <div className="
            w-[280px] shrink-0
            flex flex-col gap-4
            animate-in fade-in slide-in-from-right-4 duration-500
        ">
            <div className="
                relative overflow-hidden
                bg-[var(--bg-tooltip)]
                border border-border-default
                rounded-2xl
                p-5
                shadow-2xl
                flex flex-col gap-5
            ">
                {/* HEADER */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-md bg-background-elevated flex items-center justify-center border border-border-subtle text-accent-primary text-xs font-bold font-serif italic">i</div>
                    <span className="text-accent-primary text-[11px] font-bold tracking-widest uppercase">Metric Guide</span>
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
                    <h3 className="text-[10px] font-extrabold text-state-bullish-text uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 bg-state-bullish-text rounded-full" />
                        Analysis Framework
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
                    Stocky Fundamentals
                </div>
            </div>
        </div>
    );
}
