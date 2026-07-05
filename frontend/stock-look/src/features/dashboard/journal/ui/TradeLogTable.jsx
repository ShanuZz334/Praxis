/**
 * @file TradeLogTable.jsx
 * @purpose Displays a tabular log of trading executions with filtering and sorting.
 * @responsibilities
 * - Renders a detailed table of trades for desktop view.
 * - Renders a card-based interactive list for mobile view.
 * - Handles filtering (e.g., violations) and sorting (by date, risk, outcome).
 * - Provides immediate visual feedback on trade outcome and compliance.
 * @key_exports
 * - TradeLogTable (Default Component)
 * @dependencies
 * - lucide-react (Icons)
 * @lifecycle
 * - Rendered by JournalPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useState, useMemo, useEffect, memo } from "react";
import { Filter, AlertTriangle, CheckCircle, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// =============================
// Helper Components
// =============================

// 1. Header Cell with Sort Controls
const HeaderCell = memo(function HeaderCell({ label, sortKey, currentSort, onSort, className = "" }) {
    const isActive = currentSort.key === sortKey;

    return (
        <th
            onClick={() => onSort(sortKey)}
            className={`px-5 py-3 text-[9px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-default whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors select-none group ${className}`}
        >
            <div className="flex items-center gap-1.5">
                {label}
                <span className={`text-text-secondary ${isActive ? 'text-blue-500' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                    {isActive && currentSort.direction === 'asc' && <ArrowUp size={10} />}
                    {isActive && currentSort.direction === 'desc' && <ArrowDown size={10} />}
                    {!isActive && <ArrowUpDown size={10} />}
                </span>
            </div>
        </th>
    );
});

// 2. Desktop Table Row
const TableRow = memo(function TableRow({ trade, onClick }) {
    const isWin = trade.outcome === 'Win';
    const hasError = trade.execution.errors.length > 0;

    return (
        <tr
            onClick={onClick}
            className="group hover:bg-background-surface cursor-pointer transition-colors"
        >
            {/* Time */}
            <td className="hidden md:table-cell px-5 py-3 text-[10px] font-mono text-text-secondary">
                {new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </td>

            {/* Instrument */}
            <td className="px-5 py-3 font-medium text-text-primary text-xs text-left">
                {trade.instrument}
            </td>

            {/* Setup */}
            <td className="hidden md:table-cell px-5 py-3">
                <span className="px-2 py-0.5 bg-background-floor border border-border-default rounded text-[9px] text-text-secondary font-medium">
                    {trade.strategy}
                </span>
            </td>

            {/* Side */}
            <td className="px-5 py-3">
                <span className={`text-[10px] font-bold uppercase ${trade.direction === 'Long' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trade.direction}
                </span>
            </td>

            {/* Risk */}
            <td className="hidden md:table-cell px-5 py-3 text-[10px] font-mono text-text-secondary">
                {trade.riskPct}%
            </td>

            {/* R-Multiple */}
            <td className="hidden md:table-cell px-5 py-3">
                <span className={`text-[10px] font-mono font-bold ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trade.rMultiple}R
                </span>
            </td>

            {/* Outcome */}
            <td className="px-5 py-3">
                {isWin ? (
                    <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                        <CheckCircle size={10} /> Target Hit
                    </span>
                ) : (
                    <span className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1">
                        <AlertTriangle size={10} /> SL Hit
                    </span>
                )}
            </td>

            {/* Compliance */}
            <td className="hidden md:table-cell px-5 py-3">
                {hasError ? (
                    <div className="flex gap-1">
                        {trade.execution.errors.slice(0, 1).map((err, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase">
                                {err}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase">
                        Compliant
                    </span>
                )}
            </td>

            {/* Action */}
            <td className="px-3 py-3 text-right">
                <ChevronRight size={14} className="text-text-tertiary group-hover:text-blue-400 transition-colors" />
            </td>
        </tr>
    );
});

// 3. Mobile Card View
const TradeMobileCard = memo(function TradeMobileCard({ trade, onClick }) {
    const isWin = trade.outcome === 'Win';
    const hasError = trade.execution.errors.length > 0;

    return (
        <div
            onClick={onClick}
            className="bg-background-surface border border-border-default rounded-xl p-2.5 active:scale-98 transition-transform shadow-sm"
        >
            {/* Header: Instrument & Outcome */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-[12px] font-bold text-text-primary">{trade.instrument}</div>
                    <div className="text-[9px] text-text-tertiary font-mono mt-0.5">
                        {new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isWin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trade.rMultiple}R
                </div>
            </div>

            {/* Metrics Row */}
            <div className="flex items-center gap-3 text-[10px] text-text-secondary mb-2">
                <div className="flex flex-col">
                    <span className="text-text-tertiary uppercase text-[8px] font-bold">Side</span>
                    <span className={`font-bold text-[10px] ${trade.direction === 'Long' ? 'text-emerald-500' : 'text-red-500'}`}>{trade.direction}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-text-tertiary uppercase text-[8px] font-bold">Risk</span>
                    <span className="font-mono text-[10px]">{trade.riskPct}%</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-text-tertiary uppercase text-[8px] font-bold">Strategy</span>
                    <span className="text-[10px]">{trade.strategy}</span>
                </div>
            </div>

            {/* Footer: Compliance */}
            <div className="flex justify-between items-center border-t border-border-subtle pt-1.5">
                {hasError ? (
                    <span className="text-[8px] font-bold text-red-400 uppercase flex items-center gap-1">
                        <AlertTriangle size={9} /> {trade.execution.errors[0]}
                    </span>
                ) : (
                    <span className="text-[8px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                        <CheckCircle size={9} /> Compliant
                    </span>
                )}
            </div>
        </div>
    );
});

// =============================
// Main Component
// =============================

export default function TradeLogTable({ trades, onSelectTrade }) {
    const [showViolations, setShowViolations] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [isMobile, setIsMobile] = useState(false);

    // Track window width to conditionally render parts of the DOM
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- Filter and Sort Logic ---
    const filteredTrades = useMemo(() => {
        let data = showViolations
            ? trades.filter(t => t.outcome === 'Loss' || t.execution.errors.length > 0)
            : [...trades];

        data.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return data;
    }, [trades, showViolations, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="relative w-full h-full bg-background-card border border-border-default rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />
            <div className="relative z-10 flex flex-col h-full">

                {/* TOOLBAR */}
                <div className="px-3.5 py-3 border-b border-border-default flex items-center justify-between bg-background-surface">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Execution Log</span>
                        <span className="px-1.5 py-0.5 rounded bg-background-floor text-[9px] font-mono text-text-secondary">{filteredTrades.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Violations Toggle */}
                        <button
                            onClick={() => setShowViolations(!showViolations)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${showViolations
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-background-card text-text-secondary border border-border-default hover:bg-background-surface shadow-sm"
                                }`}
                        >
                            <AlertTriangle size={10} />
                            {showViolations ? "Violations" : "Filter"}
                        </button>
                    </div>
                </div>

                {/* DESKTOP TABLE VIEW */}
                {!isMobile && (
                    <div className="flex-1 overflow-auto relative rounded-b-xl custom-scrollbar scrollbar-hide">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-background-card sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <HeaderCell label="Time" sortKey="date" currentSort={sortConfig} onSort={handleSort} className="hidden md:table-cell" />
                                    <HeaderCell label="Instrument" sortKey="instrument" currentSort={sortConfig} onSort={handleSort} />
                                    <HeaderCell label="Setup" sortKey="strategy" currentSort={sortConfig} onSort={handleSort} className="hidden md:table-cell" />
                                    <HeaderCell label="Side" sortKey="direction" currentSort={sortConfig} onSort={handleSort} />
                                    <HeaderCell label="Risk" sortKey="riskPct" currentSort={sortConfig} onSort={handleSort} className="hidden md:table-cell" />
                                    <HeaderCell label="R-Mult" sortKey="rMultiple" currentSort={sortConfig} onSort={handleSort} className="hidden md:table-cell" />
                                    <HeaderCell label="Outcome" sortKey="outcome" currentSort={sortConfig} onSort={handleSort} />
                                    <th className="px-5 py-3 text-[9px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-default whitespace-nowrap hidden md:table-cell">Compliance</th>
                                    <th className="p-3 w-10 border-b border-border-default"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {filteredTrades.map((trade) => (
                                    <TableRow key={trade.id} trade={trade} onClick={() => onSelectTrade(trade)} />
                                ))}
                            </tbody>
                        </table>

                        {filteredTrades.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                                <Filter size={24} className="mb-2 opacity-50" />
                                <span className="text-xs font-medium">No records found matching filter</span>
                            </div>
                        )}
                    </div>
                )}

                {/* MOBILE CARD VIEW */}
                {isMobile && (
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {filteredTrades.map((trade) => (
                            <TradeMobileCard key={trade.id} trade={trade} onClick={() => onSelectTrade(trade)} />
                        ))}
                        {filteredTrades.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
                                <span className="text-xs font-medium">No records found</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
