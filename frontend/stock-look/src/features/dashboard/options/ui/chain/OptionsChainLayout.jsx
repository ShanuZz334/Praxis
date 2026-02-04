/**
 * @file OptionsChainLayout.jsx
 * @purpose Layout container for the deep-dive Options Chain interface.
 * @responsibilities
 * - Manages the split-view layout: Context Sidebar | Main Chain Table | Pro Picks Sidebar.
 * - Handles the "Selected Option" state for the detail view on the left.
 * - Displays high-level metrics (Spot Price, PCR, Max Pain) when no option is selected.
 * - Adapts to mobile views by stacking components.
 * @key_exports
 * - OptionsChainLayout (Default Component)
 * @dependencies
 * - OptionsChainTable: The main grid.
 * - GreeksReferenceGuide: Educational component.
 * - PortalTooltip: For quick stats.
 * @lifecycle
 * - Rendered by OptionsPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from 'react';
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import OptionsChainTable from './OptionsChainTable';
import GreeksReferenceGuide from './GreeksReferenceGuide';

// =============================
// Main Component
// =============================
export default function OptionsChainLayout({ chain, picks, spotPrice, metrics }) {
    const [selectedOption, setSelectedOption] = React.useState(null);

    return (
        <div className="w-full flex flex-col lg:flex-row gap-3 mt-4 mb-6">

            {/* ================= LEFT PANEL: CONTEXT / DETAILS ================= */}
            <div className="w-full lg:w-60 shrink-0 bg-background-card rounded-xl border border-border-default p-3 flex flex-col gap-3 min-h-[300px] lg:h-[600px]">

                {/* MODE A: DETAIL VIEW (If Option Selected) */}
                {selectedOption ? (
                    <div className="animate-in fade-in slide-in-from-right duration-300 h-full flex flex-col">
                        {/* Selected Header */}
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

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pt-1">
                            {/* Primary Stats Grid: 2-col on Mobile, 1-col on Laptop */}
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-3 px-1">
                                <div className="group">
                                    <div className="text-[9px] text-text-tertiary uppercase mb-0.5 font-bold tracking-wider">LTP</div>
                                    <div className="text-lg font-bold text-text-primary leading-none tabular-nums italic">₹{selectedOption.data.ltp}</div>
                                </div>
                                <div className="group">
                                    <div className="text-[9px] text-text-tertiary uppercase mb-0.5 font-bold tracking-wider">Change</div>
                                    <div className={`text-xs font-bold leading-none ${selectedOption.data.oiChg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {selectedOption.data.oiChg > 0 ? '+' : ''}{selectedOption.data.oiChg}%
                                    </div>
                                </div>
                                <div className="group">
                                    <div className="text-[9px] text-text-tertiary uppercase mb-0.5 font-bold tracking-wider">OI</div>
                                    <div className="text-xs font-mono font-bold text-text-primary leading-none">{(selectedOption.data.oi / 1000).toFixed(1)}k</div>
                                </div>
                                <div className="group">
                                    <div className="text-[9px] text-text-tertiary uppercase mb-0.5 font-bold tracking-wider">Volume</div>
                                    <div className="text-xs font-mono font-bold text-text-primary leading-none text-ellipsis overflow-hidden">{selectedOption.data.vol}</div>
                                </div>
                            </div>

                            {/* IV (Integrated) */}
                            <div className="flex justify-between items-center px-1 border-t border-border-default/20 pt-3">
                                <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">Implied Vol (IV)</span>
                                <span className="text-orange-500 font-mono font-bold text-xs leading-none">{selectedOption.data.iv}%</span>
                            </div>

                            {/* Greeks Section */}
                            <div className="pt-1">
                                <div className="text-[9px] text-text-tertiary uppercase mb-3 border-b border-border-default/20 pb-1.5 font-bold tracking-widest flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                                    Greek Metrics
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 text-xs px-1">
                                    {/* Delta */}
                                    <div className="flex flex-col gap-1.5 group transition-all">
                                        <div className="flex justify-between items-center text-blue-500 font-bold">
                                            <span className="text-[9px] uppercase tracking-wider">Delta</span>
                                            <span className="font-mono text-[11px]">{(selectedOption.data.delta || 0).toFixed(3)}</span>
                                        </div>
                                        <div className="w-full bg-blue-500/10 h-0.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                                style={{ width: `${Math.min(Math.abs(selectedOption.data.delta || 0) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Gamma */}
                                    <div className="flex flex-col gap-1.5 group transition-all">
                                        <div className="flex justify-between items-center text-purple-500 font-bold">
                                            <span className="text-[9px] uppercase tracking-wider">Gamma</span>
                                            <span className="font-mono text-[11px]">{(selectedOption.data.gamma || 0).toFixed(4)}</span>
                                        </div>
                                        <div className="w-full bg-purple-500/10 h-0.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-purple-500 h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                                                style={{ width: `${Math.min((selectedOption.data.gamma || 0) * 5000, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Theta */}
                                    <div className="flex flex-col gap-1.5 group transition-all">
                                        <div className="flex justify-between items-center text-orange-500 font-bold">
                                            <span className="text-[9px] uppercase tracking-wider">Theta</span>
                                            <span className="font-mono text-[11px]">{(selectedOption.data.theta || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-orange-500/10 h-0.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-orange-500 h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                                                style={{ width: `${Math.min(Math.abs(selectedOption.data.theta || 0) * 5, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Vega */}
                                    <div className="flex flex-col gap-1.5 group transition-all">
                                        <div className="flex justify-between items-center text-teal-500 font-bold">
                                            <span className="text-[9px] uppercase tracking-wider">Vega</span>
                                            <span className="font-mono text-[11px]">{(selectedOption.data.vega || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-teal-500/10 h-0.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-teal-500 h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                                                style={{ width: `${Math.min((selectedOption.data.vega || 0) * 15, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* MODE B: MARKET CONTEXT (Default) */
                    <>
                        <div className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border-default/20 pb-1.5 mb-3 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            Market Context
                        </div>

                        {/* Stats Grid: 2-col on Mobile, 1-col on Sidebar */}
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-3 px-1">
                            {/* SPOT */}
                            <div className="group col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">Spot Price</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Current underlying index price.</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className="text-xl font-bold text-text-primary tracking-tight leading-none tabular-nums italic">₹{spotPrice.toLocaleString()}</div>
                            </div>

                            {/* PCR */}
                            <div className="group border-t border-border-default/20 pt-3 lg:border-0 lg:pt-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">PCR</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Put-Call Ratio.<br /><span className="text-emerald-500">{' > 1.0'}</span>: Bullish Support (Oversold)<br /><span className="text-red-500">{' < 0.7'}</span>: Bearish Resistance</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className={`text-lg font-mono font-bold leading-none mb-2 ${(metrics.pcr || 1) > 1.1 ? 'text-emerald-500' : (metrics.pcr || 1) < 0.7 ? 'text-red-500' : 'text-text-primary'}`}>
                                    {metrics.pcr?.toFixed(2)}
                                </div>
                                <div className="w-full bg-background-surface h-0.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-700 ease-out ${(metrics.pcr || 1) > 1.1 ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]' : (metrics.pcr || 1) < 0.7 ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min((metrics.pcr || 1) * 50, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* MAX PAIN */}
                            <div className="group border-t border-border-default/20 pt-3 lg:border-0 lg:pt-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">Max Pain</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Strike price where option writers lose the least.<br />Functions as a market magnet.</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className="text-lg font-mono font-bold text-orange-500 leading-none">
                                    {metrics.maxPain}
                                </div>
                            </div>

                            {/* IV RANK */}
                            <div className="group col-span-2 lg:col-span-1 border-t border-border-default/20 pt-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">IV Rank</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Current Implied Volatility vs 1-Year Range.<br /><span className="text-red-600">High (&gt;60)</span>: Options Expensive<br /><span className="text-emerald-600">Low (&lt;30)</span>: Options Cheap</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-2.5 h-2.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className={`text-lg font-mono font-bold leading-none mb-2 ${(metrics.ivRank || 34) > 60 ? 'text-red-600' : (metrics.ivRank || 34) < 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {metrics.ivRank || 34}<span className="text-[9px] text-text-tertiary font-normal align-top ml-0.5">%</span>
                                </div>
                                <div className="w-full bg-background-surface h-0.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-700 ease-out ${(metrics.ivRank || 34) > 60 ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]' : (metrics.ivRank || 34) < 30 ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]' : 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]'}`}
                                        style={{ width: `${Math.min(metrics.ivRank || 34, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* GREEKS GUIDE - EDUCATIONAL (Desktop Only) */}
                        <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
                            <GreeksReferenceGuide />
                        </div>
                    </>
                )}
            </div>

            {/* ================= CENTER PANEL: OPTIONS CHAIN ================= */}
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

            {/* ================= RIGHT PANEL: PRO PICKS ================= */}
            <div className="w-full lg:w-64 shrink-0 bg-background-card rounded-xl border border-border-default p-0 flex flex-col overflow-hidden max-h-[400px] lg:max-h-full lg:h-[600px]">
                <div className="p-4 border-b border-border-default bg-background-surface">
                    <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-widest">
                        Pro Desk Picks
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-3 no-scrollbar">
                    {/* Calls Collection */}
                    <div className="space-y-2">
                        <div className="text-[10px] text-emerald-600 font-bold uppercase">Top Calls (Bullish)</div>
                        {picks.ce.map((pick, i) => (
                            <div key={i} className="group p-3 bg-emerald-500/[0.12] border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                                onClick={() => setSelectedOption({ data: pick, type: 'call', strike: pick.strike })}
                            >
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

                    {/* Puts Collection */}
                    <div className="space-y-2 mt-4">
                        <div className="text-[10px] text-red-600 font-bold uppercase">Top Puts (Bearish)</div>
                        {picks.pe.map((pick, i) => (
                            <div key={i} className="group p-3 bg-red-500/[0.12] border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors cursor-pointer"
                                onClick={() => setSelectedOption({ data: pick, type: 'put', strike: pick.strike })}
                            >
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
