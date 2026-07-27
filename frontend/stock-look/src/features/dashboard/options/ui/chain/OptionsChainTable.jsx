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
export default function OptionsChainTable({ chain, spotPrice, onOptionSelect, onOptionDoubleClick, goldenZone }) {
    const scrollContainerRef = useRef(null);
    const atmRowRef = useRef(null);

    // 1. Strike Filtering (Optimization)
    // Find ATM index to slice relevant range (+/- 15 strikes)
    const spotIndex = chain.findIndex(c => c.strike >= spotPrice);
    if (spotIndex === -1) return null;

    const start = Math.max(0, spotIndex - 15);
    const end = Math.min(chain.length, spotIndex + 16);
    const viewChain = chain.slice(start, end);

    const firstStrike = chain[0]?.strike;

    // Auto-scroll to ATM row only when the chain itself loads/changes
    // We use firstStrike as the dependency because it won't mutate on live socket ticks,
    // but it WILL change if the user switches instrument or expiry.
    useEffect(() => {
        if (atmRowRef.current && scrollContainerRef.current) {
            // Scroll ATM into the center of the viewport
            atmRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [firstStrike]);



    const handleClick = (data, type, strike) => {
        if (onOptionSelect) {
            onOptionSelect(data, type, strike);
        }
    };

    const handleDoubleClick = (data, type, strike) => {
        if (onOptionDoubleClick) {
            onOptionDoubleClick(data, type, strike);
        }
    };

    // 3. Render
    return (
        <div className="flex-1 bg-background-card rounded-xl border border-border-default overflow-hidden relative flex flex-col">
            <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[700px] w-full">

                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-[1fr_auto_1fr] bg-background-surface text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border-default sticky top-0 z-10 mr-[1px]">
                        {/* CALLS SIDE HEADERS */}
                        <div className="w-full grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_1fr_1fr] lg:grid-cols-[1.5fr_1fr_1.2fr_1.2fr_1.2fr_1fr_1fr] px-2 py-3 text-right gap-2 items-center">
                            <span>LTP</span>
                            <span>Chg%</span>
                            <span>OI</span>
                            <span>OI Chg</span>
                            <span className="opacity-50 hidden lg:block">Vol</span>
                            <span className="opacity-50">IV</span>
                            <span className="opacity-50">Delta</span>
                        </div>

                        {/* CENTER STRIKE HEADER */}
                        <div className="w-16 p-3 text-center bg-background-card border-x border-border-default text-text-secondary">STRIKE</div>

                        {/* PUTS SIDE HEADERS */}
                        <div className="w-full grid grid-cols-[1fr_1fr_1.2fr_1.2fr_1fr_1.5fr] lg:grid-cols-[1fr_1fr_1.2fr_1.2fr_1.2fr_1fr_1.5fr] px-2 py-3 text-left gap-2 items-center">
                            <span className="opacity-50">Delta</span>
                            <span className="opacity-50">IV</span>
                            <span className="opacity-50 hidden lg:block">Vol</span>
                            <span>OI Chg</span>
                            <span>OI</span>
                            <span>Chg%</span>
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

                            // Golden Zone checks (now an object with calls and puts arrays)
                            const inCallZone = goldenZone?.calls && Array.isArray(goldenZone.calls) && goldenZone.calls.includes(row.strike);
                            const prevCallInZone = index > 0 && goldenZone?.calls && Array.isArray(goldenZone.calls) && goldenZone.calls.includes(viewChain[index - 1].strike);
                            const nextCallInZone = index < viewChain.length - 1 && goldenZone?.calls && Array.isArray(goldenZone.calls) && goldenZone.calls.includes(viewChain[index + 1].strike);
                            
                            const isFirstCallGolden = inCallZone && !prevCallInZone;
                            const isLastCallGolden = inCallZone && !nextCallInZone;

                            const inPutZone = goldenZone?.puts && Array.isArray(goldenZone.puts) && goldenZone.puts.includes(row.strike);
                            const prevPutInZone = index > 0 && goldenZone?.puts && Array.isArray(goldenZone.puts) && goldenZone.puts.includes(viewChain[index - 1].strike);
                            const nextPutInZone = index < viewChain.length - 1 && goldenZone?.puts && Array.isArray(goldenZone.puts) && goldenZone.puts.includes(viewChain[index + 1].strike);
                            
                            const isFirstPutGolden = inPutZone && !prevPutInZone;
                            const isLastPutGolden = inPutZone && !nextPutInZone;

                            // Border styling for Golden Zone (Calls)
                            const callGoldenClasses = inCallZone 
                                ? `border-l-2 border-l-blue-500 bg-blue-500/[0.04] border-r border-r-blue-500/20 ${
                                    isFirstCallGolden ? 'border-t-2 border-t-blue-500 rounded-tl-lg' : 'border-t border-t-transparent'
                                  } ${
                                    isLastCallGolden ? 'border-b-2 border-b-blue-500 rounded-bl-lg' : 'border-b border-b-white/5'
                                  }` 
                                : 'border-b border-border-default border-t border-t-transparent';

                            // Border styling for Golden Zone (Puts)
                            const putGoldenClasses = inPutZone 
                                ? `border-r-2 border-r-blue-500 bg-blue-500/[0.04] border-l border-l-blue-500/20 ${
                                    isFirstPutGolden ? 'border-t-2 border-t-blue-500 rounded-tr-lg' : 'border-t border-t-transparent'
                                  } ${
                                    isLastPutGolden ? 'border-b-2 border-b-blue-500 rounded-br-lg' : 'border-b border-b-white/5'
                                  }` 
                                : 'border-b border-border-default border-t border-t-transparent';

                            return (
                                <div ref={isATM ? atmRowRef : null} key={row.strike} className="group grid grid-cols-[1fr_auto_1fr] text-[11px] hover:bg-background-surface transition-colors relative mx-[1px]">

                                    {/* SPOT LINE INDICATOR */}
                                    {spotLine && (
                                        <div className="absolute bottom-0 left-0 right-0 border-b-2 border-yellow-500/50 z-10 pointer-events-none after:content-['SPOT'] after:absolute after:right-1/2 after:translate-x-1/2 after:top-[-10px] after:text-[8px] after:bg-yellow-500 after:text-black after:px-1 after:rounded-sm after:font-bold" />
                                    )}

                                    {/* CALLS DATA */}
                                    <div
                                        className={`w-full grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_1fr_1fr] lg:grid-cols-[1.5fr_1fr_1.2fr_1.2fr_1.2fr_1fr_1fr] px-2 py-1.5 text-right gap-2 items-center cursor-pointer hover:bg-emerald-500/15 transition-colors ${callGoldenClasses}`}
                                        onClick={() => handleClick(row.call, 'call', row.strike)}
                                        onDoubleClick={() => handleDoubleClick(row.call, 'call', row.strike)}
                                    >
                                        <span className={`${callLtpColor} font-mono font-bold text-[10px]`}>{Number(row.call.ltp).toFixed(2)}</span>
                                        <span className={`text-[9px] ${row.call.oiChgPct >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold`}>
                                            {row.call.oiChgPct > 0 ? '+' : ''}{(row.call.oiChgPct || 0).toFixed(1)}%
                                        </span>
                                        <span className="text-text-secondary font-mono text-[9px]">{formatIndianNumber(row.call.oi)}</span>
                                        <span className={`font-mono text-[9px] ${(row.call.oiChg || 0) > 0 ? 'text-emerald-500' : (row.call.oiChg || 0) < 0 ? 'text-red-500' : 'text-text-tertiary'}`}>{formatIndianNumber(row.call.oiChg || 0)}</span>
                                        <span className="text-text-tertiary text-[8.5px] hidden lg:block font-mono">{formatIndianNumber(row.call.vol)}</span>
                                        <span className="text-orange-600 font-mono font-bold text-[9px]">{row.iv ? `${Number(row.iv).toFixed(2)}%` : ''}</span>
                                        <span className="text-text-tertiary text-[9px]">{row.call.delta !== null ? row.call.delta?.toFixed(2) : ''}</span>
                                    </div>

                                    {/* STRIKE COLUMN */}
                                    <div className={`w-14 lg:w-16 px-1 py-1.5 flex items-center justify-center font-bold font-mono border-x border-border-default ${isATM ? 'text-text-primary bg-blue-500/30' : 'text-text-secondary bg-background-surface/50'} ${inCallZone || inPutZone ? 'border-x-blue-500/20' : ''}`}>
                                        {row.strike}
                                    </div>

                                    {/* PUTS DATA */}
                                    <div
                                        className={`w-full grid grid-cols-[1fr_1fr_1.2fr_1.2fr_1fr_1.5fr] lg:grid-cols-[1fr_1fr_1.2fr_1.2fr_1.2fr_1fr_1.5fr] px-2 py-1.5 text-left gap-2 items-center cursor-pointer hover:bg-red-500/15 transition-colors ${putGoldenClasses}`}
                                        onClick={() => handleClick(row.put, 'put', row.strike)}
                                        onDoubleClick={() => handleDoubleClick(row.put, 'put', row.strike)}
                                    >
                                        <span className="text-text-tertiary text-[9px]">{row.put.delta !== null ? row.put.delta?.toFixed(2) : ''}</span>
                                        <span className="text-orange-600 font-mono font-bold text-[9px]">{row.iv ? `${Number(row.iv).toFixed(2)}%` : ''}</span>
                                        <span className="text-text-tertiary text-[8.5px] hidden lg:block font-mono">{formatIndianNumber(row.put.vol)}</span>
                                        <span className={`font-mono text-[9px] ${(row.put.oiChg || 0) > 0 ? 'text-emerald-500' : (row.put.oiChg || 0) < 0 ? 'text-red-500' : 'text-text-tertiary'}`}>{formatIndianNumber(row.put.oiChg || 0)}</span>
                                        <span className="text-text-secondary font-mono text-[9px]">{formatIndianNumber(row.put.oi)}</span>
                                        <span className={`text-[9px] ${row.put.oiChgPct >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold`}>
                                            {row.put.oiChgPct > 0 ? '+' : ''}{(row.put.oiChgPct || 0).toFixed(1)}%
                                        </span>
                                        <span className={`${putLtpColor} font-mono font-bold text-[10px]`}>{Number(row.put.ltp).toFixed(2)}</span>
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
