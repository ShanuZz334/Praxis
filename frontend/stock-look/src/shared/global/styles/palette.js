/* --------------------------------------------------------------------------
   GLOBAL PALETTE
   The single source of truth for all colors in the application.
   Do strictly use these constants or their Tailwind equivalents.
-------------------------------------------------------------------------- */

export const colors = {
    // Backgrounds
    background: {
        app: "#02050e",
        card: "#0b1220",   // Match Tooltip
        elevated: "#0b1220", // Match Tooltip (Flattened from #101a33)
        surface: "rgba(255, 255, 255, 0.02)",
    },

    // Borders
    border: {
        default: "var(--border-default)",  // Dynamic
        subtle: "var(--border-subtle)",   // Dynamic
        hover: "rgba(255, 255, 255, 0.20)",    // Increased from 0.12
        active: "rgba(59, 130, 246, 0.5)",
    },

    // Text (Opacity based on white)
    text: {
        primary: "rgba(255, 255, 255, 0.9)",
        secondary: "rgba(255, 255, 255, 0.6)",
        tertiary: "rgba(255, 255, 255, 0.4)",
        brand: "#60a5fa", // blue-400
    },

    // Semantic States
    state: {
        bullish: {
            main: "#10b981", // emerald-500
            text: "#34d399", // emerald-400
            surface: "rgba(16, 185, 129, 0.1)",
            border: "rgba(16, 185, 129, 0.3)",
        },
        bearish: {
            main: "#ef4444", // red-500
            text: "#f87171", // red-400
            surface: "rgba(239, 68, 68, 0.1)",
            border: "rgba(239, 68, 68, 0.3)",
        },
        neutral: {
            main: "#64748b", // slate-500
            text: "#e2e8f0", // slate-200
            surface: "rgba(100, 116, 139, 0.1)",
            border: "rgba(100, 116, 139, 0.3)",
        },
        warning: {
            main: "#f59e0b", // amber-500
            text: "#fbbf24", // amber-400
            surface: "rgba(245, 158, 11, 0.1)",
        }
    },

    // Reliability Tiers (Colors Only)
    reliability: {
        high: "#10b981",
        med: "#facc15", // yellow-400
        low: "#94a3b8", // slate-400
    }
};

import { fonts as fontDefinitions } from './fonts';

export const fonts = fontDefinitions;
