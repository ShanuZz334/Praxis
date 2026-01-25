import React from "react";
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function NewsCard({ news, onHover, onClick, isSelected }) {
    const {
        title,
        source,
        timestamp,
        category,
        impactScore,
        takeaway,
        tags
    } = news;

    // Impact Badge Color
    let impactColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    let impactLabel = "Low Impact";

    if (impactScore >= 8) {
        impactColor = "text-red-400 bg-red-500/10 border-red-500/20";
        impactLabel = "High Impact";
    } else if (impactScore >= 5) {
        impactColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
        impactLabel = "Medium Impact";
    }

    // Tags Visualization
    const renderTag = (tag, idx) => {
        const isUp = tag.bias === 'up';
        const isDown = tag.bias === 'down';
        const color = isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-slate-400';
        const arrow = isUp ? '↑' : isDown ? '↓' : '-';

        return (
            <span key={idx} className="flex items-center gap-1 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                <span className="text-white/60">{tag.label}</span>
                <span className={`font-bold ${color}`}>{arrow}</span>
            </span>
        );
    };

    return (
        <div
            className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer
            ${isSelected ? 'bg-white/10 border-white/20' : 'bg-[#0b1220] border-white/5 hover:bg-white/5 hover:border-white/10'}
        `}
            onMouseEnter={() => onHover(news)}
            onClick={() => onClick(news)}
        >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{source}</span>
                    <span className="text-[10px] text-white/30">•</span>
                    <span className="text-[10px] text-white/40">{formatDistanceToNow(parseISO(timestamp), { addSuffix: true })}</span>
                </div>
                <div className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${impactColor}`}>
                    {impactLabel}
                </div>
            </div>

            {/* CONTENT */}
            <div className="mb-3">
                <h3 className="text-sm font-semibold text-white/90 leading-snug mb-2 group-hover:text-blue-200 transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                    {takeaway}
                </p>
            </div>

            {/* FOOTER - TAGS */}
            <div className="flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold text-white/30 py-0.5 bg-white/5 px-1.5 rounded">
                    {category}
                </span>
                {tags.map(renderTag)}
            </div>

            {/* IMPACT BAR (Confidence) */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-white/10 rounded-b-xl overflow-hidden">
                <div
                    className="h-full bg-blue-500/50"
                    style={{ width: `${(impactScore / 10) * 100}%` }}
                />
            </div>

        </div>
    );
}
