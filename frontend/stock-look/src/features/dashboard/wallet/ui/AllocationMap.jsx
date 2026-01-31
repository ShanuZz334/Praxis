import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";

export default function AllocationMap({ allocation }) {
    return (
        <div className="bg-background-card-primary border border-border-subtle-faint rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between mb-6">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Capital Allocation Strategy</div>
                <div className="text-[10px] font-mono text-white/30">Auto-Rebalance: ON</div>
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
