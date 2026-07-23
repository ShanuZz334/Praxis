import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { useDataRegistry } from '@/shared/context/DataRegistryContext';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { Newspaper } from 'lucide-react';

export default function CatalystCalendar() {
    const { marketNews } = useDashboardContext();
    const { register } = useDataRegistry();
    const newsItems = marketNews || [];

    // Phase 2 Fix B: Register into DataRegistry so @Catalyst Calendar resolves with real news
    useEffect(() => {
        if (!marketNews || marketNews.length === 0) return;
        const headlines = marketNews.slice(0, 3).map(n => n.heading || '').filter(Boolean);
        register('master', CARD_REGISTRY.catalyst_calendar.id, {
            displayName: 'Catalyst Calendar',
            value: `${marketNews.length} news items`,
            score: null,
            signal: 'neutral',
            additionalContext: headlines.join(' | '),
        });
    }, [marketNews, register]);

    
    if (!marketNews) {
        return (
            <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full opacity-50">
                <div className="flex items-center gap-2 mb-4">
                    <Newspaper className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Live Market News</h3>
                </div>
                <p className="text-[11px] text-text-secondary">Fetching latest news...</p>
            </div>
        );
    }

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Live Market News</h3>
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {newsItems.length === 0 ? (
                    <div className="text-[10px] text-text-tertiary px-2">No recent news found for tracked instruments.</div>
                ) : newsItems.map((news, i) => {
                    const pubDate = new Date(news.published_time);
                    const now = new Date();
                    const isToday = pubDate.toDateString() === now.toDateString();
                    
                    const timeString = isToday 
                        ? pubDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                        : pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                        <a 
                            key={i} 
                            href={news.article_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block flex flex-col bg-background-elevated px-3 py-2.5 rounded border border-border-subtle hover:border-brand-primary/50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                {news.thumbnail && (
                                    <img 
                                        src={news.thumbnail} 
                                        alt="" 
                                        className="w-12 h-12 object-cover rounded opacity-80"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11.5px] font-bold text-text-primary leading-snug line-clamp-2 mb-1" title={news.heading}>
                                        {news.heading}
                                    </h4>
                                    <p className="text-[10px] text-text-tertiary line-clamp-1 mb-1">
                                        {news.summary}
                                    </p>
                                    <div className="flex justify-between items-center mt-1.5">
                                        <span className="text-[9px] text-brand-primary/80 font-semibold uppercase tracking-wider">
                                            {timeString}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
