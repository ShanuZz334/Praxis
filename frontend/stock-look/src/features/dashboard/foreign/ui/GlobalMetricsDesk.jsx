/**
 * @file GlobalMetricsDesk.jsx
 * @purpose AI-powered analysis card for specific metrics.
 * @responsibilities
 * - Generates live AI insights based on metric values and thresholds.
 * - Determines "Market Regime" (Risk-On, Inflationary, etc.).
 * - Assesses "Impact on India" (Positive, Negative, Mixed).
 * - Visualizes data quality confidence.
 * @key_exports
 * - GlobalMetricsDesk (Default Component)
 * @dependencies
 * - React
 * @lifecycle
 * - Rendered in Modals or Details view.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from 'react';

// =============================
// Main Component
// =============================
export default function GlobalMetricsDesk({ card }) {
    if (!card) return null;

    // 1. Context Derivation
    const norm = card.normalized || 0;
    const category = card.category?.toLowerCase() || '';
    const label = card.label?.toLowerCase() || '';

    // 2. Logic Initialization
    let insightText = "Global metric is neutral, suggesting balanced market conditions.";
    let contextText = "Monitor for directional breakout.";
    let sentimentColor = "text-text-tertiary";
    let impactOnIndia = "Neutral";
    let regime = "Balanced";

    // 3. Category Specific Logic
    // ------------------------------------------

    // --- CURRENCY ---
    if (category.includes('currency')) {
        if (label.includes('dxy') || label.includes('dollar')) {
            if (norm > 0.3) {
                insightText = `Dollar strength (${card.raw}) is tightening global liquidity. FII outflow risk elevated for emerging markets.`;
                contextText = "Strong dollar = Risk-off for EM equities.";
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Negative";
                regime = "Risk-Off";
            } else if (norm < -0.3) {
                insightText = `Dollar weakness (${card.raw}) is supportive for emerging market flows. FII inflows likely to accelerate.`;
                contextText = "Weak dollar = Risk-on for EM equities.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Risk-On";
            } else {
                insightText = `Dollar index (${card.raw}) is range-bound. No major FII flow pressure from currency.`;
                contextText = "Stable dollar environment.";
                impactOnIndia = "Neutral";
            }
        } else if (label.includes('jpy') || label.includes('yen')) {
            if (norm > 0.5) {
                insightText = `Yen weakness (${card.raw}) supports carry trades. Risk appetite elevated globally.`;
                contextText = "Carry trade active = Risk-on.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Risk-On";
            } else if (norm < -0.5) {
                insightText = `Yen strength (${card.raw}) signals carry trade unwinding. Risk-off pressure building.`;
                contextText = "Carry unwind = Volatility spike risk.";
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Negative";
                regime = "Risk-Off";
            }
        } else {
            if (norm > 0.3) {
                insightText = `Currency strength (${card.raw}) reflects relative economic outperformance.`;
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Monitor";
            } else if (norm < -0.3) {
                insightText = `Currency weakness (${card.raw}) signals economic headwinds or policy divergence.`;
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Monitor";
            }
        }
    }
    // --- INDICES ---
    else if (category.includes('indices')) {
        if (norm > 0.3) {
            insightText = `${card.label} strength (${card.raw}) signals positive global risk appetite. Nifty likely to follow with 1-day lag.`;
            contextText = "Global equity strength = Nifty tailwind.";
            sentimentColor = "text-state-bullish-text";
            impactOnIndia = "Positive";
            regime = "Risk-On";
        } else if (norm < -0.3) {
            insightText = `${card.label} weakness (${card.raw}) indicates global risk-off. Expect Nifty gap-down or defensive rotation.`;
            contextText = "Global equity weakness = Nifty headwind.";
            sentimentColor = "text-state-bearish-text";
            impactOnIndia = "Negative";
            regime = "Risk-Off";
        } else {
            insightText = `${card.label} (${card.raw}) is consolidating. Nifty likely to trade range-bound.`;
            contextText = "Global consolidation = Local choppiness.";
            impactOnIndia = "Neutral";
        }
    }
    // --- COMMODITIES ---
    else if (category.includes('commodities')) {
        if (label.includes('gold')) {
            if (norm > 0.3) {
                insightText = `Gold strength (${card.raw}/oz) signals either safe-haven demand or inflation hedge. Context determines equity impact.`;
                contextText = "Gold up = Fear or inflation concerns.";
                sentimentColor = "text-amber-600";
                impactOnIndia = "Mixed";
                regime = "Uncertain";
            } else if (norm < -0.3) {
                insightText = `Gold weakness (${card.raw}/oz) suggests risk-on environment. Equities preferred over safe havens.`;
                contextText = "Gold down = Risk appetite strong.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Risk-On";
            }
        } else if (label.includes('crude') || label.includes('oil')) {
            if (norm > 0.3) {
                insightText = `Crude strength (${card.raw}) pressures India's CAD and inflation. OMC margins under stress.`;
                contextText = "High oil = Inflation + CAD risk.";
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Negative";
                regime = "Inflationary";
            } else if (norm < -0.3) {
                insightText = `Crude weakness (${card.raw}) is benign for India. Lower import bill and inflation relief.`;
                contextText = "Low oil = Macro tailwind for India.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Disinflationary";
            }
        } else if (label.includes('copper')) {
            if (norm > 0.3) {
                insightText = `Copper strength (${card.raw}) signals global growth optimism. Supports cyclical sectors.`;
                contextText = "Dr. Copper bullish = Growth on.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Growth";
            } else if (norm < -0.3) {
                insightText = `Copper weakness (${card.raw}) warns of slowing global demand. Cyclicals at risk.`;
                contextText = "Dr. Copper bearish = Growth concerns.";
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Negative";
                regime = "Slowdown";
            }
        } else {
            if (norm > 0.3) {
                insightText = `Commodity strength (${card.raw}) reflects supply tightness or demand surge.`;
                sentimentColor = "text-amber-600";
                impactOnIndia = "Monitor";
            } else if (norm < -0.3) {
                insightText = `Commodity weakness (${card.raw}) eases input cost pressures for corporates.`;
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
            }
        }
    }
    // --- RATES & VOLATILITY ---
    else if (category.includes('rates') || category.includes('volatility')) {
        if (label.includes('10y') || label.includes('yield')) {
            if (norm > 0.3) {
                insightText = `US yields elevated (${card.raw}). Equity valuations under pressure. FII outflow risk high.`;
                contextText = "High yields = EM headwind.";
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Negative";
                regime = "Tightening";
            } else if (norm < -0.3) {
                insightText = `US yields falling (${card.raw}). Supportive for equity risk premiums and FII flows.`;
                contextText = "Low yields = EM tailwind.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Easing";
            }
        } else if (label.includes('vix')) {
            if (norm > 0.3) {
                insightText = `VIX elevated (${card.raw}). Fear gauge spiking. Expect India VIX to follow. Hedge positions.`;
                contextText = "High VIX = Volatility storm brewing.";
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Negative";
                regime = "High Vol";
            } else if (norm < -0.3) {
                insightText = `VIX subdued (${card.raw}). Complacency or calm. Favorable for trend continuation.`;
                contextText = "Low VIX = Smooth sailing.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Low Vol";
            }
        } else if (label.includes('move')) {
            if (norm > 0.3) {
                insightText = `MOVE index elevated (${card.raw}). Bond volatility high. Rate uncertainty pressuring equities.`;
                contextText = "High MOVE = Bond stress.";
                sentimentColor = "text-state-bearish-text";
                impactOnIndia = "Negative";
                regime = "Unstable";
            } else if (norm < -0.3) {
                insightText = `MOVE index calm (${card.raw}). Stable rate environment supports risk assets.`;
                contextText = "Low MOVE = Rate stability.";
                sentimentColor = "text-state-bullish-text";
                impactOnIndia = "Positive";
                regime = "Stable";
            }
        }
    }

    // 4. Render
    return (
        <div className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-background-tooltip border border-border-default rounded-2xl p-6 shadow-xl flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border-subtle pb-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse box-shadow-purple" />
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">AI Analysis</span>
                </div>

                {/* Analysis Block */}
                <div>
                    <div className={`text-[13px] font-medium leading-relaxed mb-4 ${sentimentColor}`}>
                        <span className="text-2xl mr-2 align-middle opacity-50">
                            {sentimentColor.includes('bullish') ? '↗' : sentimentColor.includes('bearish') ? '↘' : '→'}
                        </span>
                        {insightText}
                    </div>
                    <div className="bg-background-elevated/40 rounded-l-lg border-l-2 border-border-subtle p-3 pl-4">
                        <div className="text-[9px] text-text-secondary uppercase tracking-widest font-black mb-1.5 opacity-100">Market Context</div>
                        <div className="text-xs text-text-primary font-black leading-snug italic opacity-100">
                            "{contextText}"
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

                {/* Impact & Regime Block */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-[10px] text-text-secondary uppercase tracking-wider font-black opacity-100">Impact on India</div>
                            <div className={`text-xs font-black mt-0.5 ${impactOnIndia === 'Positive' ? 'text-state-bullish-text' :
                                impactOnIndia === 'Negative' ? 'text-state-bearish-text' :
                                    impactOnIndia === 'Mixed' ? 'text-amber-600' :
                                        'text-text-primary'
                                }`}>
                                {impactOnIndia}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-text-secondary uppercase tracking-wider font-black opacity-100">Regime</div>
                            <div className="text-xs font-black text-text-primary mt-0.5">{regime}</div>
                        </div>
                    </div>

                    {/* Quality Confidence */}
                    <div className="bg-background-elevated rounded-lg p-2 flex items-center justify-between">
                        <span className="text-[9px] text-text-tertiary uppercase tracking-wider">Data Quality</span>
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-background-subtle rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-state-bullish-text rounded-full transition-all"
                                    style={{ width: `${(card.creditScore || 0.85) * 100}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-text-secondary">
                                {Math.round((card.creditScore || 0.85) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-2 pt-4 border-t border-border-subtle text-[9px] text-text-tertiary opacity-30 text-center uppercase tracking-[0.2em]">
                    Stocky Global AI
                </div>
            </div>
        </div>
    );
}
