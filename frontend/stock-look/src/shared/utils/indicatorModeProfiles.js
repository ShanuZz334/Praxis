/**
 * @file indicatorModeProfiles.js
 * @purpose Institutional-grade indicator parameter profiles across trading modes:
 *          INTRADAY (Scalp/Day Trading), SWING (Multi-Day), and POSITIONAL (Macro/Multi-Week).
 * @date 2026-09-12
 */

export const INDICATOR_PROFILES = {
    intraday: {
        modeKey: 'intraday',
        label: 'Intraday',
        badge: 'INTRADAY',
        description: 'Optimized for high-frequency day scalping and session momentum',
        supertrend: {
            period: 7,
            multiplier: 2.0,
            label: 'Supertrend (7, 2)'
        },
        vwap: {
            anchor: 'daily',
            label: 'VWAP (Session D)'
        },
        ema: {
            fast: 5,
            slow: 13,
            label: 'EMA (5 / 13)'
        },
        cpr: {
            period: 'daily',
            label: 'Daily CPR'
        },
        adaptiveBands: {
            mode: 'scalp',
            label: 'Adaptive BB (Scalp)'
        },
        psar: {
            step: 0.03,
            maxStep: 0.25,
            label: 'PSAR (0.03, 0.25)'
        },
        ichimoku: {
            conversion: 7,
            base: 22,
            span: 44,
            displacement: 22,
            label: 'Ichimoku (7, 22, 44)'
        },
        macd: {
            fast: 6,
            slow: 13,
            signal: 5,
            label: 'MACD (6, 13, 5)'
        },
        rsi: {
            period: 9,
            overbought: 75,
            oversold: 25,
            label: 'RSI (9) [25/75]'
        },
        anchoredVwap: {
            lookback: 75,
            label: 'AVWAP (Session Peak)'
        },
        autoFib: {
            lookback: 75,
            label: 'Auto Fib (75 Bars)'
        }
    },

    swing: {
        modeKey: 'swing',
        label: 'Swing',
        badge: 'SWING',
        description: 'Benchmark institutional parameters for multi-day swing holding',
        supertrend: {
            period: 10,
            multiplier: 3.0,
            label: 'Supertrend (10, 3)'
        },
        vwap: {
            anchor: 'weekly',
            label: 'VWAP (Weekly W)'
        },
        ema: {
            fast: 9,
            slow: 21,
            label: 'EMA (9 / 21)'
        },
        cpr: {
            period: 'weekly',
            label: 'Weekly CPR'
        },
        adaptiveBands: {
            mode: 'swing',
            label: 'Adaptive KC (Swing)'
        },
        psar: {
            step: 0.02,
            maxStep: 0.20,
            label: 'PSAR (0.02, 0.20)'
        },
        ichimoku: {
            conversion: 9,
            base: 26,
            span: 52,
            displacement: 26,
            label: 'Ichimoku (9, 26, 52)'
        },
        macd: {
            fast: 12,
            slow: 26,
            signal: 9,
            label: 'MACD (12, 26, 9)'
        },
        rsi: {
            period: 14,
            overbought: 70,
            oversold: 30,
            label: 'RSI (14) [30/70]'
        },
        anchoredVwap: {
            lookback: 250,
            label: 'AVWAP (Swing Peak)'
        },
        autoFib: {
            lookback: 200,
            label: 'Auto Fib (200 Bars)'
        }
    },

    positional: {
        modeKey: 'positional',
        label: 'Positional',
        badge: 'POSITIONAL',
        description: 'Macro trend following with wide buffers for multi-week holding',
        supertrend: {
            period: 20,
            multiplier: 4.0,
            label: 'Supertrend (20, 4)'
        },
        vwap: {
            anchor: 'monthly',
            label: 'VWAP (Monthly M)'
        },
        ema: {
            fast: 20,
            slow: 50,
            label: 'EMA (20 / 50)'
        },
        cpr: {
            period: 'monthly',
            label: 'Monthly CPR'
        },
        adaptiveBands: {
            mode: 'positional',
            label: 'Adaptive DC (Positional)'
        },
        psar: {
            step: 0.01,
            maxStep: 0.15,
            label: 'PSAR (0.01, 0.15)'
        },
        ichimoku: {
            conversion: 18,
            base: 52,
            span: 104,
            displacement: 52,
            label: 'Ichimoku (18, 52, 104)'
        },
        macd: {
            fast: 19,
            slow: 39,
            signal: 14,
            label: 'MACD (19, 39, 14)'
        },
        rsi: {
            period: 21,
            overbought: 65,
            oversold: 35,
            label: 'RSI (21) [35/65]'
        },
        anchoredVwap: {
            lookback: null,
            label: 'AVWAP (Macro Peak)'
        },
        autoFib: {
            lookback: null,
            label: 'Auto Fib (Macro)'
        }
    }
};

/**
 * Returns the indicator profiles object for the given trading mode.
 * Falls back to 'swing' if mode is unrecognised.
 *
 * @param {string} [mode='swing'] - 'intraday' | 'swing' | 'positional'
 * @returns {typeof INDICATOR_PROFILES.swing}
 */
export function getIndicatorProfiles(mode) {
    if (!mode) return INDICATOR_PROFILES.swing;
    const key = String(mode).toLowerCase();
    return INDICATOR_PROFILES[key] || INDICATOR_PROFILES.swing;
}
