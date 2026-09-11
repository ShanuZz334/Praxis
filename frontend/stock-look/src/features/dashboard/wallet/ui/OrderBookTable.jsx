/**
 * @file OrderBookTable.jsx
 * @purpose Tabbed Order Book + Trade Book for today's activity.
 * @responsibilities
 * - Renders today's orders (all statuses) in Orders tab.
 * - Renders today's executed trades in Trades tab.
 */

import React, { useState } from "react";
import { FileText, CheckSquare, Clock, ArrowRight } from "lucide-react";

const STATUS_STYLE = {
    "complete":        "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    "open":            "text-sky-400 bg-sky-500/10 border-sky-500/25",
    "open pending":    "text-sky-400 bg-sky-500/10 border-sky-500/25",
    "cancelled":       "text-text-tertiary bg-background-surface/80 border-border-subtle/50",
    "rejected":        "text-rose-400 bg-rose-500/10 border-rose-500/25",
    "trigger pending": "text-amber-400 bg-amber-500/10 border-amber-500/25",
    "modified":        "text-violet-400 bg-violet-500/10 border-violet-500/25",
    "scheduled":       "text-amber-400 bg-amber-500/10 border-amber-500/25",
    "failed":          "text-rose-400 bg-rose-500/10 border-rose-500/25",
    "triggered":       "text-sky-400 bg-sky-500/10 border-sky-500/25",
};

function statusStyle(s = "") { return STATUS_STYLE[s.toLowerCase()] || "text-text-secondary bg-background-surface/80 border-border-subtle/50"; }
function formatTime(ts) {
    if (!ts) return "—";
    try { 
        if (typeof ts === 'number' && ts > 9999999999999) ts = ts / 1000;
        return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }); 
    }
    catch { return String(ts).slice(0, 8); }
}
function fmt2(n) { return Number(n || 0).toFixed(2); }
function fmtINR(n) { return Number(Math.abs(n || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 }); }

function EmptyState({ icon, title, msg }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-background-surface/80 border border-border-subtle/60 flex items-center justify-center mb-3 shadow-inner">
                {icon}
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">{title}</h4>
            <p className="text-xs text-text-tertiary max-w-sm leading-relaxed">{msg}</p>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-9 bg-background-surface/50 rounded-xl animate-pulse" />)}
        </div>
    );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersView({ orders, loading }) {
    if (loading) return <TableSkeleton />;
    if (!orders.length) return (
        <EmptyState
            icon={<FileText className="w-5 h-5 text-text-tertiary" />}
            title="No Orders Placed Today"
            msg="Executed, pending, and cancelled intraday orders will stream live in this ledger."
        />
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[750px]">
                <thead>
                    <tr className="border-b border-border-default/30 bg-background-surface/30">
                        {["Time", "Symbol", "B/S", "Type", "Qty", "Price", "Avg Fill", "Status"].map((h, i) => (
                            <th key={h} className={`py-2.5 px-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider ${i <= 1 ? "text-left" : i === 7 ? "text-center" : "text-right"}`}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/20">
                    {orders.map((o, i) => {
                        const isBuy = o.transaction_type === "BUY";
                        const status = (o.status || "").toLowerCase();
                        return (
                            <React.Fragment key={o.order_id || i}>
                                <tr className="hover:bg-background-surface/40 transition-colors">
                                    <td className="px-4 py-3 font-mono text-[10px] text-text-tertiary">{formatTime(o.order_timestamp || o.created_at || o.exchange_timestamp)}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-text-primary">{o.tradingsymbol || o.trading_symbol || "—"}</div>
                                        <div className="text-[10px] text-text-tertiary">{o.exchange || ""}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${isBuy ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
                                            {o.transaction_type || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-[10px] text-text-secondary">{o.tag === 'praxis_mkt' ? 'MARKET' : (o.order_type || "—")}</td>
                                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{o.quantity ?? "—"}</td>
                                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{o.tag === 'praxis_mkt' ? "MKT" : (o.price ? `₹${fmt2(o.price)}` : "MKT")}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                                        {o.average_price ? `₹${fmt2(o.average_price)}` : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-md border uppercase ${statusStyle(status)}`}>
                                            {o.status || "—"}
                                        </span>
                                    </td>
                                </tr>
                                {o.status_message && (status === 'rejected' || status === 'cancelled') && (
                                    <tr className="border-b border-rose-500/20 bg-rose-500/5">
                                        <td colSpan={8} className="px-4 py-2 text-[11px] text-rose-400">
                                            <span className="font-bold mr-1">Reason:</span> {o.status_message}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Trades Tab ───────────────────────────────────────────────────────────────
function TradesView({ trades, loading }) {
    if (loading) return <TableSkeleton />;
    if (!trades.length) return (
        <EmptyState
            icon={<CheckSquare className="w-5 h-5 text-text-tertiary" />}
            title="No Executed Trades"
            msg="Completed fills and transaction turnover from today's market session will show here."
        />
    );

    const totalValue = trades.reduce((s, t) => s + (Number(t.average_price || t.trade_price || 0) * Number(t.quantity || 0)), 0);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
                <thead>
                    <tr className="border-b border-border-default/30 bg-background-surface/30">
                        {["Time", "Symbol", "B/S", "Qty", "Trade Price", "Value"].map((h, i) => (
                            <th key={h} className={`py-2.5 px-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider ${i <= 1 ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/20">
                    {trades.map((t, i) => {
                        const price = t.average_price ?? t.trade_price ?? 0;
                        const qty   = t.quantity ?? 0;
                        const value = Number(price) * Number(qty);
                        const isBuy = t.transaction_type === "BUY";

                        return (
                            <tr key={t.trade_id || i} className="hover:bg-background-surface/40 transition-colors">
                                <td className="px-4 py-3 font-mono text-[10px] text-text-tertiary">{formatTime(t.exchange_timestamp || t.trade_date)}</td>
                                <td className="px-4 py-3 font-bold text-text-primary">{t.tradingsymbol || t.trading_symbol || "—"}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${isBuy ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
                                        {t.transaction_type || "—"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-text-secondary">{qty}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">₹{Number(price).toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-mono text-text-primary">₹{fmtINR(value)}</td>
                            </tr>
                        );
                    })}
                </tbody>
                {trades.length > 1 && (
                    <tfoot>
                        <tr className="border-t-2 border-border-default/40 bg-background-surface/40">
                            <td colSpan={5} className="px-4 py-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total Turnover</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-sm text-text-primary">₹{fmtINR(totalValue)}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderBookTable({ orderBook = [], tradeBook = [], loading }) {
    const [tab, setTab] = useState("orders");

    const dayOrders = orderBook.filter(o => o.order_type !== "GTT" && !(o.order_ref_id || '').startsWith('GTT-'));
    const gttOrders = orderBook.filter(o => o.order_type === "GTT");

    const tabs = [
        { id: "orders", label: "Day Orders", count: dayOrders.length },
        { id: "gtt", label: "GTT Orders", count: gttOrders.length },
        { id: "trades", label: "Trade Book", count: tradeBook.length },
    ];

    return (
        <div className="bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl overflow-hidden shadow-sm hover:border-border-default/60 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default/30 bg-background-surface/20">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background-surface/60 border border-border-subtle/40">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                tab === t.id
                                    ? "bg-background-elevated text-text-primary shadow-sm border border-border-subtle/60"
                                    : "text-text-tertiary hover:text-text-secondary border border-transparent"
                            }`}
                        >
                            {t.label}
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                tab === t.id ? "bg-background-surface text-text-primary font-bold" : "bg-background-surface/40 text-text-tertiary"
                            }`}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary font-mono">
                    <Clock size={12} />
                    <span>Session Activity</span>
                </div>
            </div>

            {/* Content */}
            {tab === "orders" && <OrdersView orders={dayOrders} loading={loading} />}
            {tab === "gtt" && <OrdersView orders={gttOrders} loading={loading} />}
            {tab === "trades" && <TradesView trades={tradeBook} loading={loading} />}
        </div>
    );
}

