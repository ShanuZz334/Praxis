import React from 'react';
import { createPortal } from 'react-dom';

// Helper to score Greeks 1-7 (for Long Position)
const getGreekScore = (greek, value) => {
    if (value === undefined || value === null || isNaN(value)) {
        return { score: 1, label: 'N/A' };
    }

    const absVal = Math.abs(Number(value));

    switch (greek) {
        case 'delta':
            if (absVal < 0.15) return { score: 1, label: 'Very Low' };
            if (absVal < 0.25) return { score: 2, label: 'Low' };
            if (absVal < 0.40) return { score: 3, label: 'Mod Low' };
            if (absVal < 0.55) return { score: 4, label: 'Moderate' };
            if (absVal < 0.70) return { score: 5, label: 'Good' };
            if (absVal < 0.85) return { score: 6, label: 'Very Good' };
            return { score: 7, label: 'Excellent' };
        case 'gamma':
            if (absVal < 0.0003) return { score: 1, label: 'Stable' };
            if (absVal < 0.0005) return { score: 2, label: 'Low' };
            if (absVal < 0.0008) return { score: 3, label: 'Mod' };
            if (absVal < 0.0012) return { score: 4, label: 'Active' };
            if (absVal < 0.0018) return { score: 5, label: 'High' };
            if (absVal < 0.0025) return { score: 6, label: 'Ex High' };
            return { score: 7, label: 'Explosive' };
        case 'theta': // Closer to 0 is better for Long
            if (value > -5) return { score: 7, label: 'Safe' };
            if (value > -10) return { score: 6, label: 'Low' };
            if (value > -18) return { score: 5, label: 'Mod' };
            if (value > -28) return { score: 4, label: 'Elevated' };
            if (value > -40) return { score: 3, label: 'High' };
            if (value > -60) return { score: 2, label: 'Severe' };
            return { score: 1, label: 'Critical' };
        case 'vega': // Higher is better for Long (Exposure)
            if (absVal < 3) return { score: 1, label: 'Negligible' };
            if (absVal < 6) return { score: 2, label: 'Low' };
            if (absVal < 10) return { score: 3, label: 'Mod' };
            if (absVal < 15) return { score: 4, label: 'Good' };
            if (absVal < 22) return { score: 5, label: 'Strong' };
            if (absVal < 30) return { score: 6, label: 'Very Strong' };
            return { score: 7, label: 'Maximum' };
        default:
            return { score: 4, label: 'Mid' };
    }
};

const RatingBar = ({ score }) => (
    <div className="flex gap-[3px] mt-1.5 opacity-100">
        {[...Array(7)].map((_, i) => {
            const isActive = i < score;
            let bgClass = "bg-white/5";
            if (isActive) {
                if (score <= 2) bgClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
                else if (score <= 4) bgClass = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
                else bgClass = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
            }
            return (
                <div key={i} className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${bgClass}`} />
            );
        })}
    </div>
);

export default function OptionsHoverCard({ data, position, type, strike }) {
    if (!data || !position) return null;

    // Position calc (offset from mouse/element)
    const style = {
        top: position.y - 10,
        left: type === 'call' ? position.x + 20 : position.x - 280, // Flip side based on type
    };

    const isCall = type === 'call';
    const colorClass = isCall ? "text-emerald-400" : "text-rose-400";
    const bgClass = isCall ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20";
    const glowClass = isCall ? "shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]" : "shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)]";

    const greeks = [
        { label: 'Delta', key: 'delta', val: data.delta, fmt: 2 },
        { label: 'Gamma', key: 'gamma', val: data.gamma, fmt: 4 },
        { label: 'Theta', key: 'theta', val: data.theta, fmt: 1 },
        { label: 'Vega', key: 'vega', val: data.vega, fmt: 1 },
    ];

    return createPortal(
        <div
            className={`fixed z-[9999] w-[300px] bg-[#0b1221] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl p-0 overflow-hidden pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${glowClass}`}
            style={style}
        >
            {/* DECORATIVE TOP LINE */}
            <div className={`h-1 w-full ${isCall ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            <div className="p-5">
                {/* HEADER */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            NIFTY <span className="text-white">{strike}</span> <span className={colorClass}>{type.toUpperCase()}</span>
                        </div>
                        <div className={`text-3xl font-mono font-bold tracking-tighter ${colorClass}`}>
                            ₹{data.ltp}
                        </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${bgClass} ${colorClass}`}>
                        {isCall ? 'Bullish' : 'Bearish'}
                    </div>
                </div>

                {/* GREEKS GRID */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6">
                    {greeks.map(g => {
                        const { score, label } = getGreekScore(g.key, g.val);
                        return (
                            <div key={g.key}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{g.label}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 ${score > 4 ? 'text-emerald-400' : score < 3 ? 'text-white/40' : 'text-amber-400'}`}>
                                        {label}
                                    </span>
                                </div>
                                <div className={`text-base font-mono font-bold mb-1.5 ${isCall ? 'text-white/90' : 'text-white/90'}`}>
                                    {g.val?.toFixed(g.fmt)}
                                </div>
                                <RatingBar score={score} />
                            </div>
                        );
                    })}
                </div>

                {/* MICRO INSIGHT */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />

                    <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">AI Observation</span>
                    </div>
                    <div className="text-xs text-blue-100/70 leading-relaxed font-medium">
                        {data.oiChg > 0
                            ? (isCall ? "Aggressive call writing absorbed." : "Put floor strengthening.")
                            : "Short covering rally imminent."}
                        {" "}
                        <span className="text-white/40 block mt-1 text-[10px] border-t border-white/5 pt-1">
                            {Math.abs(data.gamma) > 0.001 ? "Gamma risk is elevated." : "Gamma exposure is stable."}
                        </span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
