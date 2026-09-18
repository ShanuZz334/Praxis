/**
 * @file customIndicatorRegistry.js
 * @purpose Local storage persistence layer and specification engine for Praxis Dynamic Indicators (v2 Institutional).
 * Manages drafts, approved production indicators, 3-mode configurations (Intraday, Swing, Positional),
 * and provides full-fledged AI prompt templates for generating custom indicators.
 * @date 2026-09-17
 */

const STORAGE_KEY = 'praxis_custom_indicators';
const STORAGE_INIT_KEY = 'praxis_custom_indicators_initialized';
const CUSTOM_EVENT_NAME = 'praxis_custom_indicators_changed';
const STRATEGY_STORAGE_KEY = 'praxis_strategies';
const STRATEGY_EVENT_NAME = 'praxis_strategies_changed';

/**
 * Cascade cleans any deleted indicator IDs from saved strategy rules in localStorage.
 * Prevents orphan rules from persisting inside saved strategy definitions.
 * @param {string|string[]} deletedIds 
 */
function cascadeCleanStrategies(deletedIds) {
    if (typeof localStorage === 'undefined') return;
    const ids = Array.isArray(deletedIds) ? deletedIds : [deletedIds];
    if (ids.length === 0) return;

    try {
        const raw = localStorage.getItem(STRATEGY_STORAGE_KEY);
        if (!raw) return;
        const strats = JSON.parse(raw);
        if (!Array.isArray(strats)) return;

        let changed = false;
        const cleanedStrats = strats.map(strat => {
            if (strat.rules && Array.isArray(strat.rules)) {
                const filteredRules = strat.rules.filter(r => !ids.includes(r.indicatorId));
                if (filteredRules.length !== strat.rules.length) {
                    changed = true;
                    return { ...strat, rules: filteredRules, updatedAt: Date.now() };
                }
            }
            return strat;
        });

        if (changed) {
            localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(cleanedStrats));
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(STRATEGY_EVENT_NAME));
            }
        }
    } catch (e) {
        console.warn('[customIndicatorRegistry] Cascade clean strategies failed:', e);
    }
}

/**
 * Standard Turnkey Starter Templates (v2 Institutional Specification)
 * Each template includes:
 * 1. Metadata (name, nickname, description)
 * 2. 3-Mode Configurations (intraday, swing, positional)
 * 3. Baked Confluence Trigger Rules (checkBuy, checkSell)
 * 4. Mathematical Time-Series Calculation Function
 */
export const STARTER_TEMPLATES = [

    {
        name: "PNCO Confluence Oscillator",
        nickname: "PNCO",
        description: "Praxis Normalized Confluence Oscillator - Multi-domain momentum & trap filter",
        modes: {
            intraday: {
                period: 9,
                threshold: 18,
                exitTargetPct: 0.8,
                exitStopPct: 0.4,
                horizonBars: 8
            },
            swing: {
                period: 14,
                threshold: 25,
                exitTargetPct: 2.5,
                exitStopPct: 1.25,
                horizonBars: 14
            },
            positional: {
                period: 21,
                threshold: 35,
                exitTargetPct: 6.0,
                exitStopPct: 2.5,
                horizonBars: 28
            }
        },
        rules: [
            {
                id: "pnco_cross_zero",
                label: "Zero-Line Momentum Flip",
                description: "Fires when oscillator crosses above zero (Bull) or below zero (Bear)",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            },
            {
                id: "pnco_conviction_threshold",
                label: "Mode Conviction State",
                description: "Fires when oscillator exceeds the calibrated mode threshold",
                checkBuy: (curr, prev, modeParams) => curr >= (modeParams?.threshold ?? 25),
                checkSell: (curr, prev, modeParams) => curr <= -(modeParams?.threshold ?? 25)
            },
            {
                id: "pnco_rebound_trap",
                label: "Oversold Rebound Hook",
                description: "Fires when deeply oversold value hooks upwards",
                checkBuy: (curr, prev, modeParams) => prev <= -(modeParams?.threshold ?? 25) && curr > prev,
                checkSell: (curr, prev, modeParams) => prev >= (modeParams?.threshold ?? 25) && curr < prev
            }
        ],
        code: `function indicator() {
    return {
        name: "PNCO Confluence Oscillator",
        nickname: "PNCO",
        description: "Praxis Normalized Confluence Oscillator - Multi-domain momentum & trap filter",
        modes: {
            intraday: { period: 9, threshold: 18, exitTargetPct: 0.8, exitStopPct: 0.4, horizonBars: 8 },
            swing: { period: 14, threshold: 25, exitTargetPct: 2.5, exitStopPct: 1.25, horizonBars: 14 },
            positional: { period: 21, threshold: 35, exitTargetPct: 6.0, exitStopPct: 2.5, horizonBars: 28 }
        },
        rules: [
            {
                id: "pnco_cross_zero",
                label: "Zero-Line Momentum Flip",
                description: "Fires when oscillator crosses above zero (Bull) or below zero (Bear)",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            },
            {
                id: "pnco_conviction_threshold",
                label: "Mode Conviction State",
                description: "Fires when oscillator exceeds the calibrated mode threshold",
                checkBuy: (curr, prev, modeParams) => curr >= (modeParams?.threshold ?? 25),
                checkSell: (curr, prev, modeParams) => curr <= -(modeParams?.threshold ?? 25)
            },
            {
                id: "pnco_rebound_trap",
                label: "Oversold Rebound Hook",
                description: "Fires when deeply oversold value hooks upwards",
                checkBuy: (curr, prev, modeParams) => prev <= -(modeParams?.threshold ?? 25) && curr > prev,
                checkSell: (curr, prev, modeParams) => prev >= (modeParams?.threshold ?? 25) && curr < prev
            }
        ],
        calculate: function(candles, modeParams = {}) {
            if (!candles || candles.length < 15) return [];
            const period = modeParams.period || 14;

            function calcEMA(vals, p) {
                const k = 2 / (p + 1);
                const res = new Array(vals.length).fill(null);
                let sum = 0;
                for (let i = 0; i < p; i++) sum += vals[i];
                let ema = sum / p;
                res[p - 1] = ema;
                for (let i = p; i < vals.length; i++) {
                    ema = (vals[i] - ema) * k + ema;
                    res[i] = ema;
                }
                return res;
            }

            const closes = candles.map(c => c.close);
            const rsi = [];
            let gains = 0, losses = 0;
            for (let i = 1; i <= period && i < closes.length; i++) {
                const d = closes[i] - closes[i - 1];
                if (d >= 0) gains += d; else losses -= d;
            }
            let avgG = gains / period, avgL = losses / period;
            for (let i = 0; i < closes.length; i++) {
                if (i < period) { rsi.push(50); continue; }
                const d = closes[i] - closes[i - 1];
                avgG = (avgG * (period - 1) + (d > 0 ? d : 0)) / period;
                avgL = (avgL * (period - 1) + (d < 0 ? -d : 0)) / period;
                const rs = avgL === 0 ? 100 : avgG / avgL;
                rsi.push(100 - (100 / (1 + rs)));
            }

            const emaFast = calcEMA(closes, Math.max(5, Math.round(period * 0.85)));
            const emaSlow = calcEMA(closes, Math.max(12, Math.round(period * 1.85)));
            const macd = emaFast.map((f, i) => (f != null && emaSlow[i] != null) ? f - emaSlow[i] : 0);

            return candles.map((c, i) => {
                const rsiCentered = ((rsi[i] || 50) - 50) * 2;
                const macdVal = macd[i] || 0;
                const norm = (rsiCentered * 0.6) + (Math.max(-50, Math.min(50, macdVal)) * 0.8);
                return {
                    time: c.time,
                    value: parseFloat(Math.max(-100, Math.min(100, norm)).toFixed(2))
                };
            });
        }
    };
}`
    },
    {
        name: "AAVB Adaptive Volatility Stretch",
        nickname: "AAVB",
        description: "Adaptive Volatility Bands Stretch - Normalizes price stretch relative to dynamic envelope",
        modes: {
            intraday: { period: 10, threshold: 12, exitTargetPct: 0.7, exitStopPct: 0.35, horizonBars: 6 },
            swing: { period: 20, threshold: 15, exitTargetPct: 2.2, exitStopPct: 1.1, horizonBars: 12 },
            positional: { period: 50, threshold: 22, exitTargetPct: 5.5, exitStopPct: 2.2, horizonBars: 24 }
        },
        rules: [
            {
                id: "aavb_lower_rebound",
                label: "Lower Envelope Oversold Bounce",
                description: "Price touches or breaches lower stretch and rebounds",
                checkBuy: (curr, prev, modeParams) => prev <= -(modeParams?.threshold ?? 15) && curr > -(modeParams?.threshold ?? 15),
                checkSell: (curr, prev, modeParams) => prev >= (modeParams?.threshold ?? 15) && curr < (modeParams?.threshold ?? 15)
            },
            {
                id: "aavb_midline_breakout",
                label: "Dynamic Midline Expansion",
                description: "Oscillator breaks above zero into positive expansion territory",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            }
        ],
        code: `function indicator() {
    return {
        name: "AAVB Adaptive Volatility Stretch",
        nickname: "AAVB",
        description: "Adaptive Volatility Bands Stretch - Normalizes price stretch relative to dynamic envelope",
        modes: {
            intraday: { period: 10, threshold: 12, exitTargetPct: 0.7, exitStopPct: 0.35, horizonBars: 6 },
            swing: { period: 20, threshold: 15, exitTargetPct: 2.2, exitStopPct: 1.1, horizonBars: 12 },
            positional: { period: 50, threshold: 22, exitTargetPct: 5.5, exitStopPct: 2.2, horizonBars: 24 }
        },
        rules: [
            {
                id: "aavb_lower_rebound",
                label: "Lower Envelope Oversold Bounce",
                description: "Price touches or breaches lower stretch and rebounds",
                checkBuy: (curr, prev, modeParams) => prev <= -(modeParams?.threshold ?? 15) && curr > -(modeParams?.threshold ?? 15),
                checkSell: (curr, prev, modeParams) => prev >= (modeParams?.threshold ?? 15) && curr < (modeParams?.threshold ?? 15)
            },
            {
                id: "aavb_midline_breakout",
                label: "Dynamic Midline Expansion",
                description: "Oscillator breaks above zero into positive expansion territory",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            }
        ],
        calculate: function(candles, modeParams = {}) {
            if (!candles || candles.length < 20) return [];
            const period = modeParams.period || 20;
            return candles.map((c, i) => {
                if (i < period) return { time: c.time, value: 0 };
                let sum = 0;
                for (let j = 0; j < period; j++) sum += candles[i - j].close;
                const sma = sum / period;
                let variance = 0;
                for (let j = 0; j < period; j++) variance += Math.pow(candles[i - j].close - sma, 2);
                const stdDev = Math.sqrt(variance / period);
                const stretch = ((c.close - sma) / (stdDev || 1)) * 10;
                return { time: c.time, value: parseFloat(stretch.toFixed(2)) };
            });
        }
    };
}`
    },
    {
        name: "IFDI Institutional Flow Index",
        nickname: "IFDI",
        description: "Institutional Flow Divergence Index - Detects hidden institutional accumulation/distribution",
        modes: {
            intraday: { period: 8, threshold: 12, exitTargetPct: 0.75, exitStopPct: 0.35, horizonBars: 7 },
            swing: { period: 14, threshold: 20, exitTargetPct: 2.4, exitStopPct: 1.2, horizonBars: 14 },
            positional: { period: 28, threshold: 30, exitTargetPct: 5.8, exitStopPct: 2.4, horizonBars: 26 }
        },
        rules: [
            {
                id: "ifdi_accumulation_surge",
                label: "Institutional Accumulation Surge",
                description: "Flow score crosses above active mode accumulation threshold",
                checkBuy: (curr, prev, modeParams) => prev <= (modeParams?.threshold ?? 20) && curr > (modeParams?.threshold ?? 20),
                checkSell: (curr, prev, modeParams) => prev >= -(modeParams?.threshold ?? 20) && curr < -(modeParams?.threshold ?? 20)
            },
            {
                id: "ifdi_flow_positive",
                label: "Positive Flow Regime Active",
                description: "Institutional volume flow maintains sustained positive bias",
                checkBuy: (curr, prev) => curr > 0,
                checkSell: (curr, prev) => curr < 0
            }
        ],
        code: `function indicator() {
    return {
        name: "IFDI Institutional Flow Index",
        nickname: "IFDI",
        description: "Institutional Flow Divergence Index - Detects hidden institutional accumulation/distribution",
        modes: {
            intraday: { period: 8, threshold: 12, exitTargetPct: 0.75, exitStopPct: 0.35, horizonBars: 7 },
            swing: { period: 14, threshold: 20, exitTargetPct: 2.4, exitStopPct: 1.2, horizonBars: 14 },
            positional: { period: 28, threshold: 30, exitTargetPct: 5.8, exitStopPct: 2.4, horizonBars: 26 }
        },
        rules: [
            {
                id: "ifdi_accumulation_surge",
                label: "Institutional Accumulation Surge",
                description: "Flow score crosses above active mode accumulation threshold",
                checkBuy: (curr, prev, modeParams) => prev <= (modeParams?.threshold ?? 20) && curr > (modeParams?.threshold ?? 20),
                checkSell: (curr, prev, modeParams) => prev >= -(modeParams?.threshold ?? 20) && curr < -(modeParams?.threshold ?? 20)
            },
            {
                id: "ifdi_flow_positive",
                label: "Positive Flow Regime Active",
                description: "Institutional volume flow maintains sustained positive bias",
                checkBuy: (curr, prev) => curr > 0,
                checkSell: (curr, prev) => curr < 0
            }
        ],
        calculate: function(candles, modeParams = {}) {
            if (!candles || candles.length < 14) return [];
            const period = modeParams.period || 14;
            return candles.map((c, i) => {
                if (i < period) return { time: c.time, value: 0 };
                let flowSum = 0;
                for (let j = 0; j < period; j++) {
                    const bar = candles[i - j];
                    const range = (bar.high - bar.low) || 1;
                    const mfMultiplier = ((bar.close - bar.low) - (bar.high - bar.close)) / range;
                    flowSum += mfMultiplier * (bar.volume || 1);
                }
                const norm = Math.max(-100, Math.min(100, flowSum / 100000));
                return { time: c.time, value: parseFloat(norm.toFixed(2)) };
            });
        }
    };
}`
    },
    {
        name: "Momentum ROC Oscillator",
        nickname: "ROC",
        description: "Rate of Change (%) momentum oscillator with mode velocity scaling",
        modes: {
            intraday: { period: 5, threshold: 0.8, exitTargetPct: 0.6, exitStopPct: 0.3, horizonBars: 5 },
            swing: { period: 10, threshold: 1.5, exitTargetPct: 2.0, exitStopPct: 1.0, horizonBars: 10 },
            positional: { period: 20, threshold: 3.0, exitTargetPct: 5.0, exitStopPct: 2.0, horizonBars: 20 }
        },
        rules: [
            {
                id: "roc_momentum_surge",
                label: "Velocity Expansion Breakout",
                description: "Price velocity rate of change exceeds calibrated threshold",
                checkBuy: (curr, prev, modeParams) => prev <= (modeParams?.threshold ?? 1.5) && curr > (modeParams?.threshold ?? 1.5),
                checkSell: (curr, prev, modeParams) => prev >= -(modeParams?.threshold ?? 1.5) && curr < -(modeParams?.threshold ?? 1.5)
            },
            {
                id: "roc_zero_cross",
                label: "Directional Zero Cross",
                description: "ROC flips from negative to positive territory",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            }
        ],
        code: `function indicator() {
    return {
        name: "Momentum ROC Oscillator",
        nickname: "ROC",
        description: "Rate of Change (%) momentum oscillator with mode velocity scaling",
        modes: {
            intraday: { period: 5, threshold: 0.8, exitTargetPct: 0.6, exitStopPct: 0.3, horizonBars: 5 },
            swing: { period: 10, threshold: 1.5, exitTargetPct: 2.0, exitStopPct: 1.0, horizonBars: 10 },
            positional: { period: 20, threshold: 3.0, exitTargetPct: 5.0, exitStopPct: 2.0, horizonBars: 20 }
        },
        rules: [
            {
                id: "roc_momentum_surge",
                label: "Velocity Expansion Breakout",
                description: "Price velocity rate of change exceeds calibrated threshold",
                checkBuy: (curr, prev, modeParams) => prev <= (modeParams?.threshold ?? 1.5) && curr > (modeParams?.threshold ?? 1.5),
                checkSell: (curr, prev, modeParams) => prev >= -(modeParams?.threshold ?? 1.5) && curr < -(modeParams?.threshold ?? 1.5)
            },
            {
                id: "roc_zero_cross",
                label: "Directional Zero Cross",
                description: "ROC flips from negative to positive territory",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            }
        ],
        calculate: function(candles, modeParams = {}) {
            const period = modeParams.period || 10;
            return candles.map((c, i) => {
                if (i < period) return { time: c.time, value: 0 };
                const prev = candles[i - period];
                const roc = ((c.close - prev.close) / prev.close) * 100;
                return { time: c.time, value: parseFloat(roc.toFixed(2)) };
            });
        }
    };
}`
    },
    {
        name: "Adaptive Volume Spread Spike",
        nickname: "AVSS",
        description: "Volume Spread relative to moving average baseline with regime expansion",
        modes: {
            intraday: { period: 10, threshold: 1.8, exitTargetPct: 0.65, exitStopPct: 0.35, horizonBars: 6 },
            swing: { period: 20, threshold: 2.2, exitTargetPct: 2.4, exitStopPct: 1.2, horizonBars: 12 },
            positional: { period: 50, threshold: 2.8, exitTargetPct: 5.5, exitStopPct: 2.2, horizonBars: 24 }
        },
        rules: [
            {
                id: "avss_volume_spike",
                label: "Volume Spread Liquidity Spike",
                description: "Volume-adjusted range expansion crosses active threshold multiple",
                checkBuy: (curr, prev, modeParams, c, prevC) => curr >= (modeParams?.threshold ?? 2.2) && (c && prevC ? c.close >= prevC.close : true),
                checkSell: (curr, prev, modeParams, c, prevC) => curr >= (modeParams?.threshold ?? 2.2) && (c && prevC ? c.close < prevC.close : curr <= (modeParams?.threshold ?? 2.2) * 0.5)
            }
        ],
        code: `function indicator() {
    return {
        name: "Adaptive Volume Spread Spike",
        nickname: "AVSS",
        description: "Volume Spread relative to moving average baseline with regime expansion",
        modes: {
            intraday: { period: 10, threshold: 1.8, exitTargetPct: 0.65, exitStopPct: 0.35, horizonBars: 6 },
            swing: { period: 20, threshold: 2.2, exitTargetPct: 2.4, exitStopPct: 1.2, horizonBars: 12 },
            positional: { period: 50, threshold: 2.8, exitTargetPct: 5.5, exitStopPct: 2.2, horizonBars: 24 }
        },
        rules: [
            {
                id: "avss_volume_spike",
                label: "Volume Spread Liquidity Spike",
                description: "Volume-adjusted range expansion crosses active threshold multiple",
                checkBuy: (curr, prev, modeParams, c, prevC) => curr >= (modeParams?.threshold ?? 2.2) && (c && prevC ? c.close >= prevC.close : true),
                checkSell: (curr, prev, modeParams, c, prevC) => curr >= (modeParams?.threshold ?? 2.2) && (c && prevC ? c.close < prevC.close : curr <= (modeParams?.threshold ?? 2.2) * 0.5)
            }
        ],
        calculate: function(candles, modeParams = {}) {
            const period = modeParams.period || 20;
            return candles.map((c, i) => {
                if (i < period) return { time: c.time, value: 0 };
                let sum = 0;
                for (let j = 1; j <= period; j++) sum += candles[i - j].volume;
                const avgVol = sum / period;
                const ratio = avgVol > 0 ? (c.volume / avgVol) : 1;
                const spread = ((c.high - c.low) / c.close) * 100;
                return { time: c.time, value: parseFloat((spread * ratio).toFixed(2)) };
            });
        }
    };
}`
    }
];

function notifyChange() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME));
    }
}

/**
 * Parses user-pasted code to extract metadata, 3-mode configurations, and baked rules.
 * Handles both v2 object format (`function indicator() { return { ... }; }`) and legacy function format.
 * @param {string} code 
 * @param {string} [activeMode='swing']
 * @returns {Object} Extracted indicator definition
 */
export function extractIndicatorDefinition(code, activeMode = 'swing') {
    if (!code || typeof code !== 'string') return null;

    try {
        let fn;
        if (/function\s+indicator\s*\(/.test(code)) {
            fn = new Function(`${code}\nreturn indicator();`);
        } else if (/^\s*return\b/.test(code)) {
            fn = new Function(code);
        } else {
            fn = new Function(`${code}\nif (typeof indicator === 'function') return indicator();\nreturn null;`);
        }

        const out = fn();
        if (out && typeof out === 'object' && !Array.isArray(out)) {
            return {
                isV2: true,
                name: out.name || 'Custom Indicator',
                nickname: (out.nickname || 'CUST').toUpperCase().slice(0, 5),
                description: out.description || 'Custom algorithmic model with baked rules',
                modes: out.modes || {
                    intraday: { period: 9, threshold: 20 },
                    swing: { period: 14, threshold: 25 },
                    positional: { period: 21, threshold: 35 }
                },
                rules: Array.isArray(out.rules) ? out.rules : [
                    {
                        id: 'default_cross',
                        label: 'Crosses Active Mode Threshold',
                        description: 'Triggers when value crosses mode threshold',
                        checkBuy: (curr, prev, m) => curr >= (m?.threshold ?? 0),
                        checkSell: (curr, prev, m) => curr <= -(m?.threshold ?? 0)
                    }
                ],
                calculate: typeof out.calculate === 'function' ? out.calculate : null,
                code: code
            };
        }
    } catch (e) {
        // Fallback or syntax error during extraction
    }

    // Legacy fallback
    return {
        isV2: false,
        name: 'Custom Indicator',
        nickname: 'CUST',
        description: 'Mathematical time-series indicator',
        modes: {
            intraday: { threshold: 20 },
            swing: { threshold: 25 },
            positional: { threshold: 35 }
        },
        rules: [
            {
                id: 'lab_cross_above',
                label: 'Value Crosses Above Threshold',
                description: 'Fires when value crosses above active threshold level'
            },
            {
                id: 'lab_cross_below',
                label: 'Value Crosses Below Threshold',
                description: 'Fires when value crosses below active threshold level'
            }
        ],
        code: code
    };
}

/**
 * Returns a standardized, institutional AI Prompt Template that the user can copy
 * and paste into ChatGPT, Claude, Gemini, or local models.
 * @returns {string} Prompt template markdown text
 */
export function getAiPromptTemplate() {
    return `# PRAXIS QUANTITATIVE PLATFORM - AI INDICATOR GENERATION PROMPT

You are an expert quantitative trading algorithm engineer designing custom technical indicators for the Praxis Quantitative Trading Platform.

### TRADER INSTRUCTIONS:
1. Review the trader's concept / formula in the "TRADER CONCEPT / IDEA" section below.
2. Implement the indicator adhering 100% strictly to the Praxis Dynamic Indicator Specification v2.
3. Output ONLY a valid JavaScript code block containing the self-contained \`function indicator() { ... }\` definition. No commentary, no external Markdown explanations.

================================================================================
>>> TRADER CONCEPT / IDEA (PASTE YOUR TRADING IDEA / FORMULA HERE) <<<
================================================================================
[TRADER: Replace this placeholder with your trading idea, oscillator formula, pine script code, or confluence concept.]
================================================================================

### ARCHITECTURAL RULES & CORE CONSTRAINTS:

1. METADATA:
   - name: Descriptive, institutional title (e.g. "Chande Adaptive Volatility Oscillator").
   - nickname: 2 to 5 capital letters (e.g. "CAVO", "FAMO", "PNCO").
   - description: 1-sentence summary explaining the quantitative rationale.

2. THREE DEDICATED TRADING HORIZONS (MANDATORY):
   Praxis strategies dynamically switch between 3 distinct trading horizons in real time:
   - "intraday": High responsiveness, fast lookback (e.g. 5-9 bars), tight exit target & stop (e.g. target 0.8%, stop 0.4%, hold 6-8 bars).
   - "swing": Balanced multi-day momentum, standard lookback (e.g. 14-21 bars), balanced exits (e.g. target 2.5%, stop 1.25%, hold 12-16 bars).
   - "positional": Macro multi-week regime smoothing, wide lookback (e.g. 28-50 bars), trend-following exits (e.g. target 6.0%, stop 2.5%, hold 25-35 bars).
   Every mode MUST specify calibrated parameters (e.g. period, threshold, exitTargetPct, exitStopPct, horizonBars).

3. BAKED CONFLUENCE TRIGGER RULES (ZERO-CLUTTER LAW):
   - Praxis NEVER uses manual input boxes on indicator cards.
   - All entry trigger conditions are baked directly into the indicator via pure Boolean functions:
     - checkBuy: (currVal, prevVal, modeParams, currCandle, prevCandle) => boolean
     - checkSell: (currVal, prevVal, modeParams, currCandle, prevCandle) => boolean
   - Must provide at least 2 distinct trigger conditions (e.g. Threshold Crossover, Zero-Line Flip, Extreme Exhaustion, Volatility Expansion).
   - Returning true signals a trade entry trigger for that bar; returning false holds cash.

4. SANDBOXED TIME-SERIES ENGINE:
   - calculate: function(candles, modeParams) receives:
     - candles: Array<{ time: number, open: number, high: number, low: number, close: number, volume: number }>
     - modeParams: Object (the calibrated parameter dictionary for the currently active horizon).
     - Returns: Array<{ time: number, value: number }> of identical length to candles.
   - Standard JavaScript primitives and Math functions only (Math.abs, Math.max, Math.min, Math.sqrt, Math.pow, Math.sin, etc.).
   - ZERO external imports (require, import, fetch, axios are strictly prohibited).
   - Strict NaN protection: Always use guards like isNaN(val) ? 0 : parseFloat(val.toFixed(2)).
   - Handle warm-up periods safely (return 0 for the first period bars).

### PRODUCTION TEMPLATE CODE STRUCTURE:

\`\`\`javascript
/**
 * PRAXIS DYNAMIC INDICATOR SPECIFICATION v2
 * @name [Indicator Full Name]
 * @nickname [2-5 Capital Letters e.g. VOLM]
 * @description [Brief institutional rationale and mathematical concept]
 */
function indicator() {
    return {
        // 1. Metadata
        name: "My Custom Oscillator",
        nickname: "MCO",
        description: "Multi-factor volatility-adjusted momentum oscillator with baked rules",

        // 2. Three Dedicated Mode Configurations (Intraday, Swing, Positional)
        modes: {
            intraday: {
                period: 7,
                threshold: 15,
                exitTargetPct: 0.8,
                exitStopPct: 0.4,
                horizonBars: 6
            },
            swing: {
                period: 14,
                threshold: 25,
                exitTargetPct: 2.5,
                exitStopPct: 1.25,
                horizonBars: 14
            },
            positional: {
                period: 28,
                threshold: 35,
                exitTargetPct: 6.0,
                exitStopPct: 2.5,
                horizonBars: 28
            }
        },

        // 3. Baked Confluence Trigger Rules
        rules: [
            {
                id: "main_threshold_cross",
                label: "Momentum Threshold Crossover",
                description: "Fires when oscillator crosses above +threshold (Buy) or below -threshold (Sell)",
                checkBuy: (curr, prev, modeParams) => prev <= modeParams.threshold && curr > modeParams.threshold,
                checkSell: (curr, prev, modeParams) => prev >= -modeParams.threshold && curr < -modeParams.threshold
            },
            {
                id: "zero_line_flip",
                label: "Zero-Line Regime Shift",
                description: "Fires when indicator crosses zero into positive or negative territory",
                checkBuy: (curr, prev) => prev <= 0 && curr > 0,
                checkSell: (curr, prev) => prev >= 0 && curr < 0
            }
        ],

        // 4. Mathematical Time-Series Calculation
        calculate: function(candles, modeParams = {}) {
            if (!candles || candles.length < 10) return [];
            const period = modeParams.period || 14;

            return candles.map((c, i) => {
                if (i < period) return { time: c.time, value: 0 };
                const prev = candles[i - period];
                const velocity = ((c.close - prev.close) / prev.close) * 100;
                return {
                    time: c.time,
                    value: isNaN(velocity) ? 0 : parseFloat(velocity.toFixed(2))
                };
            });
        }
    };
}
\`\`\`

Strictly output ONLY the code block above with your implemented algorithm based on the TRADER CONCEPT.`;
}

/**
 * Re-hydrates executable functions (checkBuy, checkSell, calculate) that may have been stripped by JSON.stringify
 * when persisted to localStorage.
 * @param {Object} ind 
 * @returns {Object} Hydrated indicator with callable functions
 */
export function hydrateIndicator(ind) {
    if (!ind || typeof ind !== 'object') return ind;
    const starter = STARTER_TEMPLATES.find(t => (ind.nickname && t.nickname === ind.nickname) || (ind.name && t.name === ind.name));
    let hydratedRules = ind.rules;
    let calculateFn = ind.calculate;

    if (ind.code) {
        try {
            const extracted = extractIndicatorDefinition(ind.code);
            if (extracted) {
                if (Array.isArray(extracted.rules) && extracted.rules.length > 0) {
                    hydratedRules = extracted.rules;
                }
                if (typeof extracted.calculate === 'function') {
                    calculateFn = extracted.calculate;
                }
            }
        } catch (e) {
            // fall back to starter if extraction fails
        }
    }

    if ((!hydratedRules || !hydratedRules.some(r => typeof r.checkBuy === 'function')) && starter) {
        hydratedRules = starter.rules;
    }
    if (!calculateFn && starter) {
        calculateFn = starter.calculate;
    }

    return {
        ...ind,
        rules: hydratedRules || ind.rules || [],
        calculate: calculateFn || ind.calculate || null
    };
}

/**
 * Retrieve all custom indicators from localStorage.
 * Respects user deletions: if user has initialized or cleared models, returns empty array without re-seeding.
 * @returns {Array} Array of custom indicator objects
 */
export function getCustomIndicators() {
    try {
        if (typeof localStorage === 'undefined') return [];
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(hydrateIndicator) : [];
        }
        
        // If user already initialized and subsequently cleared models, strictly honor clean slate
        const isInitialized = localStorage.getItem(STORAGE_INIT_KEY);
        if (isInitialized === 'true') {
            return [];
        }

        // First-time setup on fresh browser: initialize starter models as temporary drafts (promoted: false)
        const initial = STARTER_TEMPLATES.map((tmpl, idx) => ({
            id: `ind_${tmpl.nickname.toLowerCase()}_${idx}`,
            version: "2.0.0",
            category: "CUSTOM_LAB",
            isDetachable: true,
            name: tmpl.name,
            nickname: tmpl.nickname,
            description: tmpl.description,
            modes: tmpl.modes,
            rules: tmpl.rules,
            code: tmpl.code,
            promoted: false, // Starts as temporary draft! User can test, approve, or delete.
            createdAt: Date.now() - (1000 * 60 * (10 - idx)),
            updatedAt: Date.now(),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        return initial.map(hydrateIndicator);
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to read custom indicators', e);
        return [];
    }
}

/**
 * Save or update a custom indicator as a standardized, self-contained Detachable Struct.
 * Automatically parses code to ensure metadata, 3 modes, and baked rules are synchronized.
 * @param {Object} indicator 
 * @returns {Array} Updated array
 */
export function saveCustomIndicator(indicator) {
    try {
        const existing = getCustomIndicators();
        const id = indicator.id || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `custom_ind_${crypto.randomUUID()}`
            : `custom_ind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`);
        
        // Extract definition from code if provided
        const extracted = indicator.code ? extractIndicatorDefinition(indicator.code) : null;

        const updatedObj = {
            ...indicator,
            id,
            version: indicator.version || "2.0.0",
            category: "CUSTOM_LAB",
            isDetachable: true,
            name: indicator.name || extracted?.name || 'Custom Indicator',
            nickname: (indicator.nickname || extracted?.nickname || 'CUST').toUpperCase().slice(0, 5),
            description: indicator.description || extracted?.description || '',
            modes: indicator.modes || extracted?.modes || {
                intraday: { threshold: 20 },
                swing: { threshold: 25 },
                positional: { threshold: 35 }
            },
            rules: indicator.rules || extracted?.rules || [],
            promoted: indicator.promoted ?? false,
            updatedAt: Date.now(),
            createdAt: indicator.createdAt || Date.now(),
        };

        const filtered = existing.filter(item => item.id !== id);
        const newList = [updatedObj, ...filtered];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        notifyChange();
        return newList;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to save indicator', e);
        return getCustomIndicators();
    }
}

/**
 * Permanently delete and detach a custom indicator by ID.
 * Cascade-cleans any referencing rules from saved strategies across localStorage.
 * @param {string} id 
 * @returns {Array} Updated array
 */
export function deleteCustomIndicator(id) {
    try {
        const existing = getCustomIndicators();
        const filtered = existing.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        
        // Cascade purge orphan rules from saved strategies
        cascadeCleanStrategies(id);

        notifyChange();
        return filtered;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to delete indicator', e);
        return getCustomIndicators();
    }
}

/**
 * Bulk purge custom indicators (either drafts only or all).
 * Cascade-scrubs deleted IDs across all saved strategies.
 * @param {Object} options
 * @param {boolean} [options.draftsOnly=false]
 * @returns {Array} Updated array
 */
export function purgeAllCustomIndicators({ draftsOnly = false } = {}) {
    try {
        const existing = getCustomIndicators();
        const toDelete = draftsOnly ? existing.filter(i => !i.promoted) : existing;
        const toKeep = draftsOnly ? existing.filter(i => i.promoted) : [];
        
        const deletedIds = toDelete.map(i => i.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toKeep));
        localStorage.setItem(STORAGE_INIT_KEY, 'true');

        // Cascade purge
        cascadeCleanStrategies(deletedIds);

        notifyChange();
        return toKeep;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to purge custom indicators', e);
        return getCustomIndicators();
    }
}

/**
 * Explicitly load the 5 sample starter templates as drafts.
 * Available if user wants turnkey examples on demand.
 * @returns {Array} Updated indicator list
 */
export function loadSampleTemplates() {
    try {
        const existing = getCustomIndicators();
        const existingNicknames = new Set(existing.map(i => i.nickname.toUpperCase()));
        
        const newSamples = STARTER_TEMPLATES.filter(t => !existingNicknames.has(t.nickname.toUpperCase())).map((tmpl, idx) => ({
            id: `ind_${tmpl.nickname.toLowerCase()}_${Date.now()}_${idx}`,
            version: "2.0.0",
            category: "CUSTOM_LAB",
            isDetachable: true,
            name: tmpl.name,
            nickname: tmpl.nickname,
            description: tmpl.description,
            modes: tmpl.modes,
            rules: tmpl.rules,
            code: tmpl.code,
            promoted: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }));

        const combined = [...existing, ...newSamples];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        notifyChange();
        return combined;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to load sample templates', e);
        return getCustomIndicators();
    }
}

/**
 * Export a single indicator struct as a downloadable .json file.
 * Allows traders to back up their algorithmic code & rules before detaching/deleting.
 * @param {Object} indicator 
 */
export function exportIndicatorJson(indicator) {
    if (!indicator) return;
    try {
        const cleanStruct = {
            version: "2.0.0",
            category: "CUSTOM_LAB",
            isDetachable: true,
            name: indicator.name,
            nickname: indicator.nickname,
            description: indicator.description,
            modes: indicator.modes,
            rules: indicator.rules,
            code: indicator.code,
            exportedAt: new Date().toISOString(),
        };

        const jsonStr = JSON.stringify(cleanStruct, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(indicator.nickname || 'custom_indicator').toLowerCase()}_struct.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to export indicator JSON', e);
    }
}

/**
 * Bulk export all custom indicator structs as a single .json bundle.
 */
export function exportAllIndicatorsJson() {
    try {
        const list = getCustomIndicators();
        const bundle = {
            version: "2.0.0",
            exportedAt: new Date().toISOString(),
            indicators: list.map(i => ({
                version: "2.0.0",
                category: "CUSTOM_LAB",
                isDetachable: true,
                name: i.name,
                nickname: i.nickname,
                description: i.description,
                modes: i.modes,
                rules: i.rules,
                code: i.code,
                promoted: i.promoted,
            }))
        };

        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `praxis_all_custom_indicators_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to export all indicators', e);
    }
}

/**
 * Import a custom indicator struct from JSON string.
 * Supports single indicator structs, indicator bundles, or raw code blocks.
 * @param {string} jsonStr 
 * @returns {Object|null} The imported/saved indicator
 */
export function importIndicatorFromJson(jsonStr) {
    if (!jsonStr || typeof jsonStr !== 'string') return null;
    try {
        let parsed;
        try {
            parsed = JSON.parse(jsonStr.trim());
        } catch {
            // If user pasted raw JavaScript code instead of JSON struct
            parsed = { code: jsonStr.trim() };
        }

        // Case A: Bundle of multiple indicators
        if (parsed.indicators && Array.isArray(parsed.indicators)) {
            parsed.indicators.forEach(ind => saveCustomIndicator(ind));
            return parsed.indicators[0];
        }

        // Case B: Single indicator struct
        const saved = saveCustomIndicator(parsed);
        return saved[0] || null;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to import indicator JSON', e);
        throw e;
    }
}

/**
 * Mark a tested indicator as officially approved & promoted to Strategy Builder and Live Chart.
 * @param {string} id 
 * @returns {Object|null} The promoted indicator
 */
export function promoteCustomIndicator(id) {
    try {
        const existing = getCustomIndicators();
        let target = null;
        const updated = existing.map(item => {
            if (item.id === id) {
                target = {
                    ...item,
                    promoted: true,
                    promotedAt: Date.now(),
                };
                return target;
            }
            return item;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        notifyChange();
        return target;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to promote indicator', e);
        return null;
    }
}

/**
 * Demote / un-approve an indicator back to temporary draft status.
 * @param {string} id 
 * @returns {Object|null} The demoted indicator
 */
export function demoteCustomIndicator(id) {
    try {
        const existing = getCustomIndicators();
        let target = null;
        const updated = existing.map(item => {
            if (item.id === id) {
                target = {
                    ...item,
                    promoted: false,
                    promotedAt: null,
                };
                return target;
            }
            return item;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        notifyChange();
        return target;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to demote indicator', e);
        return null;
    }
}

/**
 * Restore starter models in v2 specification.
 * @returns {Array} Restored array
 */
export function resetToDefaultStarters() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_INIT_KEY);
        const restored = getCustomIndicators();
        notifyChange();
        return restored;
    } catch (e) {
        console.error('[customIndicatorRegistry] Failed to reset starters', e);
        return [];
    }
}

/**
 * Subscribe to indicator changes across tabs / components.
 * @param {Function} callback 
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToCustomIndicators(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback(getCustomIndicators());
    window.addEventListener(CUSTOM_EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
        window.removeEventListener(CUSTOM_EVENT_NAME, handler);
        window.removeEventListener('storage', handler);
    };
}

const COMPILED_FN_CACHE = new Map();

const FORBIDDEN_SECURITY_TOKENS = [
    'window',
    'document',
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'eval',
    'Function',
    'importScripts',
    'globalThis',
    'process',
    'require',
    'top',
    'parent',
    'cookie',
];

/**
 * Validates custom indicator script for security violations.
 * Blocks DOM access, network calls, token exfiltration, and arbitrary execution.
 */
export function validateIndicatorSecurity(code) {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Code must be a non-empty string.' };
    }
    // Strip comments and string literals to prevent false alarms in descriptive text
    const strippedCode = code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '')
        .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');

    for (const token of FORBIDDEN_SECURITY_TOKENS) {
        const regex = new RegExp(`\\b${token}\\b`);
        if (regex.test(strippedCode)) {
            return {
                valid: false,
                error: `Security Sandbox Violation: Disallowed token "${token}" detected. Custom indicators must be pure mathematical functions without DOM, storage, or network access.`,
            };
        }
    }
    return { valid: true };
}

/**
 * Compiles custom indicator JavaScript code into an executable sandboxed function.
 * @param {string} code 
 * @returns {Function|null}
 */
export function getCompiledLabFunction(code) {
    if (!code) return null;
    if (COMPILED_FN_CACHE.has(code)) {
        return COMPILED_FN_CACHE.get(code);
    }

    const secCheck = validateIndicatorSecurity(code);
    if (!secCheck.valid) {
        console.warn(`[customIndicatorRegistry] ${secCheck.error}`);
        return null;
    }

    try {
        let fn;
        const sandboxPreamble = `
            "use strict";
            const window = undefined;
            const document = undefined;
            const fetch = undefined;
            const XMLHttpRequest = undefined;
            const WebSocket = undefined;
            const localStorage = undefined;
            const sessionStorage = undefined;
            const globalThis = undefined;
        `;

        if (/function\s+indicator\s*\(/.test(code)) {
            fn = new Function('candles', 'activeMode', `
${sandboxPreamble}
${code}
const res = indicator(candles);
if (res && typeof res === 'object' && !Array.isArray(res)) {
    const params = (res.modes && res.modes[activeMode]) ? res.modes[activeMode] : (res.modes?.swing || {});
    if (typeof res.calculate === 'function') return res.calculate(candles, params);
    if (typeof res.indicator === 'function') return res.indicator(candles, params);
}
return Array.isArray(res) ? res : [];
`);
        } else if (/^\s*return\b/.test(code)) {
            fn = new Function('candles', 'activeMode', `${sandboxPreamble}\n${code}`);
        } else {
            fn = new Function('candles', 'activeMode', `
${sandboxPreamble}
${code}
if (typeof indicator === 'function') {
    const res = indicator(candles);
    if (res && typeof res === 'object' && !Array.isArray(res)) {
        const params = (res.modes && res.modes[activeMode]) ? res.modes[activeMode] : (res.modes?.swing || {});
        if (typeof res.calculate === 'function') return res.calculate(candles, params);
        if (typeof res.indicator === 'function') return res.indicator(candles, params);
    }
    return Array.isArray(res) ? res : [];
}
return [];
`);
        }
        if (COMPILED_FN_CACHE.size > 100) {
            const firstKey = COMPILED_FN_CACHE.keys().next().value;
            COMPILED_FN_CACHE.delete(firstKey);
        }
        COMPILED_FN_CACHE.set(code, fn);
        return fn;
    } catch (e) {
        console.warn('[customIndicatorRegistry] Compilation error in custom indicator code:', e);
        return null;
    }
}

/**
 * Evaluates a custom indicator's code against market candles in browser runtime.
 * @param {Array} candles 
 * @param {Object} indicatorObj 
 * @param {string} activeMode 
 * @returns {Array} Array of computed series objects or values
 */
export function evaluateCustomLabSeries(candles, indicatorObj, activeMode = 'swing') {
    if (!indicatorObj || !candles || candles.length === 0) return [];
    try {
        const mode = activeMode || 'swing';
        const modeParams = (indicatorObj.modes && indicatorObj.modes[mode]) 
            ? indicatorObj.modes[mode] 
            : (indicatorObj.modes?.swing || {});

        if (typeof indicatorObj.calculate === 'function') {
            return indicatorObj.calculate(candles, modeParams);
        }

        const code = indicatorObj.code;
        if (!code) return [];

        const fn = getCompiledLabFunction(code);
        if (!fn) return [];

        const output = fn(candles, mode);
        if (Array.isArray(output)) return output;
        return [];
    } catch (e) {
        console.warn(`[customIndicatorRegistry] Failed to compute custom indicator ${indicatorObj.name || indicatorObj.id}:`, e);
        return [];
    }
}


