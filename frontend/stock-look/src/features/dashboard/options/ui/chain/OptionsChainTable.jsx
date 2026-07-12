/**
 * @file OptionsChainTable.jsx
 * @purpose High-performance data grid for the Option Chain.
 * @responsibilities
 * - Renders a scrollable list of Call (Left) and Put (Right) contracts.
 * - Centers the list around the computed ATM (At-The-Money) strike.
 * - Visualizes data with color-coding (e.g., Green/Red for OI Change, Yellow for ATM).
 * - Manages hover interactions to display the `OptionsHoverCard`.
 * @key_exports
 * - OptionsChainTable (Default Component)
 * @dependencies
 * - OptionsHoverCard: Greek visualization on hover.
 * @lifecycle
 * - Rendered by OptionsChainLayout.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useRef, useEffect } from "react";
import { formatIndianNumber } from '@/shared/utils/formatters';

// =============================
// Main Component
// =============================
export default function OptionsChainTable({ chain, spotPrice, onOptionSelect, goldenZone }) {
    const scrollContainerRef = useRef(null);
    const atmRowRef = useRef(null);

    // 1. Strike Filtering (Optimization)
    // Find ATM index to slice relevant range (+/- 15 strikes)
    const spotIndex = chain.findIndex(c => c.strike >= spotPrice);
    if (spotIndex === -1) return null;

    const start = Math.max(0, spotIndex - 15);
    const end = Math.min(chain.length, spotIndex + 16);
    const viewChain = chain.slice(start, end);

    // Auto-scroll to ATM row when data loads
    useEffect(() => {
        if (atmRowRef.current && scrollContainerRef.current) {
            // Scroll ATM into the center of the viewport
            atmRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [viewChain.length, spotPrice]);



    // 2. Interaction Handlers
    const handleClick = (data, type, strike) => {
        if (onOptionSelect) {
            onOptionSelect(data, type, strike);
        }
    };

    // 3. Render
    return (
        <div className="flex-1 bg-background-card rounded-xl border border-border-default overflow-hidden relative flex flex-col">
            <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[800px]">

                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-[1fr_auto_1fr] bg-background-surface text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border-default sticky top-0 z-10 mr-[1px]">
                        {/* CALLS SIDE HEADERS */}
                        <div className="grid grid-cols-[70px_50px_50px_35px_35px] lg:grid-cols-[70px_50px_50px_45px_35px_35px] p-3 text-right gap-2 justify-end items-center">
                            <span>LTP</span>
                            <span>OI</span>
                            <span>Chg%</span>
                            <span className="opacity-50 hidden lg:block">Vol</span>
                            <span className="opacity-50">IV</span>
                            <span className="opacity-50">Delta</span>
                        </div>

                        {/* CENTER STRIKE HEADER */}
                        <div className="w-16 p-3 text-center bg-background-card border-x border-border-default text-text-secondary">STRIKE</div>

                        {/* PUTS SIDE HEADERS */}
                        <div className="grid grid-cols-[35px_35px_50px_50px_70px] lg:grid-cols-[35px_35px_45px_50px_50px_70px] p-3 text-left gap-2 justify-start items-center">
                            <span className="opacity-50">Delta</span>
                            <span className="opacity-50">IV</span>
                            <span className="opacity-50 hidden lg:block">Vol</span>
                            <span>Chg%</span>
                            <span>OI</span>
                            <span>LTP</span>
                        </div>
                    </div>

                    {/* TABLE BODY */}
                    <div ref={scrollContainerRef} className="overflow-y-auto max-h-[500px] relative no-scrollbar pb-4 pt-1">
                        {(() => {
                            // Pre-calculate ATM strike (closest to spot)
                            let closestStrike = -1;
                            let minDiff = Infinity;
                            viewChain.forEach(r => {
                                const diff = Math.abs(r.strike - spotPrice);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestStrike = r.strike;
                                }
                            });

                            return viewChain.map((row, index) => {
                                const isATM = row.strike === closestStrike;
                                const nextStrike = viewChain[index + 1]?.strike || (row.strike + 9999);
                                const spotLine = spotPrice >= row.strike && spotPrice < nextStrike;

                            // LTP Coloring logic
                            const callLtpColor = row.call.ltp > row.call.close ? 'text-emerald-500' : (row.call.ltp < row.call.close ? 'text-red-500' : 'text-text-primary');
                            const putLtpColor = row.put.ltp > row.put.close ? 'text-emerald-500' : (row.put.ltp < row.put.close ? 'text-red-500' : 'text-text-primary');

                            // Golden Zone checks
                            const inGoldenZone = goldenZone && row.strike >= goldenZone.minStrike && row.strike <= goldenZone.maxStrike;
                            const isFirstGolden = goldenZone && row.strike === goldenZone.minStrike;
                            const isLastGolden = goldenZone && row.strike === goldenZone.maxStrike;

                            // Border styling for Golden Zone
                            const goldenClasses = inGoldenZone 
                                ? `border-x-2 border-x-blue-500 bg-blue-500/[0.04] ${
                                    isFirstGolden ? 'border-t-2 border-t-blue-500 rounded-t-lg' : ''
                                  } ${
                                    isLastGolden ? 'border-b-2 border-b-blue-500 rounded-b-lg mb-1' : 'border-b border-b-white/5'
                                  }` 
                                : 'border-b border-border-default';

                            return (
                                <div ref={isATM ? atmRowRef : null} key={row.strike} className={`group grid grid-cols-[1fr_auto_1fr] text-xs hover:bg-background-surface transition-colors relative ${goldenClasses} mx-[1px]`}>

                                    {/* SPOT LINE INDICATOR */}
                                    {spotLine && (
                                        <div className="absolute top-0 left-0 right-0 border-t-2 border-yellow-500/50 z-10 pointer-events-none after:content-['SPOT'] after:absolute after:right-1/2 after:translate-x-1/2 after:-top-3 after:text-[9px] after:bg-yellow-500 after:text-black after:px-1 after:rounded-sm after:font-bold" />
                                    )}

                                    {/* CALLS DATA */}
                                    <div
                                        className={`grid grid-cols-[70px_50px_50px_35px_35px] lg:grid-cols-[70px_50px_50px_45px_35px_35px] p-2 text-right gap-2 items-center justify-end cursor-pointer hover:bg-emerald-500/15 transition-colors ${isFirstGolden ? 'rounded-tl-sm' : ''} ${isLastGolden ? 'rounded-bl-sm' : ''}`}
                                        onClick={() => handleClick(row.call, 'call', row.strike)}
                                    >
                                        <span className={`${callLtpColor} font-mono font-bold`}>{row.call.ltp}</span>
                                        <span className="text-text-secondary font-mono text-[10px]">{formatIndianNumber(row.call.oi)}</span>
                                        <span className={`text-[10px] ${row.call.oiChgPct >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold`}>
                                            {row.call.oiChgPct > 0 ? '+' : ''}{row.call.oiChgPct.toFixed(1)}%
                                        </span>
                                        <span className="text-text-tertiary text-[9px] hidden lg:block font-mono">{formatIndianNumber(row.call.vol)}</span>
                                        <span className="text-orange-600 font-mono font-bold text-[10px]">{row.iv ? `${Number(row.iv).toFixed(2)}%` : ''}</span>
                                        <span className="text-text-tertiary text-[10px]">{row.call.delta !== null ? row.call.delta?.toFixed(2) : ''}</span>
                                    </div>

                                    {/* STRIKE COLUMN */}
                                    <div className={`w-16 p-2 flex items-center justify-center font-bold font-mono border-x border-border-default ${isATM ? 'text-text-primary bg-blue-500/30' : 'text-text-secondary bg-background-surface/50'} ${inGoldenZone ? 'border-x-blue-500/20' : ''}`}>
                                        {row.strike}
                                    </div>

                                    {/* PUTS DATA */}
                                    <div
                                        className={`grid grid-cols-[35px_35px_50px_50px_70px] lg:grid-cols-[35px_35px_45px_50px_50px_70px] p-2 text-left gap-2 items-center justify-start cursor-pointer hover:bg-red-500/15 transition-colors ${isFirstGolden ? 'rounded-tr-sm' : ''} ${isLastGolden ? 'rounded-br-sm' : ''}`}
                                        onClick={() => handleClick(row.put, 'put', row.strike)}
                                    >
                                        <span className="text-text-tertiary text-[10px]">{row.put.delta !== null ? row.put.delta?.toFixed(2) : ''}</span>
                                        <span className="text-orange-600 font-mono font-bold text-[10px]">{row.iv ? `${Number(row.iv).toFixed(2)}%` : ''}</span>
                                        <span className="text-text-tertiary text-[9px] hidden lg:block font-mono">{formatIndianNumber(row.put.vol)}</span>
                                        <span className={`text-[10px] ${row.put.oiChgPct >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold`}>
                                            {row.put.oiChgPct > 0 ? '+' : ''}{row.put.oiChgPct.toFixed(1)}%
                                        </span>
                                        <span className="text-text-secondary font-mono text-[10px]">{formatIndianNumber(row.put.oi)}</span>
                                        <span className={`${putLtpColor} font-mono font-bold`}>{row.put.ltp}</span>
                                    </div>
                                </div>
                            );
                        })})()}
                    </div>
                </div>
            </div>
        </div>
    );
}
