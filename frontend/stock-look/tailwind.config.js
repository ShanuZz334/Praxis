import { colors as paletteColors } from './src/shared/global/styles/palette.js';
import { fonts } from './src/shared/global/styles/fonts.js';

export default {
    darkMode: "class",

    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],

    theme: {
        extend: {
            colors: {
                ...paletteColors, // Base palette
                background: {
                    ...paletteColors.background,
                    app: "var(--bg-app)",
                    card: "var(--bg-card)",
                    "card-primary": "var(--bg-card-primary)",
                    "card-secondary": "var(--bg-card-secondary)",
                    glass: "var(--bg-glass)",
                    "modal-warning": "var(--bg-modal-warning)",
                    surface: "var(--bg-surface)",
                    elevated: "var(--bg-elevated)",
                },
                action: {
                    primary: "var(--action-primary)",
                    hover: "var(--action-primary-hover)",
                },
                text: {
                    ...paletteColors.text,
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    tertiary: "var(--text-tertiary)",
                },
                border: {
                    ...paletteColors.border,
                    default: "var(--border-default)",
                    subtle: "var(--border-subtle)",
                    "subtle-translucent": "var(--border-subtle-translucent)",
                    "subtle-faint": "var(--border-subtle-faint)",
                },
                state: {
                    ...paletteColors.state,
                    bullish: {
                        ...paletteColors.state?.bullish,
                        main: "var(--state-bullish-main)",
                        surface: "var(--state-bullish-surface)",
                        text: "var(--state-bullish-text)",
                    },
                    bearish: {
                        ...paletteColors.state?.bearish,
                        main: "var(--state-bearish-main)",
                        surface: "var(--state-bearish-surface)",
                        text: "var(--state-bearish-text)",
                    },
                    neutral: {
                        ...paletteColors.state?.neutral,
                        main: "var(--state-neutral-main)",
                        surface: "var(--state-neutral-surface)",
                        text: "var(--state-neutral-text)",
                    }
                },
                stocky: "#1E2BFF", // 🔵 Stocky brand blue
            },
            fontFamily: {
                sans: [fonts.primary],
                brand: [fonts.brand],
                mono: [fonts.mono],
            },
            boxShadow: {
                stocky: "0 0 20px rgba(30,43,255,0.45)",
                "card-3d-hover": "var(--shadow-card-3d-hover)",
            },
        },
    },

    plugins: [],
};
