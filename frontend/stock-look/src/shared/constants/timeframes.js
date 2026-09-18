/**
 * @file timeframes.js
 * @purpose Canonical timeframe constants and bidirectional normalizers across Praxis.
 * Standardizes conversions between Upstox API tokens, UI labels, and strategy engine intervals.
 */

export const UPSTOX_TIMEFRAMES = {
    ONE_MINUTE: '1minute',
    FIVE_MINUTE: '5minute',
    FIFTEEN_MINUTE: '15minute',
    THIRTY_MINUTE: '30minute',
    ONE_HOUR: '1hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month'
};

export const UI_TIMEFRAMES = {
    '1minute': '1m',
    '5minute': '5m',
    '15minute': '15m',
    '30minute': '30m',
    '1hour': '1h',
    'day': 'Daily',
    'week': '1W',
    'month': '1M'
};

export const TIMEFRAME_MINUTES = {
    '1minute': 1,
    '5minute': 5,
    '15minute': 15,
    '30minute': 30,
    '1hour': 60,
    'day': 375, // Indian market trading day is 375 minutes (9:15 AM - 3:30 PM)
    'week': 1875,
    'month': 7500
};

/**
 * Normalizes any timeframe string variant to the canonical Upstox API token.
 * 
 * @param {string} tf - e.g. '1m', '15M', '15min', 'day', '1D', 'daily'
 * @returns {string} Canonical Upstox token: '1minute' | '5minute' | '15minute' | '30minute' | '1hour' | 'day' | 'week' | 'month'
 */
export function toUpstoxTimeframe(tf) {
    if (!tf) return 'day';
    const s = String(tf).toLowerCase().trim();
    
    // Minutes
    if (s === '1m' || s === '1min' || s === '1minute') return '1minute';
    if (s === '5m' || s === '5min' || s === '5minute') return '5minute';
    if (s === '15m' || s === '15min' || s === '15minute') return '15minute';
    if (s === '30m' || s === '30min' || s === '30minute') return '30minute';
    if (s === '1h' || s === '60m' || s === '60min' || s === '1hour') return '1hour';
    
    // Days / Weeks / Months
    if (s === '1d' || s === 'd' || s === 'day' || s === 'daily') return 'day';
    if (s === '1w' || s === 'w' || s === 'week' || s === 'weekly') return 'week';
    if (s === '1mo' || s === 'month' || s === 'monthly') return 'month';
    
    return s;
}

/**
 * Converts any timeframe variant to a short human-readable UI label.
 * 
 * @param {string} tf - e.g. '15minute' -> '15m', 'day' -> 'Daily'
 * @returns {string} Short UI label
 */
export function toUiTimeframe(tf) {
    const upstoxTf = toUpstoxTimeframe(tf);
    return UI_TIMEFRAMES[upstoxTf] || tf;
}

/**
 * Normalizes timeframe to integer duration in minutes.
 * 
 * @param {string} tf - e.g. '15minute' -> 15
 * @returns {number} duration in minutes
 */
export function toTimeframeMinutes(tf) {
    const upstoxTf = toUpstoxTimeframe(tf);
    return TIMEFRAME_MINUTES[upstoxTf] || 15;
}
