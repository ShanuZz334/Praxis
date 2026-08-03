/**
 * @file usePortfolioData.js
 * @purpose Single hook that provides all wallet/portfolio data.
 * @responsibilities
 * - Fetches funds, positions, holdings, order-book, trade-book from portfolio API.
 * - Subscribes to socket.io `position:update` and `holding:update` for live push.
 * - No polling — 100% WebSocket-driven after initial load.
 * @lifecycle
 * - Used by WalletPage exclusively.
 */

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/shared/utils/axiosInstance";
import socket from "@/shared/utils/socket";
import { API_PATHS } from "@/shared/utils/apiPaths";

const DEFAULT_LOADING = { funds: true, positions: true, holdings: true, orderBook: true, tradeBook: true, stats: true };

export function usePortfolioData() {
    const [funds, setFunds]             = useState(null);
    const [positions, setPositions]     = useState([]);
    const [holdings, setHoldings]       = useState([]);
    const [orderBook, setOrderBook]     = useState([]);
    const [tradeBook, setTradeBook]     = useState([]);
    const [journalStats, setJournalStats] = useState(null);
    const [dailySummary, setDailySummary] = useState([]);
    const [loading, setLoading]         = useState(DEFAULT_LOADING);
    const [lastUpdated, setLastUpdated] = useState(null);

    // ─── Fetchers ────────────────────────────────────────────────────────────
    const fetchFunds = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(API_PATHS.PORTFOLIO.FUNDS);
            if (data.success) setFunds(data.data);
        } catch (e) { console.warn("[Wallet] funds:", e.message); }
        finally { setLoading(p => ({ ...p, funds: false })); }
    }, []);

    const fetchPositions = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(API_PATHS.PORTFOLIO.POSITIONS);
            if (data.success) { setPositions(data.data || []); setLastUpdated(Date.now()); }
        } catch (e) { console.warn("[Wallet] positions:", e.message); }
        finally { setLoading(p => ({ ...p, positions: false })); }
    }, []);

    const fetchHoldings = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(API_PATHS.PORTFOLIO.HOLDINGS);
            if (data.success) setHoldings(data.data || []);
        } catch (e) { console.warn("[Wallet] holdings:", e.message); }
        finally { setLoading(p => ({ ...p, holdings: false })); }
    }, []);

    const fetchOrderBook = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(API_PATHS.PORTFOLIO.ORDER_BOOK);
            if (data.success) setOrderBook(data.data || []);
        } catch (e) { console.warn("[Wallet] order-book:", e.message); }
        finally { setLoading(p => ({ ...p, orderBook: false })); }
    }, []);

    const fetchTradeBook = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(API_PATHS.PORTFOLIO.TRADE_BOOK);
            if (data.success) setTradeBook(data.data || []);
        } catch (e) { console.warn("[Wallet] trade-book:", e.message); }
        // No separate loading key for tradeBook — shares orderBook spinner
    }, []);

    const fetchJournalStats = useCallback(async () => {
        try {
            const year = new Date().getFullYear();
            const { data } = await axiosInstance.get(`${API_PATHS.JOURNAL.GET_STATS}?year=${year}`);
            
            if (data?.data?.hasData) {
                const { agg, days } = data.data;
                setJournalStats(agg);
                setDailySummary(days.map(d => ({ date: d.date, pnl: d.dayPnl || 0 })));
            } else {
                setJournalStats(null);
                setDailySummary([]);
            }
        } catch (e) { console.warn("[Wallet] journal-stats:", e.message); }
        finally { setLoading(p => ({ ...p, stats: false })); }
    }, []);

    // ─── Initial Load ─────────────────────────────────────────────────────────
    useEffect(() => {
        fetchFunds();
        fetchPositions();
        fetchHoldings();
        fetchOrderBook();
        fetchTradeBook();
        fetchJournalStats();
    }, [fetchFunds, fetchPositions, fetchHoldings, fetchOrderBook, fetchTradeBook, fetchJournalStats]);

    // ─── WebSocket — Live Push ────────────────────────────────────────────────
    useEffect(() => {
        const onPositionUpdate = (updated) => {
            if (Array.isArray(updated) && updated.length > 0) {
                setPositions(updated);
                setLastUpdated(Date.now());
            }
        };
        const onHoldingUpdate = (updated) => {
            if (Array.isArray(updated) && updated.length > 0) {
                setHoldings(updated);
            }
        };

        socket.on("position:update", onPositionUpdate);
        socket.on("holding:update", onHoldingUpdate);

        return () => {
            socket.off("position:update", onPositionUpdate);
            socket.off("holding:update", onHoldingUpdate);
        };
    }, []);

    return {
        funds,
        positions,
        holdings,
        orderBook,
        tradeBook,
        journalStats,
        dailySummary,
        loading,
        lastUpdated,
        refetch: {
            all: () => { fetchFunds(); fetchPositions(); fetchHoldings(); fetchOrderBook(); fetchTradeBook(); fetchJournalStats(); },
            positions: fetchPositions,
            orderBook: () => { fetchOrderBook(); fetchTradeBook(); },
        }
    };
}
