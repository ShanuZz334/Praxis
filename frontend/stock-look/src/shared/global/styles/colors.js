/**
 * @file colors.js
 * @purpose Centralized repository of all standard Praxis colors from the design spec.
 * @date 2026-07-11
 */

export const PRAXIS_COLORS = {
    // -------------------------
    // 1. Status Colors (7-Level Overall Score / Regime)
    // -------------------------
    status7: {
        extremeRisk: "#D92D20",
        highRisk: "#F04438",
        weak: "#F79009",
        balanced: "#FACC15",
        constructive: "#22C55E",
        strong: "#16A34A",
        exceptional: "#2E5BFF" // Praxis Blue
    },

    // -------------------------
    // 2. Indicator Status (5-Level)
    // -------------------------
    status5: {
        poor: "#E5484D",
        weak: "#F59E0B",
        balanced: "#94A3B8",
        strong: "#22C55E",
        exceptional: "#2E5BFF" // Praxis Blue
    },

    // -------------------------
    // 3. Praxis Chart Palette v1
    // -------------------------
    chart: {
        line1Primary: "#2E5BFF",      // Praxis Blue - Primary metric
        line2Engine: "#22C55E",       // Emerald Green - Engine / Benchmark
        line3Secondary: "#F59E0B",    // Amber Gold - Secondary metric
        line4Oscillator: "#A855F7",   // Violet - Oscillator / Derived metric
        line5Forecast: "#06B6D4"      // Cyan - Forecast / Prediction / Extra metric
    },

    // -------------------------
    // 4. Accent Colors / Specific Indicator Groups
    // -------------------------
    accent: {
        trend: "#2E5BFF",             // Praxis Blue - Trend / General Indicators
        momentum: "#8B5CF6",          // Electric Violet - Momentum Indicators
        volume: "#22C55E",            // Emerald Green - Volume / Breadth
        volatility: "#F59E0B",        // Amber Orange - Volatility / Risk
        structure: "#06B6D4"          // Cyan - Market Structure / Support & Resistance
    },

    // -------------------------
    // 5. Events Module Colors
    // -------------------------
    events: {
        sentiment: {
            veryBullish: "#16A34A",
            bullish: "#22C55E",
            neutral: "#94A3B8",
            bearish: "#F97316",
            veryBearish: "#DC2626"
        },
        importance: {
            low: "#94A3B8",
            medium: "#2E5BFF",
            high: "#F59E0B",
            critical: "#DC2626"
        },
        severity: {
            normal: "#94A3B8",
            important: "#F59E0B",
            major: "#EA580C",
            systemic: "#DC2626",
            blackSwan: "#7C3AED"
        },
        override: {
            none: "#94A3B8",
            watch: "#FACC15",
            override: "#8B5CF6",
            forceOverride: "#2E5BFF"
        },
        horizon: {
            intraday: "#2E5BFF",
            swing: "#22C55E",
            positional: "#06B6D4",
            structural: "#8B5CF6",
            longTerm: "#4F46E5"
        },
        confidence: {
            low: "#E5484D",           // 0-50%
            medium: "#F59E0B",        // 51-70%
            high: "#22C55E",          // 71-85%
            veryHigh: "#2E5BFF"       // 86-100%
        },
        eventScore: {
            extremelyNegative: "#DC2626", // -10 to -6
            negative: "#F97316",          // -5 to -2
            neutral: "#94A3B8",           // -1.9 to +1.9
            positive: "#22C55E",          // +2 to +5
            extremelyPositive: "#2E5BFF"  // +6 to +10
        },
        source: {
            rbi: "#2563EB",
            sebi: "#16A34A",
            nse: "#2E5BFF",
            bse: "#0F766E",
            bloomberg: "#F59E0B",
            reuters: "#DC2626",
            cnbc: "#06B6D4",
            exchangeFiling: "#8B5CF6",
            government: "#6366F1",
            companyPr: "#94A3B8"
        },
        categories: {
            macro: "#2E5BFF",
            earnings: "#22C55E",
            policy: "#4F46E5",
            corporate: "#8B5CF6",
            geopolitical: "#DC2626",
            commodities: "#F59E0B",
            currency: "#06B6D4",
            bonds: "#64748B",
            global: "#0F766E",
            economy: "#0284C7"
        },
        assets: {
            nifty: "#2E5BFF",
            banknifty: "#16A34A",
            finnifty: "#06B6D4",
            midcap: "#8B5CF6",
            auto: "#EA580C",
            it: "#2563EB",
            fmcg: "#059669",
            pharma: "#0EA5E9",
            metal: "#64748B",
            energy: "#F59E0B",
            psu: "#4F46E5",
            realty: "#7C3AED"
        },
        aiClassification: {
            opportunity: "#22C55E",
            risk: "#DC2626",
            watchlist: "#F59E0B",
            informational: "#2E5BFF",
            ignorable: "#94A3B8"
        }
    }
};

/**
 * Helper utility to get a color based on a raw value mapping
 */
export const getColorByScore = (score, maxScore = 100) => {
    const val = Number(score);
    if (isNaN(val)) return PRAXIS_COLORS.status5.balanced;
    
    // Convert to percentage internally for standard 0-100 logic
    const pct = maxScore !== 100 ? (val / maxScore) * 100 : val;

    if (pct <= 20) return PRAXIS_COLORS.status5.poor;
    if (pct <= 40) return PRAXIS_COLORS.status5.weak;
    if (pct <= 60) return PRAXIS_COLORS.status5.balanced;
    if (pct <= 80) return PRAXIS_COLORS.status5.strong;
    return PRAXIS_COLORS.status5.exceptional;
};
