/**
 * @file EventAlertToast.jsx
 * @purpose Premium custom toast card for high-impact market events.
 */

import React from 'react';
import { toast } from 'sonner';
import { Zap, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/shared/global/logic/eventsEngine';
import { useTheme } from '@/shared/context/ThemeContext';

export default function EventAlertToast({ event, displayScore, toastId }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const sentimentLower = event.sentiment?.toLowerCase() || '';
    const isBullish = sentimentLower.includes('bull') || sentimentLower.includes('positive');
    const isBearish = sentimentLower.includes('bear') || sentimentLower.includes('negative');

    const sentimentColor = isBullish ? '#22C55E' : isBearish ? '#EF4444' : (isDark ? '#94A3B8' : '#64748B');
    const SentimentIcon  = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;

    const categoryColor = EVENT_CATEGORIES.find(
        c => c.label?.toLowerCase() === event.category?.toLowerCase()
    )?.color || (isDark ? '#94A3B8' : '#64748B');

    const scoreAbs  = Math.abs(Number(displayScore) || 0);
    const scoreSign = isBullish ? '+' : isBearish ? '−' : '';

    const affectedAssets = Array.isArray(event.affected_assets)
        ? event.affected_assets.slice(0, 3)
        : [];

    const handleOpen = () => {
        const url = event.source_url || event.article_link || event.url || event.link;
        window.open(
            url || `https://www.google.com/search?tbm=nws&q=${encodeURIComponent(event.headline || '')}`,
            '_blank'
        );
    };

    return (
        <div
            onClick={handleOpen}
            className={`relative flex overflow-hidden rounded-2xl cursor-pointer select-none group ${isDark ? 'text-white' : 'text-slate-900'}`}
            style={{
                width: 360,
                background: isDark ? 'rgba(10, 12, 22, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: isDark 
                    ? `0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`
                    : `0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)`,
                backdropFilter: 'blur(24px)',
            }}
        >
            {/* Left accent bar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: `linear-gradient(to bottom, ${categoryColor}, ${categoryColor}${isDark ? '40' : '80'})` }}
            />

            <div className="flex flex-col gap-3 pl-5 pr-4 py-4 w-full">

                {/* Row 1: Icon + label + dismiss */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={11} style={{ color: categoryColor }} className="shrink-0" />
                        <span
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{ color: categoryColor }}
                        >
                            {event.category}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-white/15' : 'text-slate-900/15'}`}>·</span>
                        <span className={`text-[10px] font-medium tracking-wide ${isDark ? 'text-white/35' : 'text-slate-500'}`}>
                            {event.source}
                        </span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toast.dismiss(toastId); }}
                        className={`w-5 h-5 flex items-center justify-center rounded-lg transition-all shrink-0 ${
                            isDark 
                                ? 'text-white/20 hover:text-white/60 hover:bg-white/10' 
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <X size={11} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Row 2: Headline */}
                <p className={`text-[13px] font-semibold leading-snug line-clamp-2 transition-colors pr-1 ${
                    isDark ? 'text-white/90 group-hover:text-white' : 'text-slate-800 group-hover:text-black'
                }`}>
                    {event.headline}
                </p>

                {/* Row 3: Sentiment + assets + score */}
                <div className="flex items-center gap-2">
                    {/* Sentiment chip */}
                    <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                        style={{
                            color: sentimentColor,
                            background: isDark ? `${sentimentColor}14` : `${sentimentColor}10`,
                            border: `1px solid ${isDark ? `${sentimentColor}30` : `${sentimentColor}40`}`,
                        }}
                    >
                        <SentimentIcon size={8} strokeWidth={3} />
                        {isBullish ? 'Bullish' : isBearish ? 'Bearish' : 'Neutral'}
                    </div>

                    {/* Assets */}
                    {affectedAssets.map(a => (
                        <span
                            key={a}
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider uppercase shrink-0"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                color:      isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.60)',
                                border:     isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                            }}
                        >
                            {a}
                        </span>
                    ))}

                    {/* Score — pushed to the right */}
                    <span
                        className="ml-auto text-[14px] font-black tabular-nums shrink-0"
                        style={{ color: sentimentColor }}
                    >
                        {scoreSign}{scoreAbs.toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
    );
}
