/**
 * @file GreeksReferenceGuide.jsx
 * @purpose Educational sidebar component explaining Option Greeks.
 * @responsibilities
 * - Displays a quick reference guide for Delta, Gamma, Theta, Vega, and IV.
 * - Provides actionable "Pro Tips" for each Greek (e.g., "Buy when IV is low").
 * - Helps users interpret the data shown in the Options Chain.
 * @key_exports
 * - GreeksReferenceGuide (Default Component)
 * @dependencies
 * - None (Static informational component)
 * @lifecycle
 * - Rendered by OptionsChainLayout (Sidebar).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from 'react';

// =============================
// Main Component
// =============================
export default function GreeksReferenceGuide() {
    return (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            <div className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-2 border-b border-border-default pb-1 opacity-80">
                How to Read Option Greeks
            </div>

            {/* SECTION: DELTA */}
            <div className="p-3 bg-background-surface rounded-lg border border-border-default">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-blue-600 font-bold uppercase">Delta</span>
                    <span className="text-[9px] text-text-tertiary">Direction Sensitivity</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-text-secondary leading-relaxed">
                    <p><strong className="text-text-tertiary">Means:</strong> Change in option price for ₹1 move in underlying.</p>
                    <div className="grid grid-cols-[auto_1fr] gap-2 text-[9px]">
                        <span className="text-text-tertiary">0.20</span> <span>Low directional exposure</span>
                        <span className="text-text-tertiary">0.50</span> <span>Balanced (ATM)</span>
                        <span className="text-text-tertiary">0.70+</span> <span>Strong directional proxy</span>
                    </div>
                    <div className="pt-1 border-t border-border-default mt-1">
                        <span className="text-blue-600 font-medium">⚡ Rising Delta confirms momentum.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: GAMMA */}
            <div className="p-3 bg-background-surface rounded-lg border border-border-default">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-purple-600 font-bold uppercase">Gamma</span>
                    <span className="text-[9px] text-text-tertiary">Acceleration Risk</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-text-secondary leading-relaxed">
                    <p><strong className="text-text-tertiary">Means:</strong> Speed of Delta change. High near ATM & Exp.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-purple-600 font-medium">⚡ High Gamma = Fast profits & fast losses. Best for scalping.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: THETA */}
            <div className="p-3 bg-background-surface rounded-lg border border-border-default">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-orange-600 font-bold uppercase">Theta</span>
                    <span className="text-[9px] text-text-tertiary">Time Decay</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-text-secondary leading-relaxed">
                    <p><strong className="text-text-tertiary">Means:</strong> Daily premium erosion if price stalls.</p>
                    <p>Accelerates sharply near expiry. Highest for ATM.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-orange-600 font-medium">⚡ Neutral markets favor Theta-positive (selling) strategies.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: VEGA */}
            <div className="p-3 bg-background-surface rounded-lg border border-border-default">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-amber-600 font-bold uppercase">Vega</span>
                    <span className="text-[9px] text-text-tertiary">Vol Sensitivity</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-text-secondary leading-relaxed">
                    <p><strong className="text-text-tertiary">Means:</strong> Price change for 1% IV move.</p>
                    <p>High Vega benefits from IV expansion.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-amber-600 font-medium">⚡ Buy when IV is low & rising. Sell when high.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: IV */}
            <div className="p-3 bg-background-surface rounded-lg border border-border-default">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-red-600 font-bold uppercase">Implied Vol</span>
                    <span className="text-[9px] text-text-tertiary">Expectation</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-text-secondary leading-relaxed">
                    <p>Low IV = Cheap options. High IV = Expensive.</p>
                    <div className="pt-1 border-t border-white/5 mt-1">
                        <span className="text-red-600 font-medium">⚡ IV Rank &gt; 60 is a premium selling zone.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: COMBOS */}
            <div className="p-3 bg-background-surface rounded-lg border border-border-default">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Power Combos</span>
                </div>
                <div className="grid gap-2 text-[9px] text-text-secondary">
                    <div className="flex justify-between">
                        <span>High Delta + Gamma</span>
                        <span className="text-text-primary">Breakout</span>
                    </div>
                    <div className="flex justify-between">
                        <span>High Theta + Low IV</span>
                        <span className="text-text-primary">Credit Spreads</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
