import React, { useMemo } from 'react';
import PortalTooltip from "@/shared/components/ui/PortalTooltip";

export default function OptionsGauge({ scoreData }) {
    // Expecting scoreData = { score, details: { netDelta, gammaFlip, putWall, callWall, ivRank, breakdown } }

    const { score = 50, details = {} } = scoreData || {};

    // SVG Geometry
    const radius = 80;
    const strokeWidth = 10;
    const center = 100;
    const circumference = Math.PI * radius; // Semi-circle

    const clampedScore = Math.min(100, Math.max(0, score));
    const offset = circumference - (clampedScore / 100) * circumference;

    // Color Logic (5 Zones)
    // 0-30 Red, 30-45 Amber, 45-55 Neutral, 55-70 Green, 70+ Neon
    const getColorValues = (s) => {
        if (s < 30) return { stroke: "#ef4444", label: "Bearish Bias", glow: "shadow-red-500/50" };
        if (s < 45) return { stroke: "#f59e0b", label: "Defensive", glow: "shadow-amber-500/50" };
        if (s <= 55) return { stroke: "#94a3b8", label: "Neutral", glow: "shadow-slate-500/50" };
        if (s <= 70) return { stroke: "#22c55e", label: "Bullish", glow: "shadow-green-500/50" };
        return { stroke: "#34d399", label: "Aggressive Bullish", glow: "shadow-emerald-400/80" }; // Neon
    };

    const visual = getColorValues(clampedScore);

    // Tooltip Content
    const tooltipContent = (
        <div className="space-y-3 min-w-[180px]">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white uppercase">Positioning Score</span>
                <span className={`text-xs font-mono font-bold ${visual.stroke === '#ef4444' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {clampedScore.toFixed(0)}
                </span>
            </div>
            <div className="space-y-1.5 text-[10px] text-white/70">
                <div className="flex justify-between"><span>Net Delta</span> <span className="font-mono text-white">{details.netDelta?.toLocaleString() || '--'}</span></div>
                <div className="flex justify-between"><span>Gamma Flip</span> <span className="font-mono text-white">{details.gammaFlip?.toLocaleString() || '--'}</span></div>
                <div className="flex justify-between"><span>Put Wall</span> <span className="font-mono text-red-300">{details.putWall?.toLocaleString() || '--'}</span></div>
                <div className="flex justify-between"><span>Call Wall</span> <span className="font-mono text-green-300">{details.callWall?.toLocaleString() || '--'}</span></div>
                <div className="flex justify-between"><span>IV Rank</span> <span className="font-mono text-yellow-300">{details.ivRank || '--'}</span></div>
            </div>
            <div className="text-[9px] text-white/30 italic pt-1 border-t border-white/5 text-center">
                Updates every 60s
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full">
            {/* GAUGE AREA */}
            <PortalTooltip content={tooltipContent}>
                <div className="relative w-[200px] h-[110px] cursor-help group">
                    <svg width="200" height="110" className="overflow-visible">
                        {/* DEFS for Gradients */}
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="40%" stopColor="#f59e0b" />
                                <stop offset="60%" stopColor="#94a3b8" />
                                <stop offset="80%" stopColor="#22c55e" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Background Track (Dark) */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />

                        {/* Value Arc (Color + Glow) */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            filter="url(#glow)"
                            className="transition-all duration-1000 ease-out opacity-90 group-hover:opacity-100"
                        />

                        {/* Ticks (Bearish, Neutral, Bullish) */}
                        <g className="text-[8px] font-bold fill-white/20 select-none">
                            <text x="25" y="115" textAnchor="start">BEARISH</text>
                            <text x="100" y="65" textAnchor="middle">NEUTRAL</text>
                            <text x="175" y="115" textAnchor="end">BULLISH</text>
                        </g>
                    </svg>

                    {/* Center Value */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center translate-y-2">
                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-lg transition-all">
                            {clampedScore.toFixed(0)}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-0.5">
                            Positioning Score
                        </div>
                        <div className={`text-[9px] font-medium transition-colors ${visual.score < 30 ? 'text-red-400' : visual.score > 70 ? 'text-emerald-300' : 'text-blue-300'}`}>
                            {visual.label}
                        </div>
                    </div>
                </div>
            </PortalTooltip>

            {/* DATA CONTEXT STRIP */}
            <div className="w-full mt-6 grid grid-cols-3 gap-2 px-2">
                {(details.breakdown || []).map((item, i) => (
                    <div key={i} className="flex flex-col items-center bg-white/[0.02] rounded py-1.5 border border-white/5">
                        <span className="text-[9px] text-white/40 uppercase tracking-wide mb-0.5">{item.label}</span>
                        <span className={`text-[10px] font-bold ${item.color || 'text-white/80'}`}>{item.val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
