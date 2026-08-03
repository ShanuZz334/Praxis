/**
 * @file PositionsTable.jsx
 * @purpose Live open positions table with streaming LTP via livePrices context.
 * @responsibilities
 * - Renders net positions with live P&L coloring.
 * - Shows Exit button that opens the GlobalOrderTicket.
 * - WebSocket updates flow in through parent's usePortfolioData hook.
 */

import React, { useMemo } from "react";
import { RefreshCw, LayoutList } from "lucide-react";
import { useDashboardContext } from "@/shared/context/DashboardContext";

const PNL_POS = "text-emerald-500";
const PNL_NEG = "text-red-500";

function pnlColor(val) { return val >= 0 ? PNL_POS : PNL_NEG; }
function sign(val)     { return val >= 0 ? "+" : ""; }
function fmt2(n)       { return Number(n || 0).toFixed(2); }
function fmtINR(n)     { return Math.abs(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }); }

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-background-surface border border-border-default flex items-center justify-center opacity-50 shadow-inner">
                <LayoutList className="w-5 h-5 text-text-tertiary" />
            </div>
            <p className="text-xs text-text-tertiary tracking-wide">No open positions</p>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="p-6 space-y-3">
            {[1,2,3].map(i => (
                <div key={i} className="h-10 bg-background-surface rounded-lg animate-pulse" />
            ))}
        </div>
    );
}

export default function PositionsTable({ positions, loading, onClose }) {
    const { livePrices } = useDashboardContext();

    // Compute totals
    const totals = useMemo(() => {
        let unrealized = 0, realized = 0;
        for (const p of positions) {
            unrealized += p.unrealised ?? p.unrealized_pnl ?? 0;
            realized   += p.realised   ?? p.realized_pnl  ?? 0;
        }
        return { unrealized, realized, net: unrealized + realized };
    }, [positions]);

    return (
        <div className="bg-background-card border border-border-default rounded-2xl overflow-hidden shadow-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-background-surface/30">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Live Positions</span>
                    <span className="text-[10px] text-text-tertiary font-mono px-1.5 py-0.5 bg-background-surface rounded border border-border-subtle">
                        {positions.length} open
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Net P&L badge */}
                    {totals.net !== 0 && (
                        <span className={`text-xs font-bold font-mono ${pnlColor(totals.net)}`}>
                            {sign(totals.net)}₹{fmtINR(totals.net)} net
                        </span>
                    )}
                    <span className="text-[10px] text-text-tertiary font-mono">WebSocket Live</span>
                </div>
            </div>

            {/* Body */}
            {loading ? <TableSkeleton /> : positions.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[700px]">
                        <thead>
                            <tr className="border-b border-border-default bg-background-surface/40">
                                {["Instrument", "Product", "Net Qty", "Avg Price", "LTP", "Unrealized P&L", "Realized P&L", ""].map(h => (
                                    <th key={h} className={`py-2.5 px-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider ${h === "Instrument" ? "text-left" : h === "" ? "text-right" : "text-right"}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map((pos, i) => {
                                const sym     = pos.tradingsymbol || pos.trading_symbol || "—";
                                const iKey    = pos.instrument_token || pos.instrument_key;
                                const netQty  = pos.quantity ?? pos.net_quantity ?? 0;
                                const avg     = pos.average_price ?? 0;
                                const ltp     = livePrices?.[iKey]?.ltp ?? pos.last_price ?? pos.close_price ?? 0;
                                const unrel   = pos.unrealised ?? pos.unrealized_pnl ?? 0;
                                const rel     = pos.realised   ?? pos.realized_pnl  ?? 0;
                                const product = pos.product || "—";

                                return (
                                    <tr key={iKey || i} className="border-b border-border-subtle hover:bg-background-surface/60 transition-colors group">
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-text-primary">{sym}</div>
                                            <div className="text-[10px] text-text-tertiary mt-0.5">{pos.exchange || "NSE"}</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-background-surface border border-border-subtle rounded text-text-tertiary uppercase">
                                                {product}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3.5 text-right font-mono font-bold ${netQty >= 0 ? "text-text-primary" : "text-red-500"}`}>
                                            {netQty}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-text-secondary">
                                            ₹{fmt2(avg)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-text-primary">
                                            ₹{fmt2(ltp)}
                                        </td>
                                        <td className={`px-4 py-3.5 text-right font-mono font-bold ${pnlColor(unrel)}`}>
                                            {sign(unrel)}₹{fmtINR(unrel)}
                                        </td>
                                        <td className={`px-4 py-3.5 text-right font-mono ${pnlColor(rel)}`}>
                                            {sign(rel)}₹{fmtINR(rel)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={() => onClose?.(pos)}
                                                className="px-2.5 py-1 text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                Exit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {positions.length > 1 && (
                            <tfoot>
                                <tr className="border-t-2 border-border-default bg-background-surface/60">
                                    <td colSpan={5} className="px-4 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total</td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${pnlColor(totals.unrealized)}`}>
                                        {sign(totals.unrealized)}₹{fmtINR(totals.unrealized)}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${pnlColor(totals.realized)}`}>
                                        {sign(totals.realized)}₹{fmtINR(totals.realized)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}
        </div>
    );
}
