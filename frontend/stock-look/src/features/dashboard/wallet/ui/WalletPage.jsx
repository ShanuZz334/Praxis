/**
 * @file WalletPage.jsx
 * @purpose Main Wallet Intelligence dashboard.
 * @responsibilities
 * - Wires all portfolio data from usePortfolioData (WebSocket-driven).
 * - Computes derived metrics (P&L, allocation, drawdown, risk regime) in useMemo.
 * - Mounts all existing sub-components with real data.
 * @lifecycle
 * - Route: /dashboard/wallet
 */

import React, { useMemo } from "react";
import { RefreshCw } from "lucide-react";

// Existing wallet sub-components (unchanged, just wired)
import WalletHeader        from "./WalletHeader";
import LivePnLCard         from "./LivePnLCard";
import AllocationMap       from "./AllocationMap";
import RiskDrawdownPanel   from "./RiskDrawdownPanel";
import PerformanceStats    from "./PerformanceStats";
import TradePermissionBanner from "./TradePermissionBanner";

// New table components
import PositionsTable  from "./PositionsTable";
import HoldingsTable   from "./HoldingsTable";
import OrderBookTable  from "./OrderBookTable";

// Data hook + engine
import { usePortfolioData }   from "../hooks/usePortfolioData";
import { calculateRiskRegime } from "../engine/riskEngine";

// Shared
import { useDashboardContext } from "@/shared/context/DashboardContext";
import Loader from "@/shared/components/ui/Loader";

export default function WalletPage() {
    const { setGlobalOrderTicket } = useDashboardContext();

    const {
        funds, positions, holdings,
        orderBook, tradeBook,
        journalStats, dailySummary,
        loading, lastUpdated, refetch
    } = usePortfolioData();

    // ─── Derived: Funds breakdown ────────────────────────────────────────────
    const equity = funds?.equity || {};
    const available  = equity.available_balance || 0;
    const usedMargin = equity.used_margin || 0;
    const collateral = equity.collateral || 0;
    const totalCapital = available + usedMargin + collateral;

    // ─── Derived: Today's P&L from positions ────────────────────────────────
    const { totalUnrealized, totalRealized, todayPnL } = useMemo(() => {
        const ur = positions.reduce((s, p) => s + (p.unrealised ?? p.unrealized_pnl ?? 0), 0);
        const re = positions.reduce((s, p) => s + (p.realised   ?? p.realized_pnl  ?? 0), 0);
        return { totalUnrealized: ur, totalRealized: re, todayPnL: ur + re };
    }, [positions]);

    const todayPnLPct  = totalCapital > 0 ? +((todayPnL / totalCapital) * 100).toFixed(2) : 0;
    const openRiskPct  = totalCapital > 0 ? +((usedMargin / totalCapital) * 100).toFixed(1) : 0;

    // ─── Risk Regime (drives WalletHeader "activeMode") ──────────────────────
    const regime = useMemo(() => calculateRiskRegime({
        drawdown:   { current: Math.abs(Math.min(todayPnLPct, 0)), maxAllowed: 2 },
        allocation: [{ id: "options", value: Math.min(openRiskPct, 40) }],
        pnl:        { todayPct: todayPnLPct, winRateToday: 0.5 }
    }), [todayPnLPct, openRiskPct]);

    // ─── WalletHeader summary prop ───────────────────────────────────────────
    const summary = useMemo(() => ({
        availableCapital:  available,
        todayPnL:          Math.round(todayPnL),
        todayPnLPct,
        openRiskPct,
        maxRiskAllowedPct: 2.0,
        activeMode:        regime.label
    }), [available, todayPnL, todayPnLPct, openRiskPct, regime.label]);

    // ─── LivePnLCard pnl prop ────────────────────────────────────────────────
    const pnlData = useMemo(() => {
        const winContrib  = Math.round(positions.reduce((s, p) => s + Math.max(0, p.unrealised ?? p.unrealized_pnl ?? 0), 0));
        const lossContrib = Math.round(Math.abs(positions.reduce((s, p) => s + Math.min(0, p.unrealised ?? p.unrealized_pnl ?? 0), 0)));
        const todayPct    = totalCapital > 0 ? +((todayPnL / totalCapital) * 100).toFixed(2) : 0;

        // Build 7-day equity curve from daily journal summary
        const equityCurve = dailySummary.length > 0
            ? dailySummary.slice(-7).map((d, i) => ({ day: i + 1, val: d.pnl || 0 }))
            : [{ day: 1, val: Math.round(todayPnL) }];

        const weeklyPnL = equityCurve.reduce((s, d) => s + (d.val || 0), 0);

        return {
            net:             Math.round(todayPnL),
            gross:           winContrib,
            charges:         0,
            winContribution: winContrib,
            lossContribution: lossContrib,
            todayPct,
            weekly:          Math.round(weeklyPnL),
            equityCurve,
            stats7D: {
                maxDrawdown: journalStats?.maxDrawdown || "—",
                bestDay:     journalStats?.maxTradePnl ? Math.round(journalStats.maxTradePnl) : 0
            }
        };
    }, [positions, totalCapital, todayPnL, dailySummary, journalStats]);

    // ─── AllocationMap allocation prop ───────────────────────────────────────
    const allocationData = useMemo(() => {
        if (totalCapital === 0) return [];
        const holdingsValue = holdings.reduce((s, h) => s + (h.current_value || 0), 0);
        const cashPct       = Math.round((available   / totalCapital) * 100);
        const marginPct     = Math.round((usedMargin  / totalCapital) * 100);
        const holdingsPct   = Math.min(100, Math.round((holdingsValue / totalCapital) * 100));
        const collateralPct = Math.round((collateral  / totalCapital) * 100);
        return [
            { id: "margin",     name: "Active Margin", value: marginPct,     target: 50, delta: marginPct - 50,     action: marginPct > 60 ? "Reduce" : "Hold" },
            { id: "holdings",   name: "Holdings",      value: holdingsPct,   target: 30, delta: holdingsPct - 30,   action: "Hold" },
            { id: "collateral", name: "Collateral",    value: collateralPct, target: 10, delta: collateralPct - 10, action: "Maintain" },
            { id: "cash",       name: "Free Cash",     value: cashPct,       target: 15, delta: cashPct - 15,       action: cashPct < 10 ? "Alert" : "Good" },
        ];
    }, [totalCapital, available, usedMargin, collateral, holdings]);

    // ─── RiskDrawdownPanel drawdown + riskRules props ────────────────────────
    const drawdown = useMemo(() => {
        const currentDDPct  = totalCapital > 0 && todayPnL < 0 ? +((Math.abs(todayPnL) / totalCapital) * 100).toFixed(2) : 0;
        const maxAllowed    = 2.0;
        const remaining     = Math.max(0, ((maxAllowed - currentDDPct) / maxAllowed) * totalCapital);
        return {
            current:         currentDDPct,
            maxAllowed,
            peakCapital:     totalCapital,
            remainingBudget: Math.round(remaining),
            recoveryNeeded:  currentDDPct > 0 ? +(currentDDPct / (1 - currentDDPct / 100)).toFixed(2) : 0
        };
    }, [totalCapital, todayPnL]);

    const cashPct      = allocationData.find(a => a.id === "cash")?.value || 0;
    const losingLegs   = positions.filter(p => (p.realised ?? p.realized_pnl ?? 0) < 0).length;

    const riskRules = useMemo(() => [
        { id: 1, text: "No new trades if DD > 2%",      condition: `DD: ${drawdown.current}%`,      active: true, triggered: drawdown.current > 2,   status: drawdown.current > 2   ? "TRIGGERED" : "ARMED" },
        { id: 2, text: "Reduce size after 2 losing legs", condition: `Losing: ${losingLegs}`,        active: true, triggered: losingLegs >= 2,         status: losingLegs >= 2        ? "TRIGGERED" : "ARMED" },
        { id: 3, text: "Max 50% margin utilization",    condition: `Used: ${openRiskPct}%`,          active: true, triggered: openRiskPct > 50,        status: openRiskPct > 50       ? "TRIGGERED" : "ARMED" },
        { id: 4, text: "Cash buffer > 10%",             condition: `Cash: ${cashPct}%`,              active: true, triggered: cashPct < 10 && cashPct > 0, status: cashPct < 10 && cashPct > 0 ? "TRIGGERED" : "ARMED" },
    ], [drawdown.current, losingLegs, openRiskPct, cashPct]);

    // ─── TradePermissionBanner permission prop ───────────────────────────────
    const permission = useMemo(() => {
        const triggered = riskRules.filter(r => r.triggered);
        if (triggered.length >= 2) return { status: "BLOCKED",      reason: `${triggered.length} risk rules triggered. Cease all trading.` };
        if (triggered.length === 1) return { status: "REDUCED_SIZE", reason: `${triggered[0].text}. Reduce position size.` };
        return { status: "ALLOWED", reason: "All risk parameters within limits. Trade freely." };
    }, [riskRules]);

    // ─── PerformanceStats stats prop ─────────────────────────────────────────
    const perfStats = useMemo(() => {
        const pf = journalStats?.grossProfit && journalStats?.grossLoss
            ? +(Math.abs(journalStats.grossProfit) / Math.abs(journalStats.grossLoss || 1)).toFixed(2) : "—";
        const exp = journalStats?.netPnl && journalStats?.totalTrades
            ? Math.round(journalStats.netPnl / (journalStats.totalTrades || 1)) : "—";
        const avgR = journalStats?.avgWinTrade && journalStats?.avgLossTrade
            ? +(journalStats.avgWinTrade / Math.abs(journalStats.avgLossTrade || 1)).toFixed(2) : "—";
        return {
            avgR,
            profitFactor: pf,
            expectancy:   typeof exp === "number" ? `₹${exp}` : exp,
            avgHoldTime:  "N/A",
            bestSetup:    "N/A",
            worstSetup:   "N/A"
        };
    }, [journalStats]);

    // ─── Exit Position → GlobalOrderTicket ───────────────────────────────────
    const handleExitPosition = (pos) => {
        const iKey   = pos.instrument_token || pos.instrument_key;
        const sym    = pos.tradingsymbol || pos.trading_symbol;
        const netQty = pos.quantity ?? pos.net_quantity ?? 0;
        if (!iKey || !setGlobalOrderTicket) return;
        setGlobalOrderTicket({
            type: "QUICK",
            data: {
                transactionType: netQty > 0 ? "SELL" : "BUY",
                instrument: {
                    instrument_token: iKey,
                    trading_symbol:   sym,
                    ltp:   pos.last_price  || 0,
                    close: pos.close_price || 0
                }
            }
        });
    };

    // ─── Initial Loading State ────────────────────────────────────────────────
    const isInitialLoading = loading.funds && loading.positions;
    if (isInitialLoading) {
        return (
            <div className="w-full min-h-[80vh] flex flex-col items-center justify-center">
                <Loader size="lg" color="indigo" />
                <p className="text-text-secondary mt-8 font-mono text-[11px] tracking-[0.2em] animate-pulse uppercase">
                    Loading Wallet Intelligence...
                </p>
            </div>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="px-4 md:px-6 pt-2 pb-28 space-y-5 md:space-y-6 w-full mx-auto animate-in fade-in duration-500">

            {/* Refresh bar */}
            <div className="flex items-center justify-between">
                <div />
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-[10px] text-text-tertiary font-mono">
                            Positions updated {new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    )}
                    <button
                        onClick={refetch.all}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-text-tertiary hover:text-text-primary bg-background-surface hover:bg-background-card border border-border-subtle rounded-lg transition-all"
                    >
                        <RefreshCw size={11} />
                        Refresh All
                    </button>
                </div>
            </div>

            {/* 1. Trade Permission Banner */}
            <TradePermissionBanner permission={permission} />

            {/* 2. Funds & Risk Summary Header */}
            <WalletHeader summary={summary} />

            {/* 3. Live Open Positions */}
            <PositionsTable
                positions={positions}
                loading={loading.positions}
                onClose={handleExitPosition}
            />

            {/* 4. Long-Term Holdings */}
            <HoldingsTable
                holdings={holdings}
                loading={loading.holdings}
            />

            {/* 5. P&L Equity Curve */}
            {(pnlData.net !== 0 || pnlData.equityCurve.length > 1) && (
                <LivePnLCard pnl={pnlData} />
            )}

            {/* 6. Capital Allocation Map */}
            {allocationData.length > 0 && (
                <AllocationMap allocation={allocationData} />
            )}

            {/* 7. Drawdown + Risk Protocols */}
            <RiskDrawdownPanel drawdown={drawdown} riskRules={riskRules} />

            {/* 8. YTD Performance Stats */}
            <PerformanceStats stats={perfStats} />

            {/* 9. Order Book + Trade Book */}
            <OrderBookTable
                orderBook={orderBook}
                tradeBook={tradeBook}
                loading={loading.orderBook}
            />

        </div>
    );
}
