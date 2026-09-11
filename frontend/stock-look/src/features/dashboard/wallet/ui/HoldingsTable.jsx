/**
 * @file HoldingsTable.jsx
 * @purpose Long-term delivery holdings table.
 * @responsibilities
 * - Renders holdings with live LTP from livePrices context where available.
 * - Shows day change, total P&L, and current value per holding.
 */

import React, { useMemo } from "react";
import { Briefcase } from "lucide-react";
import { useDashboardContext } from "@/shared/context/DashboardContext";

const PNL_POS = "text-emerald-400";
const PNL_NEG = "text-rose-400";

function pnlColor(val) { return val > 0 ? PNL_POS : val < 0 ? PNL_NEG : "text-text-tertiary"; }
function sign(val)     { return val > 0 ? "+" : ""; }
function fmt2(n)       { return Number(n || 0).toFixed(2); }
function fmtINR(n)     { return Number(Math.abs(n || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 }); }

function TableSkeleton() {
    return (
        <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-background-surface/50 rounded-xl animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-background-surface/80 border border-border-subtle/60 flex items-center justify-center mb-3 shadow-inner">
                <Briefcase className="w-5 h-5 text-text-tertiary" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">No Long-Term Holdings</h4>
            <p className="text-xs text-text-tertiary max-w-sm leading-relaxed">
                Delivery holdings in your Demat account will automatically synchronize and stream real-time valuations here.
            </p>
        </div>
    );
}

export default function HoldingsTable({ holdings, loading }) {
    const { livePrices } = useDashboardContext();

    const totals = useMemo(() => {
        let pnl = 0, value = 0;
        for (const h of holdings) {
            const iKey = h.instrument_token || h.instrument_key;
            const ltp  = livePrices?.[iKey]?.ltp ?? h.last_trade_price ?? 0;
            const qty  = h.quantity ?? 0;
            pnl   += h.pnl ?? ((ltp - (h.average_price ?? 0)) * qty);
            value += h.current_value ?? (ltp * qty);
        }
        return { pnl, value };
    }, [holdings, livePrices]);

    return (
        <div className="bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl overflow-hidden shadow-sm hover:border-border-default/60 transition-all">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default/30 bg-background-surface/20">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Long-Term Holdings</span>
                    <span className="text-[10px] text-text-tertiary font-mono px-2 py-0.5 bg-background-surface/80 rounded-full border border-border-subtle/50">
                        {holdings.length} stocks
                    </span>
                </div>
                {totals.value > 0 && (
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-md border ${
                            totals.pnl > 0 
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                        }`}>
                            {sign(totals.pnl)}₹{fmtINR(totals.pnl)} P&L
                        </span>
                        <span className="text-xs text-text-tertiary font-mono px-2 py-0.5 bg-background-surface/50 rounded-md border border-border-subtle/40">
                            ₹{fmtINR(totals.value)} deployed
                        </span>
                    </div>
                )}
            </div>

            {/* Body */}
            {loading ? (
                <TableSkeleton />
            ) : holdings.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[700px]">
                        <thead>
                            <tr className="border-b border-border-default/30 bg-background-surface/30">
                                {["Stock", "Qty", "Avg Price", "LTP", "Day Change", "Total P&L", "Current Value"].map(h => (
                                    <th key={h} className={`py-2.5 px-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider ${h === "Stock" ? "text-left" : "text-right"}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/20">
                            {holdings.map((h, i) => {
                                const sym     = h.tradingsymbol || h.trading_symbol || "—";
                                const iKey    = h.instrument_token || h.instrument_key;
                                const qty     = h.quantity ?? 0;
                                const avg     = h.average_price ?? 0;
                                const ltp     = livePrices?.[iKey]?.ltp ?? h.last_trade_price ?? 0;
                                const dayChg  = h.day_change ?? 0;
                                const dayPct  = h.day_change_percentage ?? 0;
                                const pnl     = h.pnl ?? ((ltp - avg) * qty);
                                const value   = h.current_value ?? (ltp * qty);

                                return (
                                    <tr key={iKey || i} className="hover:bg-background-surface/40 transition-colors group">
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-text-primary group-hover:text-sky-400 transition-colors">{sym}</div>
                                            <div className="text-[10px] text-text-tertiary mt-0.5">{h.exchange || "NSE"}</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-text-secondary">{qty}</td>
                                        <td className="px-4 py-3.5 text-right font-mono text-text-secondary">₹{fmt2(avg)}</td>
                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-text-primary">₹{fmt2(ltp)}</td>
                                        <td className={`px-4 py-3.5 text-right font-mono ${pnlColor(dayChg)}`}>
                                            {sign(dayChg)}₹{fmt2(dayChg)}
                                            <div className="text-[9px] opacity-70">{sign(dayPct)}{fmt2(dayPct)}%</div>
                                        </td>
                                        <td className={`px-4 py-3.5 text-right font-mono font-bold ${pnlColor(pnl)}`}>
                                            {sign(pnl)}₹{fmtINR(pnl)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-text-primary">
                                            ₹{fmtINR(value)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {holdings.length > 1 && (
                            <tfoot>
                                <tr className="border-t-2 border-border-default/40 bg-background-surface/40">
                                    <td colSpan={5} className="px-4 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total</td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${pnlColor(totals.pnl)}`}>
                                        {sign(totals.pnl)}₹{fmtINR(totals.pnl)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-sm text-text-primary">
                                        ₹{fmtINR(totals.value)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}
        </div>
    );
}

