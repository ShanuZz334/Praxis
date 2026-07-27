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
import { formatIndianNumber } from '@/shared/utils/formatters';
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { FO_INDICES, FO_EQUITIES } from "@/shared/utils/foInstruments";

// =============================
// Main Component
// =============================
export default function OptionsChainLayout({ chain, picks, spotPrice, baseSpotPrice, metrics, goldenZone, onAddChart }) {
    const [selectedOptionState, setSelectedOption] = React.useState(null);
    const { selectedInstrument, selectedExpiry } = useDashboardContext();

    // Format expiry helper
    const getFormattedExpiry = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase().replace(/,/g, '');
    };

    // Dynamically lookup the live data from the chain so the panel updates in real-time
    const liveSelectedRow = selectedOptionState ? chain.find(r => r.strike === selectedOptionState.strike) : null;
    const liveSelectedData = liveSelectedRow ? (selectedOptionState.type === 'call' ? liveSelectedRow.call : liveSelectedRow.put) : null;
    
    // Construct the live selectedOption object
    const selectedOption = selectedOptionState && liveSelectedData ? {
        ...selectedOptionState,
        data: liveSelectedData
    } : selectedOptionState;

    const getReadableName = (val) => {
        if (!val) return '';
        const all = [...(FO_INDICES || []), ...(FO_EQUITIES || [])];
        const found = all.find(i => i.value === val);
        return found ? found.label : val.split('|').pop();
    };

    return (
        <div className="w-full flex flex-col lg:flex-row gap-3 mt-4 mb-6">

            {/* ================= LEFT PANEL: CONTEXT / DETAILS ================= */}
            <div className="w-full lg:w-56 shrink-0 bg-background-card rounded-xl border border-border-default p-3 flex flex-col gap-3 min-h-[300px] lg:h-[600px]">

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
                            {/* Primary Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 px-1 mb-4">
                                <div className="group bg-background-surface/20 hover:bg-background-surface/40 border border-border-default/20 hover:border-border-default/40 rounded-xl p-3 flex flex-col justify-center transition-all shadow-sm">
                                    <div className="text-[9px] text-text-tertiary uppercase font-bold tracking-widest mb-1 flex items-center gap-1">LTP</div>
                                    <div className="text-[17px] font-black text-text-primary leading-none tabular-nums italic">₹{Number(selectedOption.data.ltp || 0).toFixed(2)}</div>
                                </div>
                                <div className="group bg-background-surface/20 hover:bg-background-surface/40 border border-border-default/20 hover:border-border-default/40 rounded-xl p-3 flex flex-col justify-center transition-all shadow-sm">
                                    <div className="text-[9px] text-text-tertiary uppercase font-bold tracking-widest mb-1">Change</div>
                                    <div className={`text-base font-black leading-none ${selectedOption.data.oiChgPct >= 0 ? 'text-emerald-500 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]' : 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]'}`}>
                                        {selectedOption.data.oiChgPct > 0 ? '+' : ''}{Number(selectedOption.data.oiChgPct || 0).toFixed(2)}%
                                    </div>
                                </div>
                                <div className="group bg-background-surface/20 hover:bg-background-surface/40 border border-border-default/20 hover:border-border-default/40 rounded-xl p-3 flex flex-col justify-center transition-all shadow-sm">
                                    <div className="text-[9px] text-text-tertiary uppercase font-bold tracking-widest mb-1 flex items-center justify-between">
                                        <span>OI</span>
                                        <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-text-primary leading-none">{formatIndianNumber(selectedOption.data.oi)}</div>
                                </div>
                                <div className="group bg-background-surface/20 hover:bg-background-surface/40 border border-border-default/20 hover:border-border-default/40 rounded-xl p-3 flex flex-col justify-center transition-all shadow-sm">
                                    <div className="text-[9px] text-text-tertiary uppercase font-bold tracking-widest mb-1 flex items-center justify-between">
                                        <span>Volume</span>
                                        <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-text-primary leading-none text-ellipsis overflow-hidden">{formatIndianNumber(selectedOption.data.vol)}</div>
                                </div>
                            </div>

                            {/* IV (Integrated) */}
                            <div className="flex justify-between items-center px-2 py-3 mx-1 bg-background-surface/30 rounded-xl border border-border-default/20 mb-4 shadow-sm hover:border-border-default/40 transition-colors">
                                <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">Implied Vol (IV)</span>
                                <span className="text-orange-500 font-mono font-black text-sm leading-none drop-shadow-[0_0_2px_rgba(249,115,22,0.3)]">{Number(selectedOption.data.iv || 0).toFixed(2)}%</span>
                            </div>

                            {/* Greeks Section */}
                            <div className="pt-1 pb-4">
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
                                                style={{ width: `${Math.min(Math.abs(selectedOption.data.theta || 0) * 10, 100)}%` }}
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
                                                style={{ width: `${Math.min(Math.abs(selectedOption.data.vega || 0) * 10, 100)}%` }}
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

                        {/* Stats Grid: Polished Cards */}
                        <div className="flex flex-col gap-3 px-1">
                            {/* SPOT PRICE CARD */}
                            <div className="group border border-border-default/30 bg-background-surface/10 rounded-2xl p-4 shadow-sm hover:border-border-default/60 transition-all overflow-hidden">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[11px] text-text-primary font-black tracking-widest uppercase">Spot Price</span>
                                    <PortalTooltip content={<div className="text-xs text-text-secondary">Current underlying index price.</div>}>
                                        <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                            <svg className="w-3 h-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </PortalTooltip>
                                </div>
                                <div className="text-[19px] font-black text-text-primary tracking-tight leading-none tabular-nums italic truncate">₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>

                            {/* PCR CARD */}
                            <div className="group border border-border-default/30 bg-background-surface/10 rounded-2xl p-4 shadow-sm hover:border-border-default/60 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-text-primary font-black tracking-widest uppercase">PCR</span>
                                        <PortalTooltip content={<div className="text-xs text-text-secondary">Put-Call Ratio.<br /><span className="text-emerald-500">{' > 1.0'}</span>: Bullish Support<br /><span className="text-red-500">{' < 0.7'}</span>: Bearish Resistance</div>}>
                                            <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                                <svg className="w-3 h-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </PortalTooltip>
                                    </div>
                                    <div className={`text-xl font-mono font-black leading-none ${(metrics.pcr || 1) > 1.1 ? 'text-emerald-400' : (metrics.pcr || 1) < 0.7 ? 'text-red-500' : 'text-emerald-400'}`}>
                                        {metrics.pcr?.toFixed(2)}
                                    </div>
                                </div>
                                <div className="w-full bg-background-surface h-1 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-700 ease-out ${(metrics.pcr || 1) > 1.1 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : (metrics.pcr || 1) < 0.7 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}
                                        style={{ width: `${Math.min((metrics.pcr || 1) * 50, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* MAX PAIN & IV RANK ROW */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* MAX PAIN */}
                                <div className="group border border-border-default/30 bg-background-surface/10 rounded-2xl p-4 shadow-sm hover:border-border-default/60 transition-all flex flex-col justify-between min-h-[90px] overflow-hidden">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="text-[11px] text-text-primary font-black tracking-widest uppercase">Max Pain</span>
                                        <PortalTooltip content={<div className="text-xs text-text-secondary">Strike price where option writers lose the least.</div>}>
                                            <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                                <svg className="w-3 h-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </PortalTooltip>
                                    </div>
                                    <div className="text-base font-mono font-black text-orange-500 leading-none tracking-tight truncate">
                                        {metrics.maxPain ? Math.round(metrics.maxPain).toLocaleString() : 'N/A'}
                                    </div>
                                </div>

                                {/* IV RANK */}
                                <div className="relative group border border-border-default/30 bg-background-surface/10 rounded-2xl p-4 shadow-sm hover:border-border-default/60 transition-all flex flex-col justify-between min-h-[90px]">
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500" title="Manual Input" />
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span className="text-[11px] text-text-primary font-black tracking-widest uppercase">IV Rank</span>
                                        <PortalTooltip content={<div className="text-xs text-text-secondary">Current Implied Volatility vs 1-Year Range. (Manual Override)</div>}>
                                            <div className="p-0.5 rounded-full hover:bg-background-surface cursor-help transition-colors">
                                                <svg className="w-3 h-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </PortalTooltip>
                                    </div>
                                    <div>
                                        <div className={`flex items-baseline gap-0.5 mb-2`}>
                                            <span 
                                                className={`bg-transparent border-none outline-none text-xl font-mono font-black leading-none tracking-tight ${metrics.ivRank > 60 ? 'text-red-500' : metrics.ivRank < 30 ? 'text-emerald-500' : 'text-amber-500'}`}
                                            >
                                                {metrics.ivRank}
                                            </span>
                                            <span className="text-xs text-text-tertiary font-bold align-top">%</span>
                                        </div>
                                        <div className="w-full bg-background-surface h-1 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-700 ease-out ${metrics.ivRank > 60 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : metrics.ivRank < 30 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}
                                                style={{ width: `${Math.min(metrics.ivRank, 100)}%` }}
                                            />
                                        </div>
                                    </div>
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
                    baseSpotPrice={baseSpotPrice}
                    goldenZone={goldenZone}
                    onOptionSelect={(data, type, strike) => setSelectedOption({ data, type, strike })}
                    onOptionDoubleClick={(data, type, strike) => {
                        if (data?.instrument_key && onAddChart) {
                            const instName = getReadableName(selectedInstrument) || selectedInstrument.split('|').pop();
                            const expiry = getFormattedExpiry(selectedExpiry);
                            const label = `${instName} ${strike} ${type === 'call' ? 'CE' : 'PE'} ${expiry}`;
                            onAddChart(data.instrument_key, label.trim());
                        }
                    }}
                />
            </div>

            {/* ================= RIGHT PANEL: PRO PICKS ================= */}
            <div className="w-full lg:w-56 shrink-0 bg-background-card rounded-xl border border-border-default p-0 flex flex-col overflow-hidden max-h-[400px] lg:max-h-full lg:h-[600px]">
                <div className="p-4 border-b border-border-default bg-background-surface">
                    <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-widest">
                        Pro Desk Picks
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-3 no-scrollbar">
                    {/* Reusable Card Component for Picks */}
                    {(() => {
                        const renderPick = (title, pick, colorClass, borderClass, bgClass, labelColorClass) => {
                            if (!pick) return null;
                            return (
                                <div className="space-y-1 mt-2">
                                    <div className={`text-[10px] ${labelColorClass} font-bold uppercase`}>{title}</div>
                                    <div className={`group p-3 ${bgClass} border ${borderClass} hover:opacity-80 rounded-lg transition-colors cursor-pointer`}
                                        onClick={() => setSelectedOption({ data: pick, type: pick.type, strike: pick.strike })}
                                        onDoubleClick={() => {
                                            if (pick?.instrument_key && onAddChart) {
                                                const instName = getReadableName(selectedInstrument) || selectedInstrument.split('|').pop();
                                                const expiry = getFormattedExpiry(selectedExpiry);
                                                const label = `${instName} ${pick.strike} ${pick.type === 'call' ? 'CE' : 'PE'} ${expiry}`;
                                                onAddChart(pick.instrument_key, label);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-text-primary text-sm">{pick.strike} {pick.type === 'call' ? 'CE' : 'PE'}</span>
                                            </div>
                                            <span className={`text-xs font-mono ${colorClass} font-bold`}>₹{Number(pick.ltp).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-text-secondary font-medium">
                                            <span>Δ {(pick.delta || 0).toFixed(2)}</span>
                                            <span className={pick.oiChgPct > 0 ? 'text-emerald-500 font-bold' : pick.oiChgPct < 0 ? 'text-red-500 font-bold' : 'text-text-secondary'}>
                                                CHG {pick.oiChgPct > 0 ? '+' : ''}{(pick.oiChgPct || 0).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <>
                                {renderPick("Best Bullish Call", picks?.bullish, "text-emerald-500", "border-emerald-500/20", "bg-emerald-500/[0.12]", "text-emerald-600")}
                                {renderPick("Best Bearish Put", picks?.bearish, "text-red-500", "border-red-500/20", "bg-red-500/[0.12]", "text-red-600")}
                                {renderPick("Best ATM Trade", picks?.atm, "text-blue-500", "border-blue-500/20", "bg-blue-500/[0.12]", "text-blue-500")}
                                {renderPick("Top Momentum", picks?.momentum, "text-purple-500", "border-purple-500/20", "bg-purple-500/[0.12]", "text-purple-500")}
                                {renderPick("Highest Liquidity", picks?.liquidity, "text-amber-500", "border-amber-500/20", "bg-amber-500/[0.12]", "text-amber-500")}
                            </>
                        );
                    })()}
                </div>
            </div>

        </div>
    );
}
