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
import React from "react";

// =============================
// Main Component
// =============================
export default function OptionsChainTable({ chain, spotPrice, onOptionSelect }) {

    // 1. Strike Filtering (Optimization)
    // Find ATM index to slice relevant range (+/- 15 strikes)
    const spotIndex = chain.findIndex(c => c.strike >= spotPrice);
    if (spotIndex === -1) return null;

    const start = Math.max(0, spotIndex - 15);
    const end = Math.min(chain.length, spotIndex + 16);
    const viewChain = chain.slice(start, end);

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
                    <div className="overflow-y-auto max-h-[500px] relative no-scrollbar">
                        {viewChain.map((row) => {
                            const isATM = Math.abs(row.strike - spotPrice) < 25; // Close to spot
                            const spotLine = row.strike <= spotPrice && row.strike + 50 > spotPrice; // Visual divider

                            return (
                                <div key={row.strike} className={`group grid grid-cols-[1fr_auto_1fr] text-xs border-b border-border-default hover:bg-background-surface transition-colors relative`}>

                                    {/* SPOT LINE INDICATOR */}
                                    {spotLine && (
                                        <div className="absolute top-0 left-0 right-0 border-t-2 border-yellow-500/50 z-10 pointer-events-none after:content-['SPOT'] after:absolute after:right-1/2 after:translate-x-1/2 after:-top-3 after:text-[9px] after:bg-yellow-500 after:text-black after:px-1 after:rounded-sm after:font-bold" />
                                    )}

                                    {/* CALLS DATA */}
                                    <div
                                        className="grid grid-cols-[70px_50px_50px_35px_35px] lg:grid-cols-[70px_50px_50px_45px_35px_35px] p-2 text-right gap-2 items-center justify-end cursor-pointer hover:bg-green-500/5 transition-colors"
                                        onClick={() => handleClick(row.call, 'call', row.strike)}
                                    >
                                        <span className="text-state-bullish-text font-mono font-bold">{row.call.ltp}</span>
                                        <span className="text-text-secondary font-mono text-[10px]">{(row.call.oi / 1000).toFixed(0)}k</span>
                                        <span className={`text-[10px] ${row.call.oiChg >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold`}>
                                            {row.call.oiChg > 0 ? '+' : ''}{row.call.oiChg}%
                                        </span>
                                        <span className="text-text-tertiary text-[9px] hidden lg:block">{row.call.vol}</span>
                                        <span className="text-orange-600 font-mono font-bold text-[10px]">{Number(row.iv).toFixed(2)}%</span>
                                        <span className="text-text-tertiary text-[10px]">{row.call.delta.toFixed(2)}</span>
                                    </div>

                                    {/* STRIKE COLUMN */}
                                    <div className={`w-16 p-2 flex items-center justify-center font-bold font-mono border-x border-border-default ${isATM ? 'text-text-primary bg-blue-500/20' : 'text-text-secondary bg-background-surface/50'}`}>
                                        {row.strike}
                                    </div>

                                    {/* PUTS DATA */}
                                    <div
                                        className="grid grid-cols-[35px_35px_50px_50px_70px] lg:grid-cols-[35px_35px_45px_50px_50px_70px] p-2 text-left gap-2 items-center justify-start cursor-pointer hover:bg-red-500/5 transition-colors"
                                        onClick={() => handleClick(row.put, 'put', row.strike)}
                                    >
                                        <span className="text-text-tertiary text-[10px]">{row.put.delta.toFixed(2)}</span>
                                        <span className="text-orange-600 font-mono font-bold text-[10px]">{Number(row.iv).toFixed(2)}%</span>
                                        <span className="text-text-tertiary text-[9px] hidden lg:block">{row.put.vol}</span>
                                        <span className={`text-[10px] ${row.put.oiChg >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold`}>
                                            {row.put.oiChg > 0 ? '+' : ''}{row.put.oiChg}%
                                        </span>
                                        <span className="text-text-secondary font-mono text-[10px]">{(row.put.oi / 1000).toFixed(0)}k</span>
                                        <span className="text-state-bearish-text font-mono font-bold">{row.put.ltp}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
