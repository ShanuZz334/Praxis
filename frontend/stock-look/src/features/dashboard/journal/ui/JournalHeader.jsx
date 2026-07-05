/**
 * @file JournalHeader.jsx
 * @purpose Top-level KPI dashboard for the Trading Journal.
 * @responsibilities
 * - Displays key account metrics (Equity, Risk, Drawdown, Win Rate, Expectancy, Score).
 * - Utilizes a responsive grid layout.
 * - Provides visual cues (colors, icons) for metric health.
 * @key_exports
 * - JournalHeader (Default Component)
 * @dependencies
 * - lucide-react (Icons)
 * @lifecycle
 * - Rendered by JournalPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { Award } from "lucide-react";

// =============================
// Helper Components
// =============================

function KPICard({ label, value, sub, subValue, accent, isGrade }) {
    return (
        <div className="relative bg-background-card border border-border-default rounded-xl p-3 shadow-md hover:border-border-default transition-colors flex flex-col justify-between group overflow-hidden">
            {/* Inner Glow for Depth */}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/3 to-transparent" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-tight">{label}</span>
                    {isGrade && <Award size={10} className={accent} />}
                </div>

                <div>
                    <div className={`text-xl font-black tracking-tighter ${accent} ${isGrade ? 'font-serif italic' : 'font-mono'}`}>
                        {value}
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-border-default">
                        <span className="text-[8px] text-text-secondary uppercase font-bold">{sub}</span>
                        <span className={`text-[8px] font-mono font-bold ${accent} opacity-80 uppercase`}>{subValue}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================
// Main Component
// =============================

export default function JournalHeader({ capital, score }) {
    if (!capital || !score) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. EQUITY */}
            <KPICard label="Account Equity" value={`₹${capital.capital.toLocaleString()}`} sub="High Water Mark" subValue="98%" accent="text-text-primary" />

            {/* 2. OPEN RISK */}
            <KPICard label="Open Risk" value={`${capital.openRiskPct}%`} sub="Exposure" subValue="₹9,450" accent="text-amber-400" />

            {/* 3. DRAWDOWN */}
            <KPICard label="Max Drawdown" value={`${capital.maxDrawdown}%`} sub="Peak-to-Trough" subValue="Deep" accent="text-red-400" />

            {/* 4. WIN RATE */}
            <KPICard label="Win Rate" value={`${capital.winRate}%`} sub="Last 20 Trades" subValue="Strong" accent="text-emerald-400" />

            {/* 5. EXPECTANCY (AVG R:R) */}
            <KPICard label="Avg R:R" value={`${capital.avgRR}R`} sub="Risk Reward" subValue="Healthy" accent="text-blue-400" />

            {/* 6. EXECUTION SCORE (Grade) */}
            <KPICard label="Execution Quality" value={score.grade} sub={`Score: ${score.score}/100`} subValue="Elite" accent="text-purple-400" isGrade />

        </div>
    );
}
