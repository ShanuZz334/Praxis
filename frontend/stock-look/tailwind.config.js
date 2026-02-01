import { colors as paletteColors } from "./src/shared/global/styles/palette.js";
import { fonts } from "./src/shared/global/styles/fonts.js";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        ...paletteColors,
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
        },
        border: {
          default: "var(--border-default)",
          subtle: "var(--border-subtle)",
          hover: "var(--border-hover)",      // Override palette
          active: "var(--border-active)",    // Override palette
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          brand: "var(--text-brand)",        // Override palette
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
            main: "var(--state-warning-main)",       // Override
            surface: "var(--state-warning-surface)", // Override
            text: "var(--state-warning-text)",       // Override
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
