/**
 * @file GlobalInterpretationDesk.jsx
 * @purpose Educational and context providing sidebar for Global metrics.
 * @responsibilities
 * - Explains "What It Measures" for complex financial metrics (e.g., DXY, Move Index).
 * - Describes "Impact on India" (e.g., Rising Crude = Inflationary).
 * - Provides "Key Insights" or Pro-Tips for traders.
 * @key_exports
 * - GlobalInterpretationDesk (Default Component)
 * @dependencies
 * - React
 * @lifecycle
 * - Rendered in Modals or Sidebars when a metric is selected.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from 'react';

// =============================
// Content Database / Logic
// =============================
const getEducationalContent = (category, label, id) => {
    const cat = category?.toLowerCase() || '';
    const lbl = label?.toLowerCase() || '';

    // 1. CURRENCIES
    if (cat.includes('currency')) {
        if (lbl.includes('dxy') || lbl.includes('dollar')) {
            return {
                usage: "Measures the value of the US Dollar against a basket of major currencies. A strong dollar tightens global liquidity.",
                read: "• DXY > 105: Strong Dollar (Risk-Off)\n• DXY < 95: Weak Dollar (Risk-On)\n• Rising DXY: FII outflow risk for EM",
                keyPoint: "Strong DXY typically correlates with FII selling in Indian equities as dollar-denominated returns compress."
            };
        }
        if (lbl.includes('eur')) {
            return {
                usage: "EUR/USD is the world's most traded currency pair. Reflects relative strength of Eurozone vs US economy.",
                read: "• EUR/USD > 1.10: Euro strength\n• EUR/USD < 1.05: Euro weakness\n• Trend impacts global risk appetite",
                keyPoint: "EUR weakness often signals European growth concerns, which can spill over to global markets."
            };
        }
        if (lbl.includes('jpy') || lbl.includes('yen')) {
            return {
                usage: "USD/JPY reflects carry trade dynamics. Yen weakness = risk-on, Yen strength = risk-off unwinding.",
                read: "• USD/JPY > 145: Yen very weak (Carry trade active)\n• USD/JPY < 130: Yen strength (Risk-off)\n• Sharp moves trigger volatility",
                keyPoint: "Sudden Yen strength can trigger global carry trade unwinding, causing sharp equity selloffs."
            };
        }
        return {
            usage: "Currency pairs reflect relative economic strength and capital flows between nations.",
            read: "• Monitor trend direction\n• Watch for sharp reversals\n• Correlate with commodity prices",
            keyPoint: "Currency moves impact import costs, corporate earnings, and foreign investor flows into India."
        };
    }

    // 2. INDICES
    if (cat.includes('indices')) {
        if (lbl.includes('s&p') || lbl.includes('sp500')) {
            return {
                usage: "Benchmark for US equities and global risk sentiment. Nifty has 60-70% correlation with S&P 500.",
                read: "• S&P near ATH: Risk-On globally\n• S&P correction > 5%: Defensive mode\n• Watch tech sector leadership",
                keyPoint: "S&P 500 direction often leads Nifty by 1-2 sessions. Use for overnight gap prediction."
            };
        }
        if (lbl.includes('nasdaq')) {
            return {
                usage: "Tech-heavy index reflecting growth stock sentiment. Rate-sensitive and momentum-driven.",
                read: "• Nasdaq outperformance: Growth > Value\n• Nasdaq underperformance: Rotation to defensives\n• Watch FAANG performance",
                keyPoint: "Nasdaq weakness often precedes Indian IT sector underperformance due to global tech sentiment."
            };
        }
        if (lbl.includes('nikkei')) {
            return {
                usage: "Japanese equity benchmark. Benefits from Yen weakness (export competitiveness).",
                read: "• Nikkei strength: Asian risk-on\n• Correlation with USD/JPY\n• Watch for BOJ policy shifts",
                keyPoint: "Nikkei strength with weak Yen signals healthy risk appetite in Asia, supportive for Nifty."
            };
        }
        return {
            usage: "Global equity indices reflect regional economic health and risk appetite.",
            read: "• Compare relative performance\n• Watch for divergences\n• Monitor sector leadership",
            keyPoint: "Global indices provide early warning signals for Nifty direction through overnight price action."
        };
    }

    // 3. COMMODITIES
    if (cat.includes('commodities')) {
        if (lbl.includes('gold')) {
            return {
                usage: "Ultimate safe haven asset. Inverse correlation with real yields and dollar strength.",
                read: "• Gold > $2000: Risk-off or inflation hedge\n• Gold < $1800: Risk-on environment\n• Watch real yields correlation",
                keyPoint: "Gold strength signals either fear (safe haven) or inflation concerns. Context matters for equity impact."
            };
        }
        if (lbl.includes('crude') || lbl.includes('oil')) {
            return {
                usage: "Critical for India as 85% oil is imported. Rising crude = inflation + CAD pressure.",
                read: "• Crude > $90: Inflation risk for India\n• Crude < $70: Benign for OMCs\n• Watch OPEC+ decisions",
                keyPoint: "Every $10 rise in crude adds ~0.4% to India's inflation and widens current account deficit."
            };
        }
        if (lbl.includes('copper')) {
            return {
                usage: "Dr. Copper - economic health indicator. Used in construction, manufacturing, EVs.",
                read: "• Copper strength: Growth optimism\n• Copper weakness: Recession fears\n• Watch China demand",
                keyPoint: "Copper is a leading indicator for global growth. Strength supports cyclical sectors in India."
            };
        }
        return {
            usage: "Commodity prices impact inflation, import costs, and sector profitability in India.",
            read: "• Rising commodities: Inflation risk\n• Falling commodities: Margin relief\n• Watch currency impact",
            keyPoint: "India is a net commodity importer. Rising prices pressure CAD and corporate margins."
        };
    }

    // 4. RATES & VOLATILITY
    if (cat.includes('rates') || cat.includes('volatility')) {
        if (lbl.includes('10y') || lbl.includes('yield')) {
            return {
                usage: "US 10-year yield is the global risk-free rate. Rising yields pressure equity valuations.",
                read: "• Yield > 4.5%: Headwind for equities\n• Yield < 3.5%: Supportive for risk assets\n• Watch Fed policy expectations",
                keyPoint: "Rising US yields trigger FII outflows from EM equities as opportunity cost of risk increases."
            };
        }
        if (lbl.includes('vix')) {
            return {
                usage: "Fear gauge for S&P 500. Spikes during market stress, mean-reverts during calm.",
                read: "• VIX > 20: Elevated fear\n• VIX < 15: Complacency\n• Spikes > 30: Panic selling",
                keyPoint: "VIX spikes often coincide with India VIX spikes. Use for hedging and position sizing decisions."
            };
        }
        if (lbl.includes('move')) {
            return {
                usage: "Bond market volatility index. Elevated MOVE signals rate uncertainty and risk-off.",
                read: "• MOVE > 120: Bond volatility high\n• MOVE < 80: Stable rate environment\n• Watch Fed meeting reactions",
                keyPoint: "High MOVE index signals bond market stress, which often precedes equity volatility."
            };
        }
        return {
            usage: "Interest rates and volatility metrics reflect monetary policy and market stress levels.",
            read: "• Rising rates: Valuation pressure\n• High volatility: Risk-off mode\n• Watch central bank signals",
            keyPoint: "Global rates and volatility drive FII flows and equity risk premiums in India."
        };
    }

    // 5. Fallback
    return {
        usage: "Global market indicator providing context for Indian equity positioning.",
        read: "• Monitor trend and momentum\n• Compare to historical ranges\n• Watch for extreme readings",
        keyPoint: "Use global metrics to assess risk appetite and position sizing for Indian portfolios."
    };
};

// =============================
// Main Component
// =============================
export default function GlobalInterpretationDesk({ card }) {
    if (!card) return null;

    const edu = getEducationalContent(card.category, card.label, card.id);

    return (
        <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="relative overflow-hidden bg-background-tooltip border border-border-default rounded-2xl p-5 shadow-xl flex flex-col gap-5">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-md bg-background-elevated flex items-center justify-center border border-border-subtle text-accent-primary text-xs font-bold font-serif italic">i</div>
                    <span className="text-accent-primary text-[11px] font-bold tracking-widest uppercase">Global Context</span>
                </div>

                {/* Usage Section */}
                <div>
                    <h3 className="text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide opacity-50">What It Measures</h3>
                    <p className="text-xs text-text-secondary leading-relaxed font-normal">
                        {edu.usage}
                    </p>
                </div>

                {/* Impact Section */}
                <div className="bg-background-elevated/40 rounded-xl p-4 border border-border-subtle group transition-all hover:border-border-hover">
                    <h3 className="text-[10px] font-extrabold text-accent-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 bg-accent-primary rounded-full" />
                        Impact on India
                    </h3>
                    <div className="text-xs text-text-secondary leading-loose whitespace-pre-line font-medium pl-1">
                        {edu.read}
                    </div>
                </div>

                {/* Key Insight */}
                <div className="relative pl-1">
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-amber-500/40 rounded-full" />
                    <div className="pl-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-amber-600 text-[10px] font-black tracking-wider uppercase">Key Insight</span>
                        </div>
                        <p className="text-xs text-text-tertiary leading-relaxed italic font-medium">
                            "{edu.keyPoint}"
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-border-subtle text-[9px] text-text-tertiary opacity-30 text-center uppercase tracking-[0.3em] font-light">
                    Praxis Global Intelligence
                </div>
            </div>
        </div>
    );
}
