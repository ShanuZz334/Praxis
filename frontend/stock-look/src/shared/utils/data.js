/**
 * @file data.js
 * @purpose Side menu navigation configuration data.
 * @responsibilities
 * - Defines all dashboard navigation items with icons and routes.
 * - Provides centralized menu structure for SideMenu component.
 * @key_exports
 * - SIDE_MENU_DATA
 * @dependencies
 * - react-icons/lu (Lucide icons)
 * @lifecycle
 * - Used by SideMenu and navigation components.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import {
    LuLayoutDashboard,
    LuLandmark,
    LuChartCandlestick,
    LuTarget,
    LuCalendarClock,
    LuWallet,
    LuEarth,
    LuNotebook,
    LuLogOut,
    LuFileText,
    LuInfo,
} from "react-icons/lu";

// =============================
// Side Menu Configuration
// =============================

export const SIDE_MENU_DATA = [
    {
        id: "01",
        key: "dashboard",
        label: "DASHBOARD",
        icon: LuLayoutDashboard,
        path: "/dashboard/home",
    },
    {
        id: "02",
        key: "fundamental",
        label: "FUNDAMENTAL",
        icon: LuLandmark,
        path: "/dashboard/fundamental",
    },
    {
        id: "03",
        key: "technical",
        label: "TECHNICAL",
        icon: LuChartCandlestick,
        path: "/dashboard/technical",
    },
    {
        id: "04",
        key: "options",
        label: "OPTIONS",
        icon: LuTarget,
        path: "/dashboard/options",
    },
    {
        id: "04a",
        key: "pai",
        label: "PAI",
        icon: null,
        customIcon: "pai",
        path: "/dashboard/pai",
    },
    {
        id: "05",
        key: "events",
        label: "EVENTS",
        icon: LuCalendarClock,
        path: "/dashboard/events",
    },
    {
        id: "06",
        key: "globalstructure",
        label: "GLOBAL",
        icon: LuEarth,
        path: "/dashboard/globalstructure",
    },
    {
        id: "07",
        key: "wallet",
        label: "WALLET",
        icon: LuWallet,
        path: "/dashboard/wallet",
    },
    {
        id: "08",
        key: "journal",
        label: "JOURNAL",
        icon: LuNotebook,
        path: "/dashboard/journal",
    },

    {
        id: "09",
        key: "manual",
        label: "MANUAL",
        icon: LuFileText,
        path: "/dashboard/manual",
    },
    {
        id: "11",
        key: "logout",
        label: "LOGOUT",
        icon: LuLogOut,
        path: "/logout",
    },
];
