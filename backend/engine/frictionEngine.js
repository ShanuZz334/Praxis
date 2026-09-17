/**
 * @file frictionEngine.js
 * @purpose Execution Drag & Institutional Indian Market Friction Model (NSE/BSE).
 *
 * Implements the statutory taxes, exchange fees, and bid-ask slippage schedule:
 *   - STT (Securities Transaction Tax)
 *   - NSE Exchange Turnover Charges
 *   - SEBI Turnover Fees
 *   - Stamp Duty
 *   - GST (18% on turnover & brokerage fees)
 *   - Liquidity-adjusted Bid-Ask Slippage
 *
 * Checks if ensemble forecast edge exceeds friction:
 *   net_edge = gross_edge - friction_drag
 * If net_edge <= 0, signal is flagged as statistically unviable due to drag.
 */

// Statutory tax and fee rates on National Stock Exchange of India (NSE)
export const NSE_FEE_SCHEDULE = {
    DELIVERY: {
        stt_buy: 0.0010,         // 0.10%
        stt_sell: 0.0010,        // 0.10%
        exchange_charge: 0.0000297 * 2, // 0.00297% each side (~0.006% roundtrip)
        sebi_turnover: 0.000001 * 2,    // ₹10 / crore (~0.0002% roundtrip)
        stamp_duty: 0.00015,     // 0.015% on buy
        gst_rate: 0.18,          // 18% on exchange charges + sebi
        default_slippage: 0.0004 // 0.04% (4 bps) for liquid index/large-cap
    },
    INTRADAY: {
        stt_buy: 0.0,            // Zero on buy
        stt_sell: 0.00025,       // 0.025% on sell
        exchange_charge: 0.0000297 * 2, // 0.00297% each side
        sebi_turnover: 0.000001 * 2,
        stamp_duty: 0.00003,     // 0.003% on buy
        gst_rate: 0.18,
        default_slippage: 0.0003 // 0.03% (3 bps)
    }
};

/**
 * Determine if a timeframe represents intraday or delivery/swing holding.
 * @param {string} timeframe - '1minute', '5minute', '15minute', 'day', 'week'
 * @returns {'INTRADAY' | 'DELIVERY'}
 */
export function classifyExecutionMode(timeframe) {
    if (!timeframe) return 'DELIVERY';
    const s = String(timeframe).toLowerCase().trim();
    if (s === 'day' || s === '1d' || s === 'd' || s === 'week' || s === '1w' || s === 'w' || s === 'daily') {
        return 'DELIVERY';
    }
    return 'INTRADAY';
}

/**
 * Estimate slippage based on instrument type and liquidity.
 * @param {string} instrument - e.g. "NSE_INDEX|Nifty 50"
 * @param {string} mode - 'INTRADAY' | 'DELIVERY'
 * @returns {number} Slippage as a fraction (e.g. 0.0004 for 0.04%)
 */
export function estimateSlippage(instrument, mode) {
    const isIndex = instrument && instrument.includes('NSE_INDEX');
    const base = mode === 'DELIVERY' ? 0.0004 : 0.0003;
    // Indices have the tightest spreads in India (1-2 ticks)
    if (isIndex) return base;
    // Midcap / equity cash has slightly wider spreads
    return base * 1.5;
}

/**
 * Calculate total roundtrip friction as percentage of price.
 * 
 * @param {string} instrument 
 * @param {string} timeframe 
 * @returns {{
 *   mode: string,
 *   stt_pct: number,
 *   exchange_pct: number,
 *   stamp_pct: number,
 *   gst_pct: number,
 *   slippage_pct: number,
 *   total_friction_pct: number
 * }}
 */
export function calculateNseFriction(instrument, timeframe) {
    const mode = classifyExecutionMode(timeframe);
    const schedule = NSE_FEE_SCHEDULE[mode];
    const slippage = estimateSlippage(instrument, mode);

    const stt = schedule.stt_buy + schedule.stt_sell;
    const exchange = schedule.exchange_charge;
    const stamp = schedule.stamp_duty;
    const gst = (exchange + schedule.sebi_turnover) * schedule.gst_rate;
    const total = stt + exchange + stamp + gst + schedule.sebi_turnover + slippage;

    return {
        mode,
        stt_pct: Number((stt * 100).toFixed(4)),
        exchange_pct: Number((exchange * 100).toFixed(4)),
        stamp_pct: Number((stamp * 100).toFixed(4)),
        gst_pct: Number((gst * 100).toFixed(4)),
        slippage_pct: Number((slippage * 100).toFixed(4)),
        total_friction_pct: Number((total * 100).toFixed(4))
    };
}

/**
 * Evaluate the net tradeable edge of an ensemble forecast against roundtrip friction.
 * 
 * @param {object} params
 * @param {number} params.currentPrice - Current market price of the asset
 * @param {object} params.forecastQuantiles - { open, high, low, close: { q10, q25, q50, q75, q90 } }
 * @param {string} params.instrument - e.g. "NSE_INDEX|Nifty 50"
 * @param {string} params.timeframe - e.g. "day", "15minute"
 * 
 * @returns {{
 *   current_price: number,
 *   forecast_q50: number,
 *   direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
 *   gross_edge_pct: number,
 *   friction_drag_pct: number,
 *   net_edge_pct: number,
 *   tradeable_edge: boolean,
 *   break_even_price: number,
 *   reason: string,
 *   friction_breakdown: object
 * }}
 */
export function evaluateNetEdge({ currentPrice, forecastQuantiles, instrument, timeframe }) {
    if (!currentPrice || currentPrice <= 0 || !forecastQuantiles) {
        return {
            current_price: currentPrice || 0,
            forecast_q50: 0,
            direction: 'NEUTRAL',
            gross_edge_pct: 0,
            friction_drag_pct: 0,
            net_edge_pct: 0,
            tradeable_edge: false,
            break_even_price: currentPrice || 0,
            reason: 'Insufficient price or forecast data for edge evaluation',
            friction_breakdown: null
        };
    }

    // Extract close median (q50)
    let q50 = null;
    if (forecastQuantiles.close && typeof forecastQuantiles.close === 'object') {
        q50 = Number(forecastQuantiles.close.q50);
    } else if (forecastQuantiles.q50_c !== undefined) {
        q50 = Number(forecastQuantiles.q50_c);
    } else if (forecastQuantiles.q50 !== undefined) {
        q50 = Number(forecastQuantiles.q50);
    }

    if (!q50 || isNaN(q50)) {
        return {
            current_price: currentPrice,
            forecast_q50: 0,
            direction: 'NEUTRAL',
            gross_edge_pct: 0,
            friction_drag_pct: 0,
            net_edge_pct: 0,
            tradeable_edge: false,
            break_even_price: currentPrice,
            reason: 'Could not extract median (q50) from forecast quantiles',
            friction_breakdown: null
        };
    }

    // Compute gross directional move
    const priceDiff = q50 - currentPrice;
    const grossEdgePct = Number(((Math.abs(priceDiff) / currentPrice) * 100).toFixed(4));
    const direction = priceDiff > (currentPrice * 0.0005) ? 'BULLISH'
                    : priceDiff < -(currentPrice * 0.0005) ? 'BEARISH'
                    : 'NEUTRAL';

    // Compute roundtrip friction
    const friction = calculateNseFriction(instrument, timeframe);
    const frictionDragPct = friction.total_friction_pct;
    const netEdgePct = Number((grossEdgePct - frictionDragPct).toFixed(4));
    const isTradeable = netEdgePct > 0 && direction !== 'NEUTRAL';

    // Compute break-even price
    const breakEvenPrice = direction === 'BULLISH'
        ? Number((currentPrice * (1 + frictionDragPct / 100)).toFixed(2))
        : Number((currentPrice * (1 - frictionDragPct / 100)).toFixed(2));

    let reason;
    if (direction === 'NEUTRAL') {
        reason = `Forecast median (${q50.toFixed(2)}) is flat relative to current price (${currentPrice.toFixed(2)}). Zero directional edge.`;
    } else if (!isTradeable) {
        reason = `Turnover Drag Penalty: Expected ${direction.toLowerCase()} move (+${grossEdgePct}%) is smaller than roundtrip friction (${frictionDragPct}%). Trade is statistically negative-EV.`;
    } else {
        reason = `Positive Expected Edge: Net alpha of +${netEdgePct}% after accounting for ${frictionDragPct}% roundtrip friction (STT, exchange, slippage).`;
    }

    return {
        current_price: currentPrice,
        forecast_q50: Number(q50.toFixed(2)),
        direction,
        gross_edge_pct: grossEdgePct,
        friction_drag_pct: frictionDragPct,
        net_edge_pct: netEdgePct,
        tradeable_edge: isTradeable,
        break_even_price: breakEvenPrice,
        reason,
        friction_breakdown: friction
    };
}
