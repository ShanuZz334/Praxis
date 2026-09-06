/**
 * @file positionSizingEngine.js
 * @purpose Institutional-grade position sizing for the chart drawing tools.
 *
 * Implements:
 *  1. Fixed Fractional Sizing  — risk a fixed % of capital per trade
 *  2. Kelly Criterion          — cross-check advisory (Half-Kelly for safety)
 *  3. Expected Value (EV)      — measures edge per trade in Rs
 *  4. Max Exposure Breaker     — caps qty so no single trade > 5% of capital
 *
 * Capital is sourced from localStorage key 'praxis_capital' (written by WalletPage).
 * Risk % is sourced from 'praxis_risk_pct' (stored as %, e.g. "1" = 1%).
 * Win rate is sourced from 'praxis_win_rate' (stored as decimal, e.g. "0.52").
 */

const DEFAULT_CAPITAL   = 500000;   // Rs 5,00,000 fallback
const DEFAULT_RISK_PCT  = 0.01;     // 1% per trade — institutional standard
const DEFAULT_WIN_RATE  = 0.50;     // 50% neutral assumption
const MAX_EXPOSURE_PCT  = 0.05;     // 5% max single-trade gross exposure

/** Read live portfolio capital from localStorage (written by WalletPage). */
export function getPortfolioCapital() {
    try {
        const stored = localStorage.getItem('praxis_capital');
        if (stored) {
            const val = parseFloat(stored);
            if (!isNaN(val) && val > 0) return val;
        }
    } catch {}
    return DEFAULT_CAPITAL;
}

/** Read configured risk % per trade (stored as %, e.g. "1" means 1%). */
export function getRiskPct() {
    try {
        const stored = localStorage.getItem('praxis_risk_pct');
        if (stored) {
            const val = parseFloat(stored);
            if (!isNaN(val) && val > 0 && val <= 5) return val / 100;
        }
    } catch {}
    return DEFAULT_RISK_PCT;
}

/** Read win rate from localStorage (set by journal stats in WalletPage). */
export function getWinRate() {
    try {
        const stored = localStorage.getItem('praxis_win_rate');
        if (stored) {
            const val = parseFloat(stored);
            if (!isNaN(val)) {
                if (val > 0 && val <= 1)   return val;
                if (val > 1 && val <= 100) return val / 100;
            }
        }
    } catch {}
    return DEFAULT_WIN_RATE;
}


/** Read Swing TP1 multiplier (default 2R). */
export function getSwingTP1R() {
    try {
        const v = parseFloat(localStorage.getItem('praxis_swing_tp1'));
        if (!isNaN(v) && v > 0) return v;
    } catch {}
    return 2.0;
}

/** Read Swing TP2 multiplier (default 3R). */
export function getSwingTP2R() {
    try {
        const v = parseFloat(localStorage.getItem('praxis_swing_tp2'));
        if (!isNaN(v) && v > 0) return v;
    } catch {}
    return 3.0;
}

/** Read Scalp partial exit fraction (default 0.5 = 50%). */
export function getScalpPartialFraction() {
    try {
        const v = parseFloat(localStorage.getItem('praxis_scalp_partial'));
        if (!isNaN(v) && v > 0 && v < 1) return v;
    } catch {}
    return 0.5;
}

/** Read Scalp full exit multiplier (default 1.5R). */
export function getScalpTP() {
    try {
        const v = parseFloat(localStorage.getItem('praxis_scalp_tp'));
        if (!isNaN(v) && v > 0) return v;
    } catch {}
    return 1.5;
}
/**
 * Compute institutional position sizing.
 *
 * @param {Object} params
 * @param {number} params.entryPrice  — entry price
 * @param {number} params.stopPrice   — stop-loss price
 * @param {number} [params.rr=2.0]   — primary Reward:Risk ratio
 * @returns {Object|null}
 */
export function computePositionSize({ entryPrice, stopPrice, rr = 2.0 }) {
    const riskPerShare = Math.abs(entryPrice - stopPrice);
    if (riskPerShare === 0 || isNaN(riskPerShare)) return null;

    const capital    = getPortfolioCapital();
    const riskPct    = getRiskPct();
    const winRate    = getWinRate();
    const lossRate   = 1 - winRate;

    // 1. Fixed Fractional Position Sizing
    const riskAmount  = capital * riskPct;
    let   qty         = Math.floor(riskAmount / riskPerShare);

    // 2. Max Gross Exposure Circuit Breaker (5% of capital)
    const maxExposureQty = Math.floor((capital * MAX_EXPOSURE_PCT) / entryPrice);
    const isCapped       = qty > maxExposureQty && maxExposureQty > 0;
    if (isCapped) qty    = maxExposureQty;

    qty = Math.max(qty, 1);

    const actualRisk = qty * riskPerShare;

    // 3. Kelly Criterion (advisory, Half-Kelly for safety)
    const fullKelly     = Math.max(0, winRate - lossRate / rr);
    const halfKelly     = fullKelly / 2;
    const kellyRiskAmt  = Math.round(capital * halfKelly);

    // 4. Expected Value per trade
    const reward = qty * riskPerShare * rr;
    const ev     = Math.round(winRate * reward - lossRate * actualRisk);

    // Capital display label
    const capLabel = capital >= 100000
        ? 'Rs' + (capital / 100000).toFixed(1) + 'L'
        : 'Rs' + Math.round(capital / 1000) + 'K';

    return {
        qty,
        lossIfStopped:   Math.round(actualRisk),
        profitAtTarget:  Math.round(reward),
        capital,
        capLabel,
        riskPct,
        riskPctDisplay:  (riskPct * 100).toFixed(1),
        fullKellyPct:    (fullKelly  * 100).toFixed(1),
        halfKellyPct:    (halfKelly  * 100).toFixed(1),
        kellyRiskAmt,
        ev,
        evPositive:      ev > 0,
        isCapped,
        winRate,
        winRatePct:      Math.round(winRate * 100),
    };
}

