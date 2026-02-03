/**
 * @file messagesData.js
 * @purpose Provides mock data and configuration for the Messages feature.
 * @responsibilities
 * - Defines the static list of user messages (alerts, notifications, system).
 * - Exports category definitions and quick filter options.
 * @key_exports
 * - MOCK_MESSAGES
 * - MESSAGE_CATEGORIES
 * - QUICK_FILTERS
 * @dependencies
 * - react-icons/fi (Icons for categories)
 * @lifecycle
 * - Imported by MessagesPage to populate the UI.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import {
    FiBell,
    FiAlertTriangle,
    FiInfo,
    FiCheckCircle,
    FiTrendingUp,
    FiBarChart2,
    FiFileText,
    FiPieChart,
} from "react-icons/fi";

// =============================
// Mock Messages
// =============================
export const MOCK_MESSAGES = [
    {
        id: 1,
        category: "alerts",
        priority: "critical",
        title: "NIFTY 50 Resistance Breakout",
        description: "Crossed key resistance level with strong volume",
        content: "NIFTY 50 has broken above the critical resistance level at ₹20,850 with 15% higher than average volume. This could signal a continuation of the uptrend. Consider reviewing your positions and stop-loss levels.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        icon: FiAlertTriangle,
        metadata: {
            symbol: "NIFTY 50",
            level: "₹20,850",
            change: "+1.2%",
            volume: "+15%",
        },
        actions: [
            { label: "View Chart", icon: FiBarChart2 },
            { label: "Create Alert", icon: FiBell },
        ],
    },
    {
        id: 2,
        category: "notifications",
        priority: "normal",
        title: "Trade Executed Successfully",
        description: "Buy order filled at market price",
        content: "Your buy order for 100 shares of RELIANCE at ₹2,450 has been executed successfully. Order ID: #REL2450100. Total value: ₹2,45,000.",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        read: false,
        icon: FiCheckCircle,
        metadata: {
            symbol: "RELIANCE",
            qty: "100",
            price: "₹2,450",
            value: "₹2,45,000",
        },
        actions: [
            { label: "View Order", icon: FiFileText },
            { label: "View Holdings", icon: FiPieChart },
        ],
    },
    {
        id: 3,
        category: "alerts",
        priority: "high",
        title: "Portfolio Alert: Daily Gain",
        description: "Strong performance across holdings",
        content: "Your portfolio has gained 5.2% today, outperforming NIFTY 50 by 3.8%. Current value: ₹8,45,230. Top performers: TCS (+8.2%), INFY (+6.5%), RELIANCE (+4.1%).",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: false,
        icon: FiTrendingUp,
        metadata: {
            change: "+5.2%",
            value: "₹8,45,230",
            gainToday: "+₹41,850",
            outperformance: "+3.8%",
        },
        actions: [{ label: "View Portfolio", icon: FiPieChart }],
    },
    {
        id: 4,
        category: "notifications",
        priority: "normal",
        title: "Dividend Credited",
        description: "Quarterly dividend from TCS",
        content: "Dividend of ₹1,250 from TCS has been credited to your trading account. Ex-dividend date: Jan 20, 2026. Record date: Jan 22, 2026.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        icon: FiCheckCircle,
        metadata: {
            symbol: "TCS",
            amount: "₹1,250",
            type: "Quarterly",
        },
        actions: [],
    },
    {
        id: 5,
        category: "system",
        priority: "low",
        title: "Scheduled System Maintenance",
        description: "Brief downtime this weekend",
        content: "Scheduled maintenance will occur on Sunday, 2:00 AM - 4:00 AM IST. Trading will be unavailable during this period. Please plan accordingly.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        icon: FiInfo,
        metadata: {
            date: "Sunday, Jan 26",
            time: "2:00 AM - 4:00 AM IST",
        },
        actions: [],
    },
    {
        id: 6,
        category: "alerts",
        priority: "critical",
        title: "Stop Loss Triggered",
        description: "Position auto-closed to limit loss",
        content: "Your stop loss order for HDFC BANK at ₹1,580 has been triggered. 50 shares sold at ₹1,578. Total loss: ₹110. Position closed to protect capital.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        read: true,
        icon: FiAlertTriangle,
        metadata: {
            symbol: "HDFC BANK",
            qty: "50",
            price: "₹1,578",
            loss: "-₹110",
        },
        actions: [{ label: "View Order", icon: FiFileText }],
    },
];

// =============================
// Configuration
// =============================

export const MESSAGE_CATEGORIES = [
    {
        id: "all",
        label: "All Messages",
        icon: FiBell,
        filterFn: () => true
    },
    {
        id: "alerts",
        label: "Alerts",
        icon: FiAlertTriangle,
        filterFn: (m) => m.category === "alerts"
    },
    {
        id: "notifications",
        label: "Notifications",
        icon: FiCheckCircle,
        filterFn: (m) => m.category === "notifications"
    },
    {
        id: "system",
        label: "System",
        icon: FiInfo,
        filterFn: (m) => m.category === "system"
    },
];

export const QUICK_FILTERS = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "today", label: "Today" },
    { id: "priority", label: "High Priority" },
];
