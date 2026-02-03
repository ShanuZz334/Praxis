/**
 * @file fakeCandles.js
 * @purpose Generates mock candlestick data for chart testing.
 * @responsibilities
 * - Creates realistic 10-minute candle data for market hours (9:15-3:30).
 * - Simulates price movements with random OHLC values.
 * @key_exports
 * - generate10MinCandles
 * @dependencies
 * - None (pure utility function)
 * @lifecycle
 * - Used by fakeFundData.js and chart components for demo data.
 * @date 2026-02-04
 */

// =============================
// Candle Generation
// =============================

export function generate10MinCandles(startPrice, days = 5) {
    const candles = [];
    const candlesPerDay = 39; // 9:15–3:30
    let price = startPrice;

    for (let d = 0; d < days; d++) {
        for (let i = 0; i < candlesPerDay; i++) {
            const o = price;
            const c = o + (Math.random() - 0.5) * 40;
            const h = Math.max(o, c) + Math.random() * 15;
            const l = Math.min(o, c) - Math.random() * 15;

            candles.push({
                o: Math.round(o),
                h: Math.round(h),
                l: Math.round(l),
                c: Math.round(c),
            });

            price = c;
        }
    }

    return candles;
}
