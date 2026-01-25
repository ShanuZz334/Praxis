/**
 * optionsSimulator.js
 * -------------------
 * Simulates a realistic Options Chain for NIFTY/BANKNIFTY.
 * Generates:
 * - Real Greeks (Delta, Gamma, Theta, Vega) using Black-Scholes approx.
 * - Institutional OI Structure (Calls vs Puts walls).
 * - Implied Volatility Surface (Skew).
 * - "Cards" formatted for the dashboard grid.
 */

// CONSTANTS
const SPOT_PRICE = 22450.00; // Mock NIFTY Spot
const INTEREST_RATE = 0.07;  // 7% Risk Free
const DAYS_TO_EXPIRY = 2.5;  // 2.5 Days left
const ATM_IV = 13.5;         // 13.5% VIX/IV
export const TOTAL_OPTIONS_CREDITS = 120; // 12 cards * avg 10 credits

// HELPER: Cumulative Normal Distribution
function CND(x) {
    var a1 = 0.31938153, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
    var p = 0.2316419;
    var k = 1.0 / (1.0 + p * Math.abs(x));
    var y = 1.0 - (((((a5 * k + a4) * k) + a3) * k + a2) * k + a1) * k * Math.exp(-x * x / 2.0) / Math.sqrt(2 * Math.PI);
    return x < 0 ? 1.0 - y : y;
}

// HELPER: Black-Scholes Greeks
function calculateGreeks(S, K, T, r, v, type) {
    const d1 = (Math.log(S / K) + (r + (v * v) / 2.0) * T) / (v * Math.sqrt(T));
    const d2 = d1 - v * Math.sqrt(T);
    const nd1 = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-(d1 * d1) / 2);

    let delta, gamma, theta, vega;

    if (type === 'call') {
        delta = CND(d1);
        theta = (- (S * v * nd1) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * CND(d2)) / 365.0;
    } else {
        delta = CND(d1) - 1;
        theta = (- (S * v * nd1) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * CND(-d2)) / 365.0;
    }

    gamma = nd1 / (S * v * Math.sqrt(T));
    vega = (S * Math.sqrt(T) * nd1) / 100.0; // Per 1% Vol change

    return { delta, gamma, theta, vega };
}

// HELPER: Black-Scholes Price
function calculateBSPrice(S, K, T, r, v, type) {
    const d1 = (Math.log(S / K) + (r + (v * v) / 2.0) * T) / (v * Math.sqrt(T));
    const d2 = d1 - v * Math.sqrt(T);

    if (type === 'call') {
        return S * CND(d1) - K * Math.exp(-r * T) * CND(d2);
    } else {
        return K * Math.exp(-r * T) * CND(-d2) - S * CND(-d1);
    }
}

// GENERATOR: Generate Chain
let _seed = 9999;
function seededRandom() {
    const x = Math.sin(_seed++) * 10000;
    return x - Math.floor(x);
}

function generateOptionChain() {
    _seed = 9999; // Reset seed
    const strikes = [];
    const step = 50;
    const range = 1000; // +/- 1000 points
    const t_years = DAYS_TO_EXPIRY / 365.0;

    for (let K = SPOT_PRICE - range; K <= SPOT_PRICE + range; K += step) {
        // IV Skew: Puts typically have higher IV than Calls (Smirk)
        const dist = (K - SPOT_PRICE) / SPOT_PRICE;
        let skewIv = ATM_IV - (dist * 10); // Simple linear skew
        skewIv = Math.max(10, Math.min(30, skewIv)); // Clamp IV
        const vol = skewIv / 100.0;

        // Greeks
        const callGreeks = calculateGreeks(SPOT_PRICE, K, t_years, INTEREST_RATE, vol, 'call');
        const putGreeks = calculateGreeks(SPOT_PRICE, K, t_years, INTEREST_RATE, vol, 'put');

        // Prices (LTP Simulation)
        const callPrice = calculateBSPrice(SPOT_PRICE, K, t_years, INTEREST_RATE, vol, 'call');
        const putPrice = calculateBSPrice(SPOT_PRICE, K, t_years, INTEREST_RATE, vol, 'put');

        // OI Simulation (Walls at x000 and x500)
        let baseOI = 100000;
        if (K % 1000 === 0) baseOI *= 5; // Major Wall
        else if (K % 500 === 0) baseOI *= 2.5; // Minor Wall

        // Random noise
        const callOI = Math.round(baseOI * (seededRandom() * 0.5 + 0.8) * (K > SPOT_PRICE ? 1.2 : 0.6)); // More Calls OTM
        const putOI = Math.round(baseOI * (seededRandom() * 0.5 + 0.8) * (K < SPOT_PRICE ? 1.2 : 0.6));  // More Puts OTM

        // OI Change (Simulation)
        const callOIChg = Math.round(callOI * (seededRandom() * 0.2 - 0.05)); // -5% to +15%
        const putOIChg = Math.round(putOI * (seededRandom() * 0.2 - 0.05));

        // Volume Simulation (Proportional to OI)
        const callVol = Math.round(callOI * (seededRandom() * 0.5 + 0.2));
        const putVol = Math.round(putOI * (seededRandom() * 0.5 + 0.2));

        strikes.push({
            strike: K,
            iv: skewIv,
            call: { ...callGreeks, oi: callOI, oiChg: callOIChg, ltp: callPrice.toFixed(2), vol: callVol },
            put: { ...putGreeks, oi: putOI, oiChg: putOIChg, ltp: putPrice.toFixed(2), vol: putVol }
        });
    }
    return strikes;
}

// CALCULATOR: Aggregate Metrics
export function generateOptionsDashboardData() {
    const chain = generateOptionChain();

    /* --- 1. PCR & Max Pain --- */
    let totalCE = 0, totalPE = 0;
    let maxPainStrike = 0, minLoss = Infinity;

    // Max Pain Calc (Simplified)
    chain.forEach(s => {
        totalCE += s.call.oi;
        totalPE += s.put.oi;

        // Calc Loss at this strike for writers
        let loss = 0;
        chain.forEach(inner => {
            const diff = s.strike - inner.strike;
            if (diff > 0) loss += diff * inner.call.oi; // Call ITM
            if (diff < 0) loss += Math.abs(diff) * inner.put.oi; // Put ITM
        });
        if (loss < minLoss) { minLoss = loss; maxPainStrike = s.strike; }
    });

    const pcr = totalPE / (totalCE || 1);

    /* --- 2. Gamma Exposure (GEX) --- */
    // Net GEX = (Call Gamma * OI) - (Put Gamma * OI) * Spot (Simplified Proxy)
    let netGex = 0;
    chain.forEach(s => {
        netGex += (s.call.gamma * s.call.oi) - (s.put.gamma * s.put.oi);
    });
    // Normalize GEX somewhat for display
    const formattedGex = (netGex * SPOT_PRICE * 0.01).toFixed(2); // Million/Billion proxy

    /* --- 3. Net Delta (Directional Bias) --- */
    let netDelta = 0;
    chain.forEach(s => {
        netDelta += (s.call.delta * s.call.oi) + (s.put.delta * s.put.oi); // Put delta is negative
    });

    /* --- 4. Cards Generation --- */
    const cards = [
        // SECTION: OPEN INTEREST
        {
            id: 'max_pain',
            label: 'Max Pain',
            value: maxPainStrike,
            unit: '',
            change: '+100', // Mock
            interpretation: maxPainStrike > SPOT_PRICE ? 'Bullish Pull' : 'Bearish Drag',
            trend: maxPainStrike > SPOT_PRICE ? 'up' : 'down',
            normalized: maxPainStrike > SPOT_PRICE ? 0.7 : 0.3, // Score
            category: 'Open Interest',
            creditAllocation: 12
        },
        {
            id: 'pcr',
            label: 'PCR (Total)',
            value: pcr.toFixed(2),
            unit: 'x',
            change: '+0.05',
            interpretation: pcr > 1 ? 'Bullish Support' : 'Bearish Resist',
            trend: pcr > 1 ? 'up' : 'down',
            normalized: Math.min(1, pcr / 1.5),
            category: 'Open Interest',
            creditAllocation: 10
        },
        {
            id: 'call_wall',
            label: 'Call Wall',
            value: 23000, // Hardcoded for demo stability or find max OI
            unit: 'Strk',
            change: 'Firm',
            interpretation: 'Major Resistance',
            trend: 'neutral',
            normalized: 0.2, // Bearish factor
            category: 'Open Interest',
            creditAllocation: 10
        },
        {
            id: 'put_wall',
            label: 'Put Wall',
            value: 22000,
            unit: 'Strk',
            change: 'Strong',
            interpretation: 'Major Support',
            trend: 'up',
            normalized: 0.8, // Bullish factor
            category: 'Open Interest',
            creditAllocation: 10
        },

        // SECTION: GREEKS
        {
            id: 'net_delta',
            label: 'Net Delta',
            value: (netDelta / 100000).toFixed(2), // Scaled
            unit: 'M',
            change: '+12%',
            interpretation: netDelta > 0 ? 'Long Positioning' : 'Short Positioning',
            trend: netDelta > 0 ? 'up' : 'down',
            normalized: netDelta > 0 ? 0.8 : 0.2,
            category: 'Greeks',
            creditAllocation: 12
        },
        {
            id: 'net_gamma',
            label: 'Gamma Exposure',
            value: formattedGex,
            unit: '$Bn',
            change: '-5%',
            interpretation: parseFloat(formattedGex) > 0 ? 'Long Vol likely' : 'Short Vol',
            trend: parseFloat(formattedGex) > 0 ? 'up' : 'down',
            normalized: 0.6,
            category: 'Greeks',
            creditAllocation: 10
        },
        {
            id: 'theta_decay',
            label: 'Theta Decay',
            value: '-12.5',
            unit: 'Cr/Day',
            change: 'Accelerating',
            interpretation: 'Time decay working for writers',
            trend: 'down',
            normalized: 0.5,
            category: 'Greeks',
            creditAllocation: 8
        },
        {
            id: 'vega_risk',
            label: 'Vega Risk',
            value: 'Medium',
            unit: '',
            change: 'Stable',
            interpretation: 'Moderate sensitivity to IV spike',
            trend: 'neutral',
            normalized: 0.5,
            category: 'Greeks',
            creditAllocation: 8
        },

        // SECTION: VOLATILITY
        {
            id: 'atm_iv',
            label: 'ATM IV',
            value: ATM_IV.toFixed(2),
            unit: '%',
            change: '-0.5%',
            interpretation: 'Cooling Off',
            trend: 'down',
            normalized: 0.7, // Lower is often better for bulls (stability)
            category: 'Volatility',
            creditAllocation: 8
        },
        {
            id: 'iv_rank',
            label: 'IV Rank',
            value: '32',
            unit: '/100',
            change: '-2',
            interpretation: 'Low-Medium Vol Regime',
            trend: 'neutral',
            normalized: 0.6,
            category: 'Volatility',
            creditAllocation: 10
        },
        {
            id: 'iv_skew',
            label: 'IV Skew',
            value: '4.2%',
            unit: 'Put>Call',
            change: 'Steepening',
            interpretation: 'Hedging demand rising',
            trend: 'down', // Bearish sign
            normalized: 0.3,
            category: 'Volatility',
            creditAllocation: 12
        },
        {
            id: 'hv_iv_spread',
            label: 'HV-IV Spread',
            value: '+1.2',
            unit: 'pts',
            change: '',
            interpretation: 'Options fairly priced',
            trend: 'neutral',
            normalized: 0.5,
            category: 'Volatility',
            creditAllocation: 8
        }
    ];

    return {
        cards,
        chain, // Full chain for deep dives if needed
        metrics: {
            pcr,
            maxPain: maxPainStrike,
            netDelta,
            spot: SPOT_PRICE
        }
    };
}
