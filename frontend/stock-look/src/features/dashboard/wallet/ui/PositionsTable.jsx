/**
 * @file PositionsTable.jsx
 * @purpose Live open positions table with streaming LTP via livePrices context.
 * @responsibilities
 * - Renders net positions with live P&L coloring.
 * - Shows Exit button that opens the GlobalOrderTicket.
 * - WebSocket updates flow in through parent's usePortfolioData hook.
 */

import React, { useMemo } from "react";
import { LayoutList, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useDashboardContext } from "@/shared/context/DashboardContext";

const PNL_POS = "text-emerald-400";
const PNL_NEG = "text-rose-400";

function pnlColor(val) { return val > 0 ? PNL_POS : val < 0 ? PNL_NEG : "text-text-tertiary"; }
function sign(val)     { return val > 0 ? "+" : ""; }
function fmt2(n)       { return Number(n || 0).toFixed(2); }
function fmtINR(n)     { return Math.abs(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }); }

function EmptyState({ onOpenTicket }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-background-surface/80 border border-border-subtle/60 flex items-center justify-center mb-3 shadow-inner">
                <LayoutList className="w-5 h-5 text-text-tertiary" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">No Open Positions</h4>
            <p className="text-xs text-text-tertiary max-w-sm mb-4 leading-relaxed">
                Active intraday and F&O positions will stream live here automatically via Upstox WebSocket feed.
            </p>
            {onOpenTicket && (
                <button
                    onClick={onOpenTicket}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-background-surface hover:bg-background-elevated border border-border-subtle hover:border-border-default text-xs font-semibold text-text-secondary hover:text-text-primary transition-all shadow-sm active:scale-95"
                >
                    <Zap size={13} className="text-sky-400" />
                    Open Order Ticket
                    <span className="text-[10px] text-text-tertiary font-mono ml-1 px-1.5 py-0.2 bg-background-base/60 rounded border border-border-subtle/40">T</span>
                </button>
            )}
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-background-surface/50 rounded-xl animate-pulse" />
            ))}
        </div>
    );
}

export default function PositionsTable({ positions, loading, onClose }) {
    const { livePrices, setGlobalOrderTicket, selectedInstrument } = useDashboardContext();

    // Compute totals
    const totals = useMemo(() => {
        let unrealized = 0, realized = 0;
        for (const p of positions) {
            unrealized += p.unrealised ?? p.unrealized_pnl ?? 0;
            realized   += p.realised   ?? p.realized_pnl  ?? 0;
        }
        return { unrealized, realized, net: unrealized + realized };
    }, [positions]);

    const handleOpenQuickTicket = () => {
        if (!setGlobalOrderTicket) return;
        setGlobalOrderTicket({
            type: "QUICK",
            data: {
                instrument_token: selectedInstrument || "NSE_INDEX|Nifty 50",
                value: selectedInstrument || "NSE_INDEX|Nifty 50",
                tradingsymbol: "NIFTY 50",
                name: "NIFTY 50",
                exchange: "NSE"
            }
        });
    };

    return (
        <div className="bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl overflow-hidden shadow-sm hover:border-border-default/60 transition-all">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default/30 bg-background-surface/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Live Open Positions</span>
                    <span className="text-[10px] text-text-tertiary font-mono px-2 py-0.5 bg-background-surface/80 rounded-full border border-border-subtle/50">
                        {positions.length} open
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Net P&L badge */}
                    {totals.net !== 0 && (
                        <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-md border ${
                            totals.net > 0 
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                        }`}>
                            {sign(totals.net)}₹{fmtINR(totals.net)} net
                        </span>
                    )}
                    <span className="text-[10px] text-text-tertiary font-mono hidden sm:inline px-2 py-0.5 bg-background-surface/50 rounded-md border border-border-subtle/40">
                        WebSocket Live
                    </span>
                </div>
            </div>

            {/* Body */}
            {loading ? (
                <TableSkeleton />
            ) : positions.length === 0 ? (
                <EmptyState onOpenTicket={handleOpenQuickTicket} />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[700px]">
                        <thead>
                            <tr className="border-b border-border-default/30 bg-background-surface/30">
                                {["Instrument", "Product", "Net Qty", "Avg Price", "LTP", "Unrealized P&L", "Realized P&L", ""].map(h => (
                                    <th key={h} className={`py-2.5 px-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider ${h === "Instrument" ? "text-left" : h === "" ? "text-right" : "text-right"}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/20">
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
                                    <tr key={iKey || i} className="hover:bg-background-surface/40 transition-colors group">
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-text-primary group-hover:text-sky-400 transition-colors">{sym}</div>
                                            <div className="text-[10px] text-text-tertiary mt-0.5">{pos.exchange || "NSE"}</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-background-surface/80 border border-border-subtle/60 rounded text-text-tertiary uppercase font-mono">
                                                {product}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3.5 text-right font-mono font-bold ${netQty >= 0 ? "text-text-primary" : "text-rose-400"}`}>
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
                                                className="px-2.5 py-1 text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all opacity-80 group-hover:opacity-100 shadow-sm"
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
                                <tr className="border-t-2 border-border-default/40 bg-background-surface/40">
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

