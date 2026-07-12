/**
 * Industry-Grade Black-Scholes Engine for Options Greeks
 *
 * Implements the full Black-Scholes-Merton model with:
 *  - High-precision Normal CDF (Abramowitz & Stegun 26.2.17, max error 7.5e-8)
 *  - Robust edge-case guards (zero IV, expiry today, deep OTM/ITM)
 *  - Correct annualized → daily theta conversion
 *  - Proper vega scaling (per 1% IV move)
 *
 * Priority order at runtime:
 *   1. Live Upstox WebSocket greeks (data.optionGreeks) — always preferred
 *   2. B-S calculation using Upstox live IV (data.iv) — when greeks are missing
 *   3. B-S calculation using chain IV — on initial load
 */

// ─── High-Precision Normal CDF ────────────────────────────────────────────────
// Abramowitz & Stegun approximation 26.2.17 — max absolute error ≤ 7.5×10⁻⁸
function cnd(x) {
    if (x < -10) return 0;
    if (x > 10) return 1;

    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);

    const p = 0.2316419;
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;

    const t = 1.0 / (1.0 + p * absX);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;

    const poly = b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5;
    const pdf  = Math.exp(-0.5 * absX * absX) / Math.sqrt(2 * Math.PI);
    const result = 1.0 - pdf * poly;

    return sign === 1 ? result : 1.0 - result;
}

// ─── Normal PDF ───────────────────────────────────────────────────────────────
function nd(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ─── Safe log helper ──────────────────────────────────────────────────────────
function safeLog(S, K) {
    if (S <= 0 || K <= 0) return 0;
    return Math.log(S / K);
}

// ─── Main Greeks Calculator ───────────────────────────────────────────────────
/**
 * Calculate Black-Scholes Greeks.
 *
 * @param {number} S     - Underlying spot price (e.g. 24207)
 * @param {number} K     - Strike price (e.g. 24200)
 * @param {number} T     - Time to expiry in YEARS (e.g. 2/365 for 2 days)
 * @param {number} r     - Risk-free rate as decimal (e.g. 0.07 for 7%)
 * @param {number} v     - Implied Volatility as decimal (e.g. 0.1504 for 15.04%)
 * @param {string} type  - 'call' or 'put'
 * @returns {{ delta, gamma, theta, vega }}
 */
export function calculateGreeks(S, K, T, r, v, type = 'call') {
    // ── Guard: Missing or invalid inputs ───────────────────────────────────────
    if (!S || !K || S <= 0 || K <= 0) {
        return { delta: 0, gamma: 0, theta: 0, vega: 0 };
    }

    // ── Guard: Expiry passed or IV is zero ────────────────────────────────────
    if (T <= 0 || v <= 0) {
        // Intrinsic-value delta at expiry
        if (type === 'call') return { delta: S > K ? 1 : 0, gamma: 0, theta: 0, vega: 0 };
        return { delta: S < K ? -1 : 0, gamma: 0, theta: 0, vega: 0 };
    }

    // ── Guard: IV sanity clamp (0.1% – 500%) ─────────────────────────────────
    const vol = Math.max(0.001, Math.min(5.0, v));

    // ── Guard: T sanity clamp (minimum 30 seconds in years) ──────────────────
    const t = Math.max(30 / (365 * 24 * 3600), T);

    const sqrtT = Math.sqrt(t);
    const d1 = (safeLog(S, K) + (r + 0.5 * vol * vol) * t) / (vol * sqrtT);
    const d2 = d1 - vol * sqrtT;

    const nd1  = nd(d1);
    const cnd1 = cnd(d1);
    const cnd2 = cnd(d2);

    // ── Greeks ────────────────────────────────────────────────────────────────
    let delta, theta;
    const gamma = nd1 / (S * vol * sqrtT);
    // Vega: change in option value per 1% move in IV (divide by 100)
    const vega  = (S * nd1 * sqrtT) / 100;

    if (type === 'call') {
        delta = cnd1;
        // Theta: annualized → divide by 365 for daily decay
        theta = (
            -(S * nd1 * vol) / (2 * sqrtT)
            - r * K * Math.exp(-r * t) * cnd2
        ) / 365;
    } else {
        delta = cnd1 - 1;
        theta = (
            -(S * nd1 * vol) / (2 * sqrtT)
            + r * K * Math.exp(-r * t) * cnd(-d2)
        ) / 365;
    }

    // ── Final rounding ────────────────────────────────────────────────────────
    return {
        delta: parseFloat(delta.toFixed(4)),
        gamma: parseFloat(gamma.toFixed(6)),
        theta: parseFloat(theta.toFixed(2)),
        vega:  parseFloat(vega.toFixed(4)),
    };
}

// ─── Time To Expiry Helper ────────────────────────────────────────────────────
/**
 * Compute time to expiry in years from an expiry date string.
 * Returns a minimum of 0.5/365 (half a trading day) to avoid zero-time artifacts.
 *
 * @param {string} expiryDateStr - e.g. "2026-07-14"
 * @returns {number} T in years
 */
export function timeToExpiry(expiryDateStr) {
    if (!expiryDateStr) return 1 / 365; // Default: 1 day

    try {
        const expiry = new Date(expiryDateStr);
        // Set to end of expiry day (3:30 PM IST = 10:00 UTC)
        expiry.setUTCHours(10, 0, 0, 0);

        const now = new Date();
        const diffMs = expiry - now;

        // Minimum half-day, maximum 3 years
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return Math.max(0.5 / 365, Math.min(diffDays / 365, 3.0));
    } catch {
        return 1 / 365;
    }
}

// ─── Greeks from Upstox live data (with B-S fallback) ────────────────────────
/**
 * Resolve greeks for a single option leg.
 * Priority: Upstox live greeks → B-S from live IV → B-S from fallback IV
 *
 * @param {object} upstoxGreeks    - data.optionGreeks from WebSocket
 * @param {number} upstoxIv        - data.iv from WebSocket (as percentage, e.g. 15.04)
 * @param {number} S               - spot price
 * @param {number} K               - strike
 * @param {number} T               - time to expiry in years
 * @param {string} type            - 'call' or 'put'
 * @param {number} [fallbackIv=15] - fallback IV % if nothing else is available
 */
export function resolveGreeks(upstoxGreeks, upstoxIv, S, K, T, type = 'call', fallbackIv = 15) {
    // 1. Prefer Upstox live greeks if they are non-zero
    if (
        upstoxGreeks &&
        (upstoxGreeks.delta !== 0 || upstoxGreeks.gamma !== 0)
    ) {
        return {
            delta: upstoxGreeks.delta ?? 0,
            gamma: upstoxGreeks.gamma ?? 0,
            theta: upstoxGreeks.theta ?? 0,
            vega:  upstoxGreeks.vega  ?? 0,
            iv:    upstoxIv ?? fallbackIv,
            source: 'live',
        };
    }

    // 2. Use live IV with B-S if greeks are zero but IV is available
    const iv = (upstoxIv && upstoxIv > 0) ? upstoxIv : fallbackIv;
    const vol = iv / 100.0; // Convert % to decimal

    const greeks = calculateGreeks(S, K, T, 0.07, vol, type);
    return {
        ...greeks,
        iv,
        source: 'calculated',
    };
}
