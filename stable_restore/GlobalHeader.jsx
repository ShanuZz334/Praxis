




















































































































































                    <div className="relative md:rounded-2xl md:border md:border-[var(--border-default)] md:dark:border-[var(--border-default)] md:shadow-[0_8px_24px_rgba(0,0,0,0.45)] md:bg-background-card flex flex-col md:block">
                        {/* FLIP BUTTON FRONT */}
                        <div className="absolute top-3 right-1 md:top-3 md:right-1 z-20">
                            <FlipTrigger 
                                onClick={() => setIsFlipped(true)} 
                                className="text-[var(--color-praxis-blue)] hover:text-[var(--color-praxis-blue)]"
                            />
                        </div>

                {/* TOP ROW: GAUGE | REGIME | INTEGRITY */}
                <div 
                    className="flex flex-col lg:grid lg:grid-cols-3 md:divide-y-0 bg-transparent min-h-0 lg:min-h-[220px] gap-3 md:gap-0 lg:border-b lg:border-border-subtle"
                >

                    {/* A. GAUGE */}
                    <div className="p-3 md:p-6 group relative flex flex-col md:block bg-background-card rounded-2xl border border-border-default shadow-md md:bg-transparent md:border-0 md:shadow-none md:rounded-none lg:border-r lg:border-border-subtle">
                        <div className="flex justify-between items-start mb-2 gap-2">
                            <div className={`${typography.label.sm} flex items-center gap-2 min-w-0 text-[10px] md:text-[11px]`}>
                                <span className="truncate">{title}</span>
                            </div>

                            {/* Delta Pill */}
                            <div className={`flex items-center gap-1 ${deltaColor} bg-background-surface px-1.5 md:px-2 py-1 rounded text-[10px] font-mono border ${STYLES.BORDER_INNER} shrink-0`}>
                                <span className="font-bold">{deltaSign}{deltaVal}%</span>
                                <span className="hidden sm:inline opacity-70 ml-1 italic lowercase">vs prev</span>
                            </div>
                        </div>

                        <div className="flex flex-row items-center md:items-baseline gap-2 md:gap-3 mb-1 text-left">
                            <div className={`${typography.number.giant} text-4xl md:text-6xl lg:text-7xl tracking-tighter`}>{Number(score || 0).toFixed(0)}</div>
                            <div className="flex flex-col justify-end h-full pb-1">
                                <div
                                    className={`text-sm md:text-lg font-bold transition-colors duration-500 uppercase tracking-wide`}
                                    style={{ color: gauge?.color || compositeState.color || 'var(--text-primary)' }}
                                >
                                    {gauge ? gauge.label : compositeState.label}
                                </div>
                                <div className="text-[9px] md:text-[10px] text-text-tertiary font-mono tracking-widest opacity-60">/ 100.00</div>
                            </div>
                        </div>

                        {/* Middle Metrics Row - Only for main dashboard */}
                        {title?.toUpperCase() === "STOCKY COMPOSITE" && (
                            <div className="hidden md:flex items-center justify-between mt-0 mb-2 border border-border-default bg-background-surface/50 rounded-lg py-1 px-1.5 divide-x divide-border-default max-w-[280px]">
                                <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                    <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Trend</span>
                                    <ArrowUp className="w-3 h-3 text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                    <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Momentum</span>
                                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                    <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Risk</span>
                                    <span className="text-[9px] font-bold text-emerald-500">Low</span>
                                </div>
                                <div className="flex items-center gap-1 px-1.5 first:pl-0 last:pr-0">
                                    <span className="text-text-secondary text-[9px] uppercase font-bold tracking-wider">Vol</span>
                                    <span className="text-[9px] font-bold text-amber-500">Med</span>
                                </div>
                            </div>
                        )}

                        {/* Mobile Regime Indicator */}
                        <div className="flex lg:hidden items-center gap-2 mt-2 mb-1 px-3 py-1.5 rounded-xl bg-background-surface/50 border border-border-subtle w-fit">
                            <div className={`text-[11px] font-bold ${regime.color || 'text-text-primary'}`}>{regime.label}</div>
                            <div className="w-1 h-1 rounded-full bg-text-tertiary opacity-30" />
                            <div className="text-[10px] text-text-secondary font-mono">
                                {Number(regime.confidence || 0).toFixed(0)}% Conf
                            </div>
                        </div>

                        {/* Sections Bar (Divergence Chart) - Hidden on Mobile */}
                        <div className="hidden md:block">
                            <SectionBar sections={sections} />
                        </div>
                    </div>

                    {/* B. AI INSIGHT (Replaces Regime) */}
                    <div className="hidden md:block p-0">
                        <AiInsightSection 
                            actionType={regime.label} 
                            confidence={Number(regime.confidence || 0).toFixed(0)} 
                        />
                    </div>

                    {/* C. INTEGRITY */}
                    <div 
                        className="p-3 md:p-6 flex flex-col justify-between gap-2 md:gap-2 bg-background-card rounded-2xl border border-border-default shadow-md md:bg-transparent md:border-0 md:shadow-none md:rounded-none lg:border-l lg:border-border-subtle"
                    >
                        <div className={`${typography.label.sm} uppercase text-[10px] md:text-[11px]`}>Signal Integrity</div>

                        {/* TOP SECTION: Signal Status */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm text-text-primary">Monitor Active</span>
                                </div>
                                <div className="text-xs font-mono text-text-secondary">{integrity.freshness}</div>
                            </div>

















































                </div>

                {/* BOTTOM ROW: CONTROLS (Integrated) */}
                {controls && (
                    <div className="hidden md:block bg-background-card rounded-2xl p-3 border border-border-default shadow-md md:bg-transparent md:border-0 md:shadow-none md:rounded-none md:p-0 md:border-t md:border-border-subtle mt-3 md:mt-0">
                        <HeaderControls controls={controls} />
                    </div>
                )}
            </div>
            }
            back={
                <div className="relative w-full h-full min-h-[300px] md:rounded-2xl md:border md:border-[var(--border-default)] md:shadow-[0_8px_24px_rgba(0,0,0,0.45)] md:overflow-hidden md:bg-background-card flex flex-col items-center justify-center">
                    <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
                        <FlipTrigger 
                            onClick={() => setIsFlipped(false)} 
                            className="text-[var(--color-praxis-blue)] hover:text-[var(--color-praxis-blue)]"
                        />
                    </div>
                    <div className="text-text-tertiary text-sm font-mono opacity-50">
                        Back of Card Content
                    </div>
                </div>
            }
        />
        </div>
    );
}

/* --------------------------------------------------------------------------
   SUB-COMPONENTS (Internal)
-------------------------------------------------------------------------- */

// Helper for Stat Tooltip
function StatBlock({ label, value, color, breakdown }) {
    const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

    const Content = (
        <div className="text-center group/stat cursor-default">
            <div className={`text-[8px] md:text-[9px] uppercase mb-1 md:mb-1.5 tracking-wide transition-colors ${color} opacity-70 group-hover/stat:opacity-100`}>{label}</div>
            <div className={`text-lg md:text-xl font-extrabold ${color} font-mono group-hover/stat:scale-105 transition-transform`}>{value}</div>
        </div>







































                // Fallback logic purely visual for now
                const barColor = isPos ? "bg-emerald-600 dark:bg-emerald-500" : "bg-red-600 dark:bg-red-500";

                return (
                    <div key={s.id} className="relative flex flex-col items-center justify-end h-full group">
                        <div className={`w-2 rounded-full bg-background-surface h-full relative overflow-hidden border ${STYLES.BORDER_INNER}`}>
                            <div
                                className={`absolute bottom-0 w-full ${barColor} transition-all duration-500`}
                                style={{ height: `${heightPct}%` }}
                            />
                        </div>
                        <div className="mt-2 text-[9px] uppercase font-bold text-text-tertiary">{s.label}</div>
                    </div>
                );
            })}
        </div>
    );
}

function ImpactList({ title, items, type }) {
    const isBull = type === 'bull';
    const colorClass = isBull ? "text-emerald-700 dark:text-emerald-500" : "text-red-700 dark:text-red-500";
    const bgClass = "bg-transparent";
    const badgeText = isBull ? "BULLISH DRIVERS" : "BEARISH DRIVERS";
    const valColor = isBull ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-red-600 dark:text-red-400 font-bold";

    return (
        <div className={`p-5 ${bgClass} h-[240px] flex flex-col`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`${colorClass} text-[10px] md:text-[11px] font-bold uppercase tracking-wider`}>{title}</span>
                    <span className={`text-[9px] md:text-[10px] text-text-tertiary px-1 border ${STYLES.BORDER_INNER} rounded`}>{badgeText}</span>
                </div>
            </div>
            <div className="space-y-2">
                {items.length > 0 ? items.map((item, i) => (
                    <div key={item.id || i} className={`flex items-center justify-between p-2 rounded hover:bg-background-surface transition-colors border border-transparent hover:${STYLES.BORDER_INNER}`}>
                        <div>
                            <div className="text-sm text-text-primary font-medium leading-none mb-1">{item.label}</div>
                            <div className="text-[10px] text-text-tertiary">{item.sub || "High Impact"}</div>
                        </div>
                        <div className={`text-xs font-bold ${valColor} font-mono`}>
                            {type === 'bull' ? '+' : ''}{item.value}%
                        </div>
                    </div>
                )) : (
                    <div className="text-xs text-text-tertiary italic">No significant items</div>
                )}
            </div>
        </div>
    );
}

function HeaderControls({ controls }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center md:pt-4 md:p-4 text-text-primary bg-transparent">
            {/* LEFT: Search */}
            <div className="relative group w-full md:w-64 transition-all focus-within:md:w-80 mb-3 md:mb-0 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="text"
                    value={controls.search}
                    onChange={(e) => controls.onSearchChange(e.target.value)}
                    placeholder="Filter metrics..."
                    className={`w-full pl-9 pr-4 py-2 bg-background-app border ${STYLES.BORDER_INNER} rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner`}
                />
            </div>

            {/* MIDDLE: Custom Injected Controls (Options Specific) */}