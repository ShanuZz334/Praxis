import React from "react";
import { ArrowUp, ArrowDown, HelpCircle, ArrowRight } from "lucide-react";

export default function MobileCompositeCard({
    score = 57,
    regime = "ACCUMULATE",
    confidence = 96,
    deltaRaw = -1.7,
    gaugeColor = "#4ADE80",
    chips = [
        { label: "Strong Breadth", icon: <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" /> },
        { label: "Bullish Momentum", icon: <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" /> },
        { label: "Low Risk", icon: <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" /> }
    ],
}) {
    const isNegative = deltaRaw < 0;
    const deltaColor = isNegative ? "text-[#EF4444]" : "text-[#4ADE80]";
    const deltaIcon = isNegative
        ? <ArrowDown className="w-2.5 h-2.5 inline mr-0.5" />
        : <ArrowUp className="w-2.5 h-2.5 inline mr-0.5" />;

    return (
        <div className="bg-background-card rounded-2xl p-3.5 mb-4 border border-border-default shadow-md relative overflow-hidden">
            {/* Top Row: Title & Delta */}
            <div className="flex justify-between items-center mb-3 gap-2">
                <div className="flex items-center gap-1 min-w-0">
                    <span className="text-text-primary text-[11px] font-semibold tracking-wider truncate">STOCKY COMPOSITE</span>
                    <HelpCircle className="w-3 h-3 text-text-secondary shrink-0" />
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[11px] font-bold ${deltaColor}`}>
                        {deltaIcon}{Math.abs(deltaRaw).toFixed(1)}%
                    </span>
                    <span className="text-text-secondary text-[9px]">vs yesterday</span>
                </div>
            </div>

            {/* Main Score Area */}
            <div className="flex items-baseline gap-3 mb-4">
                <div className="text-text-primary text-5xl font-bold tracking-tighter leading-none">
                    {score}
                </div>
                <div className="flex flex-col">
                    <span className="text-base font-bold uppercase" style={{ color: gaugeColor }}>
                        {regime}
                    </span>
                    <span className="text-text-secondary text-[10px] font-medium">
                        Confidence {confidence}%
                    </span>
                </div>
            </div>

            {/* Middle Metrics Row */}
            <div className="flex items-center justify-between mb-3 border border-border-default rounded-lg py-1 px-1.5 divide-x divide-border-default">
                <div className="flex items-center gap-1 px-1 first:pl-0 last:pr-0">
                    <span className="text-text-secondary text-[9px]">Trend</span>
                    <ArrowUp className="w-2.5 h-2.5 text-[#4ADE80]" />
                </div>
                <div className="flex items-center gap-1 px-1 first:pl-0 last:pr-0">
                    <span className="text-text-secondary text-[9px]">Momentum</span>
                    <ArrowRight className="w-2.5 h-2.5 text-[#4ADE80]" />
                </div>
                <div className="flex items-center gap-1 px-1 first:pl-0 last:pr-0">
                    <span className="text-text-secondary text-[9px]">Risk</span>
                    <span className="text-[9px] font-medium text-[#4ADE80]">Low</span>
                </div>
                <div className="flex items-center gap-1 px-1 first:pl-0 last:pr-0">
                    <span className="text-text-secondary text-[9px]">Vol</span>
                    <span className="text-[9px] font-medium text-[#F59E0B]">Med</span>
                </div>
            </div>

            {/* Pill Chips */}
            <div className="flex flex-wrap gap-1.5">
                {chips.map((chip, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-full bg-background-surface border border-border-subtle">
                        {chip.icon}
                        <span className="text-text-primary text-[10px] font-medium">{chip.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
