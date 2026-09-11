/**
 * @file AllocationMap.jsx
 * @purpose Detailed categorization of capital allocation.
 * @responsibilities
 * - Displays capital breakdown (Intraday, Swing, Options, Cash).
 * - Shows target vs actual allocation with health status.
 * @key_exports
 * - AllocationMap (Default)
 * @dependencies
 * - GlobalCard
 * @lifecycle
 * - Rendered by WalletPage (Future/Expanded).
 * @date 2026-02-03
 */

import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";

export default function AllocationMap({ allocation }) {
    return (
        <div className="bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl p-5 md:p-6 shadow-sm hover:border-border-default/60 transition-all">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-default/30">
                <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Capital Allocation Strategy</div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-background-surface/60 border border-border-subtle/50 text-text-tertiary">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>Auto-Rebalance: ON</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {allocation.map(item => (
                    <AllocationCard key={item.id} data={item} />
                ))}
            </div>
        </div>
    );
}

function AllocationCard({ data }) {
    const { name, value, target, delta, action } = data;

    // Map allocation data to "Metric Card" visual props
    // We treat "Value" as the main visual. 
    // "Target" as the context.

    // Normalized for bar: 0-100% capacity assumption or just relative to target?
    // Let's just assume 50% is baseline for visual aesthetics if we don't have max.
    // Or usage value directly if it's 0-100.
    const normalizedScore = Math.min(100, Math.max(0, value));

    // Reliability -> "Live" (mock)
    const relScore = 0.9;

    return (
        <GlobalCard
            label={name}
            raw={value}
            unit="%"
            reason={`Target: ${target}%`}

            // Visuals
            score={normalizedScore}
            creditScore={relScore}

            // Footer Info
            signal={action} // e.g. "Buy", "Sell", "Hold"
            color={delta > 0 ? "#fbbf24" : "#60a5fa"} // amber or blue

            className="h-full hover:border-white/20"
        />
    );
}
