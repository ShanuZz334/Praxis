import React from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

export default function GlobalIndicesGrid({ buckets }) {
    if (!buckets) return null;
    const { riskOn, neutral, riskOff, footerInsight } = buckets;

    return (
        <div className="bg-[#101a33] border border-white/5 rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] h-full flex flex-col">

            {/* Header */}
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-3 flex justify-between items-center">
                <span>Risk Rotation Intelligence</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">Relative Strength</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <BucketSubCard data={riskOn} color="emerald" />
                <BucketSubCard data={neutral} color="slate" />
                <BucketSubCard data={riskOff} color="red" />
            </div>

            {/* Footer Insight */}
            <div className="mt-4 pt-3 border-t border-white/5 text-center">
                <div className="text-xs font-bold text-slate-300 italic">
                    "{footerInsight}"
                </div>
            </div>
        </div>
    );
}

function BucketSubCard({ data, color }) {
    // Colors
    const textBase = color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-slate-400';
    const bgTint = color === 'emerald' ? 'bg-emerald-500/[0.02]' : color === 'red' ? 'bg-red-500/[0.02]' : 'bg-slate-500/[0.02]';
    const borderTint = color === 'emerald' ? 'border-emerald-500/10' : color === 'red' ? 'border-red-500/10' : 'border-slate-500/10';

    // Min Rows Logic
    const MIN_ROWS = 3;
    const items = data.items || [];
    const rows = [...items];

    // Backfill if needed
    while (rows.length < MIN_ROWS) {
        rows.push({ isEmpty: true, name: "No Active Signal", reason: "Low Conviction" });
    }

    return (
        <div className={`flex flex-col h-full rounded-lg border ${borderTint} ${bgTint} p-3`}>

            {/* Bucket Header */}
            <div className={`text-[10px] uppercase font-bold ${textBase} mb-1 opacity-90`}>
                {data.title}
            </div>

            {/* Bucket Summary Line */}
            <div className="text-[9px] font-medium text-slate-500 mb-3 leading-snug min-h-[2.5em]">
                {data.summary}
            </div>

            {/* Items */}
            <div className="flex-1 flex flex-col">
                {rows.map((idx, i) => (
                    <BucketRow key={i} data={idx} isLast={i === rows.length - 1} color={color} />
                ))}
            </div>
        </div>
    );
}

function BucketRow({ data, isLast, color }) {
    if (data.isEmpty) {
        return (
            <div className={`flex items-center p-2 border-b border-dashed border-white/5 ${isLast ? 'border-b-0' : ''} h-[44px]`}>
                <span className="text-[9px] text-slate-600 font-medium italic uppercase tracking-wide w-full text-center">
                    {data.name}
                </span>
            </div>
        );
    }

    const { name, change, reason } = data;
    const isPositive = change > 0;
    const isNegative = change < 0;

    // Direction Icon
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const numColor = isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-slate-400';

    return (
        <div className={`flex justify-between items-center py-2 ${isLast ? '' : 'border-b border-white/5'} h-[44px]`}>

            {/* Left: Name + Reason */}
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300 leading-none mb-0.5">{name}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase">{reason}</span>
            </div>

            {/* Right: Value + Icon */}
            <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-bold ${numColor}`}>
                    {change > 0 ? '+' : ''}{change}%
                </span>
                <Icon size={12} className={numColor} />
            </div>
        </div>
    );
}
