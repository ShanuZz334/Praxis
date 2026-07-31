import React, { useState } from "react";
import { Cpu, RotateCcw, Trash2 } from "lucide-react";
import { getColorMap, EVENT_CATEGORIES } from "@/shared/global/logic/eventsEngine";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { FO_EQUITIES, FO_INDICES } from "@/shared/utils/foInstruments";
import { toast } from "sonner";

export default function AdvancedNewsFeed({ newsItems, searchQuery, sortMode, onReset, onDeleteEvent }) {
    const [activeTab, setActiveTab] = useState("ALL EVENTS");

    if (!newsItems) return null;

    // Filter by tab, search, and TTL expiry
    const filtered = newsItems.filter(news => {
        // Expiry check
        const ttlHours = Number(news.ttl_hours) || 72;
        const eventDate = news.published_time ? new Date(news.published_time) : new Date(news.created_at || Date.now());
        const expiryDate = new Date(eventDate.getTime() + ttlHours * 60 * 60 * 1000);
        if (new Date() > expiryDate) return false;

        if (activeTab !== "ALL EVENTS" && news.category?.toUpperCase() !== activeTab.toUpperCase()) {
            return false;
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const inHeadline = news.headline?.toLowerCase().includes(query);
            const inSummary = news.summary?.toLowerCase().includes(query);
            const inAssets = Array.isArray(news.affected_assets) && news.affected_assets.some(a => a.toLowerCase().includes(query));
            if (!inHeadline && !inSummary && !inAssets) return false;
        }
        return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortMode === "latest") {
            return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortMode === "score_desc") {
            return b.event_score - a.event_score;
        }
        if (sortMode === "score_asc") {
            return a.event_score - b.event_score;
        }
        return 0;
    });

    const TABS = ["ALL EVENTS", "MACRO", "EARNINGS", "POLICY", "CORPORATE", "GEOPOLITICAL", "COMMODITIES"];

    return (
        <div className="w-full space-y-4">
            {/* Toolbar: Tabs & Sort */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-border-default">
                <div className="flex overflow-x-auto custom-scrollbar-hidden w-full md:w-auto gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                                activeTab === tab 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-text-tertiary hover:bg-background-surface hover:text-text-secondary'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {onReset && (
                        <button
                            onClick={() => { setActiveTab("ALL EVENTS"); onReset(); }}
                            className="p-1 hover:bg-background-surface rounded-md transition-colors group"
                            title="Reset Filters"
                        >
                            <RotateCcw className="w-4 h-4 text-text-tertiary group-hover:text-blue-400 transition-colors" />
                        </button>
                    )}
                </div>
            </div>

            {/* Top Legend */}
            <div className="pb-4 border-b border-border-default flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 text-[9px] uppercase font-bold tracking-widest text-text-tertiary">
                <div className="flex flex-wrap gap-x-12 gap-y-4">
                    <div className="flex flex-col gap-2.5">
                        <span>Severity Levels</span>
                        <div className="flex items-center gap-4 text-text-primary/80">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" /> Normal</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Important</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" /> Major</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" /> Systemic</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" /> Black Swan</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <span>Override Modes</span>
                        <div className="flex items-center gap-4 text-text-primary/80">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" /> None</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" /> Watch</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" /> Override</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 w-full xl:w-72 mt-2 xl:mt-0">
                    <span className="text-left">Event Score Scale</span>
                    <div className="w-full relative pt-1">
                        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-red-600 via-gray-400 to-green-600" />
                        <div className="flex justify-between items-center text-[9px] mt-1.5 text-text-primary/80 font-mono">
                            <span>-10</span>
                            <span>-5</span>
                            <span>0</span>
                            <span>+5</span>
                            <span>+10</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feed List */}
            <div className="space-y-3">
                {sorted.length > 0 ? (
                    sorted.map((news) => (
                        <NewsItem key={news.id} event={news} onDelete={() => onDeleteEvent && onDeleteEvent(news.id)} />
                    ))
                ) : (
                    <div className="py-10 flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl">
                        <Cpu className="w-8 h-8 text-text-tertiary mb-3 opacity-50" />
                        <div className="text-sm text-text-secondary font-medium">No events found</div>
                        <div className="text-xs text-text-tertiary mt-1">Try adjusting your filters or adding a new event.</div>
                    </div>
                )}
            </div>

        </div>
    );
}

function NewsItem({ event, onDelete }) {
    const { setAdditionalCharts } = useDashboardContext();
    const [showAllAssets, setShowAllAssets] = React.useState(false);
    const colors = getColorMap(event);
    const date = new Date(event.published_time || event.created_at);

    const handleAssetClick = (e, asset) => {
        e.stopPropagation();
        const symbolUpper = asset.toUpperCase();
        const instrument = FO_EQUITIES.find(eq => eq.label.toUpperCase() === symbolUpper) || 
                           FO_INDICES.find(idx => idx.label.toUpperCase() === symbolUpper || idx.label.replace(/\s+/g, '').toUpperCase() === symbolUpper);
                           
        if (!instrument) {
            toast.error(`Instrument ${asset} not found in tracked universe`);
            return;
        }

        setAdditionalCharts(prev => {
            if (prev.find(c => c.value === instrument.value)) {
                toast.info(`${asset} is already pinned to Dashboard`);
                return prev;
            }
            toast.success(`${asset} added to Master Dashboard`);
            return [...prev, instrument];
        });
    };
    
    const formattedDate = date.toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    }).replace(',', '');

    const diffMins = Math.floor((new Date() - date) / 60000);
    let timeAgo = "Just now";
    if (diffMins > 0 && diffMins < 60) timeAgo = `${diffMins}m ago`;
    else if (diffMins >= 60 && diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)}h ago`;
    else if (diffMins >= 1440) timeAgo = `${Math.floor(diffMins / 1440)}d ago`;

    // Calculate TTL / Wear-off percentage
    const ttlHours = Number(event.ttl_hours) || 72;
    const ttlMins = ttlHours * 60;
    const remainingMins = Math.max(0, ttlMins - diffMins);
    const percentRemaining = Math.max(0, Math.min(100, (remainingMins / ttlMins) * 100));

    // Determine icon based on sentiment value
    const sentimentLower = event.sentiment?.toLowerCase() || '';
    const isBullish = sentimentLower.includes('bull') || sentimentLower.includes('positive');
    const isBearish = sentimentLower.includes('bear') || sentimentLower.includes('negative');
    const sentimentIcon = isBullish ? 'bull' : isBearish ? 'bear' : 'neutral';

    let confIcon = 'confidence-low';
    const c = Number(event.confidence) || 0;
    if (c >= 85) confIcon = 'confidence-max';
    else if (c >= 70) confIcon = 'confidence-high';
    else if (c >= 50) confIcon = 'confidence-medium';

    return (
        <div 
            className="group relative w-full bg-background-card border border-border-default hover:border-border-subtle transition-all duration-200 rounded-xl overflow-hidden cursor-pointer"
            onDoubleClick={() => {
                const url = event.source_url || event.article_link || event.url || event.link;
                if (url) {
                    window.open(url, '_blank');
                } else {
                    const searchStr = event.headline || event.title || '';
                    window.open(`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(searchStr)}`, '_blank');
                }
            }}
            title="Double-click to read full article"
        >
            {/* Delete Button (visible on hover) */}
            {onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute bottom-3 right-4 p-1.5 bg-background-surface/90 hover:bg-red-500/10 text-text-tertiary hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                    title="Delete Event"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            {/* Left Accent Bar (TTL Depleting Timer) */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-background-surface overflow-hidden">
                <div 
                    className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-linear"
                    style={{ 
                        height: `${percentRemaining}%`, 
                        backgroundColor: colors.scoreHex 
                    }}
                />
            </div>

            <div className="pl-6 pr-4 py-4 flex flex-col xl:flex-row gap-6">
                
                {/* Left Column: Content */}
                <div className="flex-1 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest flex-wrap">
                        <span style={{ color: colors.sourceHex }}>{event.source}</span>
                        <span className="text-text-tertiary">•</span>
                        <span style={{ color: colors.categoryHex }}>{event.category}</span>
                        <span className="text-text-tertiary">•</span>
                        <span className="text-text-tertiary normal-case tracking-normal">{timeAgo}</span>
                    </div>

                    <h3 className="text-[15px] font-bold text-text-primary leading-snug">
                        {event.headline}
                    </h3>
                    
                    <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-2">
                        {event.summary}
                    </p>

                    {Array.isArray(event.affected_assets) && event.affected_assets.length > 0 && (
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className="text-[10px] font-bold text-[#3B82F6] mr-1">Affected Assets:</span>
                            {(showAllAssets ? event.affected_assets : event.affected_assets.slice(0, 5)).map(a => (
                                <span 
                                    key={a} 
                                    onClick={(e) => handleAssetClick(e, a)}
                                    className="text-[9px] px-2 py-0.5 rounded bg-[#1E3A8A]/30 text-[#3B82F6] border border-[#1E3A8A] font-bold tracking-wider uppercase cursor-pointer hover:bg-[#3B82F6] hover:text-white transition-colors"
                                >
                                    {a}
                                </span>
                            ))}
                            {!showAllAssets && event.affected_assets.length > 5 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowAllAssets(true); }}
                                    className="text-[9px] px-2 py-0.5 rounded bg-[#1E3A8A]/30 text-[#3B82F6] border border-[#1E3A8A] font-bold tracking-wider uppercase hover:bg-[#1E3A8A]/50 transition-colors cursor-pointer"
                                >
                                    +{event.affected_assets.length - 5}
                                </button>
                            )}
                            {showAllAssets && event.affected_assets.length > 5 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowAllAssets(false); }}
                                    className="text-[9px] px-2 py-0.5 rounded bg-[#1E3A8A]/30 text-[#3B82F6] border border-[#1E3A8A] font-bold tracking-wider uppercase hover:bg-[#1E3A8A]/50 transition-colors cursor-pointer"
                                >
                                    Show Less
                                </button>
                            )}
                        </div>
                    )}
                    {Array.isArray(event.key_data_points) && event.key_data_points.length > 0 && (
                        <div className="flex items-center flex-wrap gap-2 mt-1.5">
                            {event.key_data_points.slice(0, 3).map((pt, i) => (
                                <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                    {pt}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Vertical Divider (Hidden on smaller screens) */}
                <div className="hidden xl:block w-px bg-border-default shrink-0 my-1" />

                {/* Middle Column 1: Sentiment, Importance, Confidence */}
                <div className="flex flex-col justify-between shrink-0 xl:w-32 py-1 gap-3 xl:gap-0">
                    <Metric icon={sentimentIcon} label="Sentiment" value={event.sentiment} color={colors.sentiment} />
                    <Metric icon={`importance-${(event.importance || "low").toLowerCase()}`} label="Importance" value={event.importance} color={colors.importance} />
                    <Metric icon={confIcon} label="Confidence" value={`${event.confidence}%`} color={colors.confidence} />
                </div>

                {/* Middle Column 2: Severity, Override, Horizon */}
                <div className="flex flex-col justify-between shrink-0 xl:w-32 py-1 gap-3 xl:gap-0">
                    <Metric icon={`severity-${event.severity?.toLowerCase()}`} label="Severity" value={event.severity} color={colors.severity} />
                    <Metric icon={`override-${(event.override_mode || "none").toLowerCase()}`} label="Override" value={event.override_mode || "None"} color={colors.override} />
                    <Metric icon={`horizon-${(event.horizon || "intraday").toLowerCase().replace(' ', '-')}`} label="Horizon" value={event.horizon} color={colors.horizon} />
                </div>

                {/* Vertical Divider (Hidden on smaller screens) */}
                <div className="hidden xl:block w-px bg-border-default shrink-0 my-1" />

                {/* Right Column: Score, Source, Date */}
                <div className="flex flex-col justify-between items-start shrink-0 xl:w-48 py-1">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] uppercase text-text-tertiary tracking-widest">Event Score</span>
                        <div 
                            className="text-[15px] font-mono font-bold px-3 py-1 rounded border"
                            style={{ 
                                color: colors.scoreHex, 
                                backgroundColor: `${colors.scoreHex}15`,
                                borderColor: `${colors.scoreHex}30`
                            }}
                        >
                            {event.event_score > 0 ? '+' : ''}{(event.event_score / 10).toFixed(1)}
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-start text-left gap-3 mt-4 xl:mt-auto w-full">
                        <div>
                            <div className="text-[9px] text-text-tertiary tracking-wide mb-1">Source</div>
                            <div className="text-[12px] text-text-primary font-medium">{event.source}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-text-tertiary tracking-wide flex items-center justify-start gap-1.5 mb-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Published
                            </div>
                            <div className="text-[11px] text-text-secondary pr-8">{formattedDate}</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function Metric({ icon, label, value, color }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {icon === 'bull' && (
                    <svg width="18" height="18" viewBox="0 0 512 512" fill={color} stroke="none"><path d="M68.596 28.182c-86.767 50.67-51.027 136.884 123.35 136.884l2.835-70.433c-71.07 14-169.105 15.57-126.184-66.45zm378.455 0c42.92 82.022-55.114 80.45-126.185 66.45l2.836 70.434c174.378 0 210.117-86.213 123.35-136.884zM174.206 220.768c-3.798.104-7.758.785-11.816 2.087-1.887 29.822 11.63 50.308 48.516 39.88-.462-26.26-16.194-42.53-36.7-41.967zm167.213 0c-20.507-.563-36.24 15.707-36.7 41.966 36.886 10.43 50.404-10.057 48.518-39.88-4.058-1.3-8.02-1.982-11.818-2.086zm-53.123 162.7l-10.793 15.266c15.535 10.978 19.19 32.196 8.21 47.73C274.736 462 253.533 465.64 238 454.663c-15.535-10.978-19.19-32.193-8.21-47.728 2.03-2.875 4.483-5.42 7.288-7.543l-11.263-14.894c-4.34 3.283-8.153 7.203-11.292 11.645-16.805 23.784-11.098 56.982 12.685 73.788 23.784 16.806 56.956 11.098 73.762-12.686 16.806-23.783 11.11-56.967-12.672-73.773z"/></svg>
                )}
                {icon === 'bear' && (
                    <svg width="18" height="18" viewBox="0 0 512 512" fill={color} stroke="none"><path d="M220.41 35.389c-.584-.175-9.216 1.425-18.76 7.976-8.948 6.143-18.914 15.31-27.283 25.137l.34.268c-6.134 7.797-13.129 16.816-17.613 25.767-4.485 8.951-6.294 17.19-3.989 24.71l-17.209 5.274c-4.144-13.518-.522-26.817 5.104-38.046 2.208-4.408 4.753-8.587 7.398-12.52C105.378 74.11 62.33 71.25 18 66.748v409.828a264.891 264.891 0 0 1 24.8-19.922l1.901-1.345 2.313-.254c24.034-2.65 55.821-6.651 84.908-15.803 29.086-9.152 54.934-23.401 68.633-45.191l2.558-4.073 4.809-.134c91.21-2.547 140.126-19.862 193.652-50.153.126-.095.252-.199.377-.295-6.874-.376-14.493-.65-22.334-.617-20.444.086-42.1 3.08-51.367 8.973l-9.658-15.188c16.106-10.242 39.29-11.694 60.949-11.785 15.73-.066 30.683 1.026 40.254 1.797 6.938-7.739 13.533-16.503 19.18-25.514 5.066-8.086 9.33-16.386 12.537-24.177-3.821-.55-7.395-1.642-10.633-3.258-8.283-4.134-14.026-11.447-16.754-19.596-3.827-11.432-2.087-24.798 5.268-35.777l-64.641-23.35.277-6.598c.396-9.422-6.387-27.053-14.601-34.712-21.568-20.112-46.91-21.58-78.06-33.93l-3.554-1.408-1.453-3.536c-10.662-25.924-17.06-44.024-23.47-55.5-6.412-11.475-11.574-16.287-23.48-19.841zm-5.808 20.82l9.84 15.072c-29.07 18.978-29.771 34.937-31.23 51.65l-17.93-1.562c1.5-17.208 5.882-43.33 39.32-65.16zM119.6 135.473l8.119 16.064c-42.266 21.357-60.741 47.237-65.88 70.451 14.366-11.279 29.7-17.184 50.218-16.46l15.238.538-7.834 13.08c-17.268 28.834-22.552 42.534-26.24 59.696 4.017-1.528 8.007-2.635 12.119-2.979 9.78-.818 19.142 2.28 29.105 7.746l9.5 5.211-6.869 8.383c-9.978 12.178-13.966 20.02-15.224 27.56-.477 2.856-.454 5.974-.198 9.333 2.711-2.798 5.58-5.305 8.942-7.198 9.125-5.137 19.745-5.825 33.097-4.632l-1.601 17.927c-11.9-1.063-18.132-.162-22.666 2.391-4.534 2.553-8.91 7.798-14.88 18.39l-11.05 19.614-5.516-21.826c-3.535-13.99-5.842-25.216-3.882-36.961 1.486-8.91 5.434-17.37 12.002-26.742-3.422-1.103-6.376-1.5-9.258-1.258-5.244.439-11.572 3.057-20.965 9.203l-17.365 11.361 3.572-20.441c4.283-24.513 7.539-40.242 23.588-69.49-14.037 2.56-23.415 10.322-37.408 25.492l-13.442 14.57-2.12-19.709c-3.829-35.558 16.816-78.954 76.898-109.314zm143.707 26.976c17.788 7.852 39.24 14.301 56.859 16.617l3.707 17.616c-3.852.81-7.24.644-10.861.07-1.363 9.026-9.537 15.736-18.74 15.736-10.089 0-18.946-8.06-18.946-18.396 0-2.45.511-4.766 1.404-6.883-8.85-3.702-23.717-6.978-28.798-14.723 5.796-2.514 14.755-10.553 15.375-10.037zM443.633 225.4c-3.758 6.287-4.294 13.381-2.438 18.928 1.396 4.17 3.941 7.317 7.721 9.203 2.142 1.07 4.803 1.797 8.147 1.823.303-1.51.546-2.968.707-4.348-.926-6.793-6.555-16.61-14.137-25.606z"/></svg>
                )}
                {icon === 'neutral' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                )}
                {icon === 'severity-normal' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                )}
                {icon === 'severity-important' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
                {icon === 'severity-major' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21h14L15.3 10.5C14.7 9 13.5 8 12 8s-2.7 1-3.3 2.5L5 21z"/><path d="M12 8v-3"/><path d="M8.5 7l-2-2"/><path d="M15.5 7l2-2"/></svg>
                )}
                {icon === 'severity-systemic' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                )}
                {icon === 'severity-black swan' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/></svg>
                )}
                {icon === 'alert' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                )}
                {icon === 'importance-low' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                )}
                {icon === 'importance-medium' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                )}
                {icon === 'importance-high' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                )}
                {icon === 'importance-critical' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
                )}
                {icon === 'override-none' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                )}
                {icon === 'override-watch' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
                {icon === 'override-override' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                )}
                {icon === 'confidence-low' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/></svg>
                )}
                {icon === 'confidence-medium' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/></svg>
                )}
                {icon === 'confidence-high' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/></svg>
                )}
                {icon === 'confidence-max' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
                )}
                {icon === 'horizon-intraday' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                )}
                {icon === 'horizon-swing' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                )}
                {icon === 'horizon-positional' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                )}
                {icon === 'horizon-structural' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                )}
                {icon === 'horizon-long-term' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12c0-4 4-8 8-8s8 4 8 8-4 8-8 8-8-4-8-8z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary tracking-wide">{label}</span>
                <span className="text-[12px] font-bold mt-0.5 leading-none" style={{ color }}>{value}</span>
            </div>
        </div>
    );
}
