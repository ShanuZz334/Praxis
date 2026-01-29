/* --------------------------------------------------------------------------
   GLOBAL PALETTE
   The single source of truth for all colors in the application.
   Uses CSS variables for dynamic theme adaptation.
-------------------------------------------------------------------------- */

export const colors = {
    // Backgrounds
    background: {
        app: "var(--bg-app)",
        card: "var(--bg-card)",
        elevated: "var(--bg-surface)",
        surface: "var(--glass-bg)",
    },

    // Borders
    border: {
        default: "var(--border-main)",
        subtle: "var(--border-main)",
        hover: "var(--border-hover)",
        active: "var(--accent-primary)",
    },

    // Text
    text: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-muted)",
        brand: "var(--accent-primary)",
    },

    // Semantic States
    state: {
        bullish: {
            main: "var(--success)",
            text: "var(--success)",
            surface: "rgba(16, 185, 129, 0.1)",
            border: "var(--border-main)",
        },
        bearish: {
            main: "var(--danger)",
            text: "var(--danger)",
            surface: "rgba(239, 68, 68, 0.1)",
            border: "var(--border-main)",
        },
        neutral: {
            main: "var(--neutral)",
            text: "var(--text-secondary)",
            surface: "rgba(100, 116, 139, 0.1)",
            border: "var(--border-main)",
        },
        warning: {
            main: "var(--warning)",
            text: "var(--warning)",
            surface: "rgba(245, 158, 11, 0.1)",
        }
    },

    // Reliability Tiers (Colors Only)
    reliability: {
        high: "var(--success)",
        med: "#facc15", // yellow-400
        low: "var(--text-muted)",
    }
};

import { fonts as fontDefinitions } from './fonts';

export const fonts = fontDefinitions;
