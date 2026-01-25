import React, { useState, useMemo } from "react";
import { Filter, AlertTriangle, CheckCircle, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function TradeLogTable({ trades, onSelectTrade }) {
    const [showViolations, setShowViolations] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // 1. Filter
    const filteredTrades = useMemo(() => {
        let data = showViolations
            ? trades.filter(t => t.outcome === 'Loss' || t.execution.errors.length > 0)
            : [...trades];

        // 2. Sort
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
        <div className="relative w-full h-full bg-[#0b1220] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.45)] min-h-[500px]">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />
            <div className="relative z-10 flex flex-col h-full">

                {/* TOOLBAR */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Log</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-500">{filteredTrades.length}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Violations Toggle */}
                        <button
                            onClick={() => setShowViolations(!showViolations)}
                            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${showViolations
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10"
                                }`}
                        >
                            <AlertTriangle size={12} />
                            {showViolations ? "Filtering Violations" : "Filter Violations"}
                        </button>
                    </div>
                </div>

                {/* TABLE HEADER (Sticky) */}
                <div className="flex-1 overflow-auto relative rounded-b-xl custom-scrollbar scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0b1220] sticky top-0 z-10 shadow-sm">
                            <tr>
                                <HeaderCell label="Time" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
                                <HeaderCell label="Instrument" sortKey="instrument" currentSort={sortConfig} onSort={handleSort} />
                                <HeaderCell label="Setup" sortKey="strategy" currentSort={sortConfig} onSort={handleSort} />
                                <HeaderCell label="Side" sortKey="direction" currentSort={sortConfig} onSort={handleSort} />
                                <HeaderCell label="Risk" sortKey="riskPct" currentSort={sortConfig} onSort={handleSort} />
                                <HeaderCell label="R-Mult" sortKey="rMultiple" currentSort={sortConfig} onSort={handleSort} />
                                <HeaderCell label="Outcome" sortKey="outcome" currentSort={sortConfig} onSort={handleSort} />
                                <th className="px-5 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">Compliance</th>
                                <th className="p-3 w-10 border-b border-white/5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTrades.map((trade) => (
                                <TableRow key={trade.id} trade={trade} onClick={() => onSelectTrade(trade)} />
                            ))}
                        </tbody>
                    </table>

                    {filteredTrades.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                            <Filter size={24} className="mb-2 opacity-50" />
                            <span className="text-xs font-medium">No records found matching filter</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function HeaderCell({ label, sortKey, currentSort, onSort }) {
    const isActive = currentSort.key === sortKey;

    return (
        <th
            onClick={() => onSort(sortKey)}
            className="px-5 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 whitespace-nowrap cursor-pointer hover:text-slate-300 transition-colors select-none group"
        >
            <div className="flex items-center gap-1.5">
                {label}
                <span className={`text-slate-600 ${isActive ? 'text-blue-400' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                    {isActive && currentSort.direction === 'asc' && <ArrowUp size={10} />}
                    {isActive && currentSort.direction === 'desc' && <ArrowDown size={10} />}
                    {!isActive && <ArrowUpDown size={10} />}
                </span>
            </div>
        </th>
    );
}

function TableRow({ trade, onClick }) {
    const isWin = trade.outcome === 'Win';
    const hasError = trade.execution.errors.length > 0;

    return (
        <tr
            onClick={onClick}
            className="group hover:bg-white/[0.01] cursor-pointer transition-colors"
        >
            {/* Time */}
            <td className="px-5 py-3 text-[10px] font-mono text-slate-400">
                {new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </td>

            {/* Instrument */}
            <td className="px-5 py-3 font-medium text-slate-200 text-xs">
                {trade.instrument}
            </td>

            {/* Setup */}
            <td className="px-5 py-3">
                <span className="px-2 py-0.5 bg-black/40 rounded text-[9px] text-slate-400 font-medium">
                    {trade.strategy}
                </span>
            </td>

            {/* Side */}
            <td className="px-5 py-3">
                <span className={`text-[10px] font-bold uppercase ${trade.direction === 'Long' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.direction}
                </span>
            </td>

            {/* Risk */}
            <td className="px-5 py-3 text-[10px] font-mono text-slate-400">
                {trade.riskPct}%
            </td>

            {/* R-Mult */}
            <td className="px-5 py-3">
                <span className={`text-[10px] font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
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
            <td className="px-5 py-3">
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
                <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
            </td>
        </tr>
    );
}
