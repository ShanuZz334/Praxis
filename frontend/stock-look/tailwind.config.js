/**
 * @file tailwind.config.js
 * @purpose Tailwind CSS configuration for the Stocky application.
 * @responsibilities
 * - Extends Tailwind with custom color tokens from CSS variables.
 * - Configures dark mode class strategy.
 * - Defines custom font families and box shadows.
 * - Integrates with global palette and font definitions.
 * @key_exports
 * - Tailwind configuration object (default export)
 * @dependencies
 * - ./src/shared/global/styles/fonts.js - Font definitions
 * @lifecycle
 * - Loaded by Tailwind CSS during build and development.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import { fonts } from "./src/shared/global/styles/fonts.js";

// =============================
// Tailwind Configuration
// =============================

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        background: {
          app: "var(--bg-app)",
          card: "var(--bg-card)",
          "card-primary": "var(--bg-card-primary)",
          "card-secondary": "var(--bg-card-secondary)",
          surface: "var(--bg-surface)",
          subtle: "var(--bg-subtle)",
          tooltip: "var(--bg-tooltip)",
          elevated: "var(--bg-elevated)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          brand: "var(--text-brand)",
        },
        border: {
          default: "var(--border-default)",
          subtle: "var(--border-subtle)",
          hover: "var(--border-hover)",
          active: "var(--border-active)",
        },
        state: {
          bullish: {
            main: "var(--state-bullish-main)",
            surface: "var(--state-bullish-surface)",
            text: "var(--state-bullish-text)",
          },
          bearish: {
            main: "var(--state-bearish-main)",
            surface: "var(--state-bearish-surface)",
            text: "var(--state-bearish-text)",
          },
          neutral: {
            main: "var(--state-neutral-main)",
            surface: "var(--state-neutral-surface)",
            text: "var(--state-neutral-text)",
          },
          warning: {
            main: "var(--state-warning-main)",
            surface: "var(--state-warning-surface)",
            text: "var(--state-warning-text)",
          },
        },
        reliability: {
          high: "var(--reliability-high)",
          med: "var(--reliability-med)",
          low: "var(--reliability-low)",
        },
      },
      fontFamily: {
        sans: [fonts.primary],
        brand: [fonts.brand],
        mono: [fonts.mono],
      },
      boxShadow: {
        "card-3d-hover": "var(--shadow-card-3d-hover)",
      },
    },
  },

  plugins: [],
};
