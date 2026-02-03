/**
 * @file ForeignGauge.jsx
 * @purpose Specialized Gauge component for visualizing Global Risk Scores.
 * @responsibilities
 * - Renders a semi-circle SVG gauge.
 * - Interpolates colors based on risk levels (Red for Risk-Off, Green for Risk-On).
 * - Applies glows and gradients for a premium visual effect.
 * @key_exports
 * - ForeignGauge (Default Component)
 * @dependencies
 * - React (SVG rendering)
 * @lifecycle
 * - Presentational component used in Foreign/Global Dashboard Headers.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from 'react';

// =============================
// Main Component
// =============================
export default function ForeignGauge({ score, state }) {
    // 0-100 Score (Higher = Risk-On/Bullish)

    // Visual Config
    const radius = 80;
    const strokeWidth = 10;
    const circumference = Math.PI * radius; // Semi-circle
    const clampedScore = Math.min(100, Math.max(0, score));
    const offset = circumference - (clampedScore / 100) * circumference;

    // Color Logic
    const getColorValues = (s) => {
        if (s < 30) return { stroke: "#ef4444", label: "Risk-Off", glow: "shadow-red-500/50" }; // Red
        if (s < 50) return { stroke: "#f59e0b", label: "Caution", glow: "shadow-amber-500/50" }; // Amber
        if (s < 70) return { stroke: "#3b82f6", label: "Recovery", glow: "shadow-blue-500/50" }; // Blue
        return { stroke: "#10b981", label: "Risk-On", glow: "shadow-emerald-500/50" }; // Green
    };

    const visual = getColorValues(clampedScore);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="relative w-[200px] h-[110px] group">
                {/* SVG Canvas */}
                <svg width="200" height="110" className="overflow-visible">
                    <defs>
                        <linearGradient id="foreignGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <filter id="foreignGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Track */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Value Arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#foreignGaugeGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        filter="url(#foreignGlow)"
                        className="transition-all duration-1000 ease-out"
                    />

                    {/* Axis Labels */}
                    <g className="text-[9px] font-bold fill-slate-500 select-none">
                        <text x="25" y="115" textAnchor="start">FEAR</text>
                        <text x="175" y="115" textAnchor="end">GREED</text>
                    </g>
                </svg>

                {/* Center Labels */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center translate-y-2">
                    <div className="text-4xl font-bold text-slate-100 tracking-tighter drop-shadow-lg">
                        {clampedScore}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">
                        Global Risk
                    </div>
                    <div className={`text-[10px] font-bold uppercase ${visual.stroke === '#ef4444' ? 'text-red-400' : visual.stroke === '#10b981' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {state || visual.label}
                    </div>
                </div>
            </div>
        </div>
    );
}
