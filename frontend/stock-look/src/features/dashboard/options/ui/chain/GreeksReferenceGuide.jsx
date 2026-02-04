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
            <div className="px-1 py-1">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-blue-600 font-bold uppercase">Delta</span>
                    <span className="text-[9px] text-text-tertiary">Direction</span>
                </div>
                <div className="space-y-1 text-[9px] text-text-secondary leading-tight line-clamp-2">
                    <p>Change in option price for ₹1 move in spot.</p>
                    <div className="pt-1 border-t border-border-default/20 mt-1">
                        <span className="text-blue-600 font-medium">⚡ Rising Delta confirms momentum.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: GAMMA */}
            <div className="px-1 py-1 border-t border-border-default/10 pt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-purple-600 font-bold uppercase">Gamma</span>
                    <span className="text-[9px] text-text-tertiary">Speed</span>
                </div>
                <div className="space-y-1 text-[9px] text-text-secondary leading-tight">
                    <p>Speed of Delta. High near ATM & Exp.</p>
                    <div className="pt-1 border-t border-border-default/20 mt-1">
                        <span className="text-purple-600 font-medium">⚡ High Gamma = Scale-able momentum.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: THETA */}
            <div className="px-1 py-1 border-t border-border-default/10 pt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-orange-600 font-bold uppercase">Theta</span>
                    <span className="text-[9px] text-text-tertiary">Decay</span>
                </div>
                <div className="space-y-1 text-[9px] text-text-secondary leading-tight">
                    <p>Daily premium erosion if price stalls.</p>
                    <div className="pt-1 border-t border-border-default/20 mt-1">
                        <span className="text-orange-600 font-medium">⚡ High Theta favors option sellers.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: VEGA */}
            <div className="px-1 py-1 border-t border-border-default/10 pt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-amber-600 font-bold uppercase">Vega</span>
                    <span className="text-[9px] text-text-tertiary">Vol</span>
                </div>
                <div className="space-y-1 text-[9px] text-text-secondary leading-tight">
                    <p>Price change for 1% IV move.</p>
                    <div className="pt-1 border-t border-border-default/20 mt-1">
                        <span className="text-amber-600 font-medium">⚡ Buy low IV, Sell high IV.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: IV */}
            <div className="px-1 py-1 border-t border-border-default/10 pt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-red-600 font-bold uppercase">Implied Vol</span>
                    <span className="text-[9px] text-text-tertiary">Expectation</span>
                </div>
                <div className="space-y-1 text-[9px] text-text-secondary leading-tight">
                    <p>Low IV = Cheap. High IV = Expensive.</p>
                    <div className="pt-1 border-t border-border-default/20 mt-1">
                        <span className="text-red-600 font-bold">⚡ IV Rank &gt; 60: Selling Zone.</span>
                    </div>
                </div>
            </div>

            {/* SECTION: COMBOS */}
            <div className="px-1 py-1 border-t border-border-default/10 pt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-emerald-600 font-bold uppercase">Combos</span>
                </div>
                <div className="grid gap-1.5 text-[9px] text-text-secondary">
                    <div className="flex justify-between">
                        <span>Delta+Gamma</span>
                        <span className="text-text-primary">Breakout</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
