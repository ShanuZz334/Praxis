import React from "react";
import { TrendingUp, TrendingDown, ShieldAlert, Target, Award } from "lucide-react";

export default function JournalHeader({ capital, score }) {
    if (!capital || !score) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. EQUITY (Double Width or Highlight) */}
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

function KPICard({ label, value, sub, subValue, accent, isGrade }) {
    return (
        <div className="relative bg-background-card border border-border-default rounded-2xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:border-border-default transition-colors flex flex-col justify-between min-h-[100px] group overflow-hidden">
            {/* Inner Glow for Depth */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{label}</span>
                    {isGrade && <Award size={12} className={accent} />}
                </div>

                <div>
                    <div className={`text-2xl font-black tracking-tighter ${accent} ${isGrade ? 'font-serif italic' : 'font-mono'}`}>
                        {value}
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-border-default">
                        <span className="text-[9px] text-text-secondary uppercase font-bold">{sub}</span>
                        <span className={`text-[9px] font-mono font-bold ${accent} opacity-80 uppercase`}>{subValue}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
