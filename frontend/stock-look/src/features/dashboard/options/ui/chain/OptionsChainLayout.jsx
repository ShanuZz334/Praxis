import React from 'react';
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import OptionsChainTable from './OptionsChainTable';
import GreeksReferenceGuide from './GreeksReferenceGuide';

export default function OptionsChainLayout({ chain, picks, spotPrice, metrics }) {
    const [selectedOption, setSelectedOption] = React.useState(null);

    return (
        <div className="w-full flex flex-col lg:flex-row gap-4 mt-6 mb-6">

            {/* LEFT SIDEBAR: MARKET CONTEXT vs SELECTED OPTION */}
            <div className="w-full lg:w-64 shrink-0 bg-background-card rounded-xl border border-border-default p-4 flex flex-col gap-4 min-h-[300px] lg:h-[600px]">

                {/* 
                    MOBILE LOGIC: 
                    If an option is selected, show its details here.
                    Otherwise, show the default Market Context.
                */}
                {selectedOption ? (
                    <div className="animate-in fade-in slide-in-from-right duration-300 h-full flex flex-col">
                        <div className="flex items-center justify-between border-b border-border-default pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold font-mono ${selectedOption.type === 'call' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {selectedOption.strike} {selectedOption.type === 'call' ? 'CE' : 'PE'}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedOption(null)}
                                className="p-1 hover:bg-background-surface rounded-full transition-colors text-text-tertiary"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] text-text-tertiary uppercase mb-1">LTP</div>
                                    <div className="text-xl font-bold text-text-primary">₹{selectedOption.data.ltp}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-text-tertiary uppercase mb-1">Change</div>
                                    <div className={`text-sm font-bold ${selectedOption.data.oiChg >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {selectedOption.data.oiChg}%
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-background-surface rounded-lg space-y-2 border border-border-default">
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-tertiary">OI (Open Interest)</span>
                                    <span className="text-text-primary font-mono">{(selectedOption.data.oi / 1000).toFixed(1)}k</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-tertiary">Volume</span>
                                    <span className="text-text-primary font-mono">{selectedOption.data.vol}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-tertiary">IV (Implied Vol)</span>
                                    <span className="text-orange-600 font-mono font-bold">{selectedOption.data.iv}%</span>
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-text-tertiary uppercase mb-2 border-b border-border-default pb-1">Greeks</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20 flex justify-between text-blue-600 font-bold">
                                        <span>Delta</span>
                                        <span className="font-mono">{(selectedOption.data.delta || 0).toFixed(3)}</span>
                                    </div>
                                    <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20 flex justify-between text-purple-600 font-bold">
                                        <span>Gamma</span>
                                        <span className="font-mono">{(selectedOption.data.gamma || 0).toFixed(3)}</span>
                                    </div>
                                    <div className="bg-orange-500/10 p-2 rounded border border-orange-500/20 flex justify-between text-orange-600 font-bold">
                                        <span>Theta</span>
                                        <span className="font-mono">{(selectedOption.data.theta || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="bg-teal-500/10 p-2 rounded border border-teal-500/20 flex justify-between text-teal-600 font-bold">
                                        <span>Vega</span>
                                        <span className="font-mono">{(selectedOption.data.vega || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest border-b border-border-default pb-2">
                            Market Context
                        </div>

                        {/* Stats */}
                        <div className="space-y-4 shrink-0">
                            {/* SPOT */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] text-text-tertiary uppercase">Spot Price</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Current underlying index price.</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className="text-2xl font-bold text-text-primary tracking-tight">{spotPrice.toLocaleString()}</div>
                            </div>

                            {/* PCR (Volume) */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] text-text-tertiary uppercase">PCR (Volume)</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Put-Call Ratio.<br /><span className="text-emerald-500">{' > 1.0'}</span>: Bullish Support (Oversold)<br /><span className="text-red-500">{' < 0.7'}</span>: Bearish Resistance</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className={`text-xl font-mono font-bold ${(metrics.pcr || 1) > 1.5 ? 'text-emerald-600' :
                                    (metrics.pcr || 1) > 1.1 ? 'text-emerald-600' :
                                        (metrics.pcr || 1) > 0.9 ? 'text-text-primary' :
                                            (metrics.pcr || 1) < 0.6 ? 'text-red-700' :
                                                'text-red-600'
                                    }`}>
                                    {metrics.pcr?.toFixed(2)}
                                </div>
                            </div>

                            {/* MAX PAIN */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] text-text-tertiary uppercase">Max Pain</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Strike price where option writers lose the least.<br />Functions as a market magnet.</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className="text-xl font-mono font-bold text-orange-600">
                                    {metrics.maxPain}
                                </div>
                            </div>

                            {/* IV RANK (New) */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] text-text-tertiary uppercase">IV Rank</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Current Implied Volatility vs 1-Year Range.<br /><span className="text-red-600">High (&gt;60)</span>: Options Expensive<br /><span className="text-emerald-600">Low (&lt;30)</span>: Options Cheap</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                {/* Mocking IV Rank as we don't assume metrics has it fully populated yet, or use metrics.ivRank */}
                                <div className={`text-xl font-mono font-bold ${(metrics.ivRank || 34) > 60 ? 'text-red-600' :
                                    (metrics.ivRank || 34) < 30 ? 'text-emerald-600' :
                                        'text-amber-600'
                                    }`}>
                                    {metrics.ivRank || 34} <span className="text-[10px] text-text-tertiary font-normal align-top">%</span>
                                </div>
                            </div>
                        </div>

                        {/* GREEKS GUIDE - EDUCATIONAL (Hidden on Mobile) */}
                        <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
                            <GreeksReferenceGuide />
                        </div>
                    </>
                )}
            </div>

            {/* CENTER: FULL CHAIN */}
            <div className="flex-1 flex flex-col min-w-0 h-[600px] lg:h-[600px]">
                <div className="flex items-center justify-between mb-2 px-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Options Chain
                    </div>

                </div>
                <OptionsChainTable
                    chain={chain}
                    spotPrice={spotPrice}
                    onOptionSelect={(data, type, strike) => setSelectedOption({ data, type, strike })}
                />
            </div>

            {/* RIGHT SIDEBAR: PRO PICKS */}
            <div className="w-full lg:w-64 shrink-0 bg-background-card rounded-xl border border-border-default p-0 flex flex-col overflow-hidden max-h-[400px] lg:max-h-full lg:h-[600px]">
                <div className="p-4 border-b border-border-default bg-background-surface">
                    <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-widest">
                        Pro Desk Picks
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-3 no-scrollbar">
                    {/* Calls */}
                    <div className="space-y-2">
                        <div className="text-[10px] text-emerald-600 font-bold uppercase">Top Calls (Bullish)</div>
                        {picks.ce.map((pick, i) => (
                            <div key={i} className="group p-3 bg-emerald-500/[0.12] border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg transition-colors cursor-pointer">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-text-primary text-sm">{pick.strike} CE</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-background-surface text-text-secondary font-mono border border-border-default">{pick.dte}</span>
                                    </div>
                                    <span className="text-xs font-mono text-emerald-600 font-bold">₹{pick.ltp}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-text-secondary font-medium">
                                    <span>Δ {pick.delta.toFixed(2)}</span>
                                    <span className="text-text-primary">OI {pick.oiChg > 0 ? '+' : ''}{pick.oiChg}%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Puts */}
                    <div className="space-y-2 mt-4">
                        <div className="text-[10px] text-red-600 font-bold uppercase">Top Puts (Bearish)</div>
                        {picks.pe.map((pick, i) => (
                            <div key={i} className="group p-3 bg-red-500/[0.12] border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors cursor-pointer">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-text-primary text-sm">{pick.strike} PE</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-background-surface text-text-secondary font-mono border border-border-default">{pick.dte}</span>
                                    </div>
                                    <span className="text-xs font-mono text-red-600 font-bold">₹{pick.ltp}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-text-secondary font-medium">
                                    <span>Δ {pick.delta.toFixed(2)}</span>
                                    <span className="text-text-primary">OI {pick.oiChg > 0 ? '+' : ''}{pick.oiChg}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
