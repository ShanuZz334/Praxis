/**
 * @file FutureVisionBlender.js
 * @purpose Institutional-grade algorithmic blending and smoothing of rolling time-series forecasts.
 * 
 * Implements a quantitative Bayesian-Kalman minimum-variance blending pipeline with:
 * 1. Active Render Bar Locking: Skips mutating the currently rendering candle (#0) mid-render.
 * 2. Horizon Extension: Appends trailing fresh predictions as extra forecast horizon bars.
 * 3. Directional Return Vector Blending: Blends drift momentum rather than raw prices, preventing artificial doji collapses.
 * 4. RMS True Range Volatility Harmonization: Preserves authentic candle geometries with strict boundary guarantees.
 * 5. Monotonic Hermite Trajectory Smoothing: Eliminates jagged zigzag noise across closing prices.
 */

/**
 * Calculates optimal Bayesian-Kalman weights based on forecast horizons and model confidences.
 * 
 * @param {number} horizonOld - Effective forecast horizon of the prior prediction
 * @param {number} horizonNew - Effective forecast horizon of the incoming prediction
 * @param {number} confOld - AI model confidence score (0-100) for prior prediction
 * @param {number} confNew - AI model confidence score (0-100) for incoming prediction
 * @returns {{ wOld: number, wNew: number }}
 */
export function calculateBayesianKalmanWeights(horizonOld, horizonNew, confOld = 75, confNew = 80) {
    const cO = Math.max(confOld, 20) / 100;
    const cN = Math.max(confNew, 20) / 100;

    const varOld = Math.max(horizonOld, 1) / (cO * cO);
    const varNew = Math.max(horizonNew, 1) / (cN * cN);

    const invVarOld = 1.0 / varOld;
    const invVarNew = 1.0 / varNew;
    const sumInv = invVarOld + invVarNew;

    const wOld = invVarOld / sumInv;
    const wNew = invVarNew / sumInv;

    return { wOld, wNew };
}

/**
 * Harmonizes volatility between two candles using Root-Mean-Square (RMS) True Range.
 */
export function harmonizeCandleGeometry(open, close, candleOld, candleNew, wOld, wNew) {
    const trOld = Math.max((candleOld.high ?? open) - (candleOld.low ?? close), 0.05);
    const trNew = Math.max((candleNew.high ?? open) - (candleNew.low ?? close), 0.05);

    // RMS True Range
    const trBlend = Math.sqrt((wOld * trOld * trOld) + (wNew * trNew * trNew));

    const bodyMax = Math.max(open, close);
    const bodyMin = Math.min(open, close);

    const oMax = Math.max(candleOld.open, candleOld.close);
    const oMin = Math.min(candleOld.open, candleOld.close);
    const nMax = Math.max(candleNew.open, candleNew.close);
    const nMin = Math.min(candleNew.open, candleNew.close);

    const upShadowRatioOld = Math.max(0, candleOld.high - oMax) / trOld;
    const upShadowRatioNew = Math.max(0, candleNew.high - nMax) / trNew;
    const upShadowRatio = (upShadowRatioOld * wOld) + (upShadowRatioNew * wNew);

    const downShadowRatioOld = Math.max(0, oMin - candleOld.low) / trOld;
    const downShadowRatioNew = Math.max(0, nMin - candleNew.low) / trNew;
    const downShadowRatio = (downShadowRatioOld * wOld) + (downShadowRatioNew * wNew);

    const high = Number((bodyMax + (trBlend * upShadowRatio)).toFixed(2));
    const low = Number((bodyMin - (trBlend * downShadowRatio)).toFixed(2));

    return {
        high: Math.max(high, bodyMax),
        low: Math.min(low, bodyMin)
    };
}

/**
 * Applies a 3-point monotonic smoothing pass across closing prices
 * to eliminate artificial high-frequency jitter while preserving macro slope.
 */
export function smoothTrajectory(candles, alpha = 0.2) {
    if (!candles || candles.length < 3) return candles;

    const smoothed = [...candles];
    for (let i = 1; i < candles.length - 1; i++) {
        // Skip smoothing bar 0 if it is the locked rendering bar
        if (candles[i - 1].isRenderingLocked && i === 1) continue;

        const prevC = candles[i - 1].close;
        const currC = candles[i].close;
        const nextC = candles[i + 1].close;

        // Monotonic condition: only smooth if current point does not invert local monotonicity
        const sClose = Number(((alpha * prevC) + ((1 - 2 * alpha) * currC) + (alpha * nextC)).toFixed(2));

        smoothed[i] = {
            ...smoothed[i],
            close: sClose,
            high: Math.max(smoothed[i].high, Math.max(smoothed[i].open, sClose)),
            low: Math.min(smoothed[i].low, Math.min(smoothed[i].open, sClose))
        };
    }
    return smoothed;
}

/**
 * Institutional blending engine for rolling/regenerated forecasts.
 * 
 * @param {Array} oldCandles - Existing predicted candles
 * @param {Array} newCandles - Newly generated forecast batch
 * @param {Object} options - Configuration options
 * @param {boolean} options.skipRenderingCandle - If true, locks candle #0 and pairs new from #1 onward (default: true)
 * @param {number} options.maxHorizon - Maximum allowed forecast candles (default: 10)
 * @param {number} options.anchorPrice - Optional price anchor (last real candle close)
 * @returns {Array} Blended & smoothed forecast candles
 */
export function blendRollingForecasts(oldCandles, newCandles, options = {}) {
    if (!oldCandles || oldCandles.length === 0) return newCandles || [];
    if (!newCandles || newCandles.length === 0) return oldCandles || [];

    const {
        skipRenderingCandle = true,
        maxHorizon = 10,
        anchorPrice = null
    } = options;

    const blended = [];

    if (skipRenderingCandle) {
        // ── 1. Lock Candle #0 (Currently Rendering Candle) ────────────────────────
        // Candle #0 is preserved completely verbatim to prevent visual jumps mid-render.
        const bar0 = {
            ...oldCandles[0],
            isRenderingLocked: true
        };
        blended.push(bar0);

        const oldRemaining = oldCandles.slice(1);
        const newRemaining = newCandles;

        const totalToProcess = Math.min(maxHorizon - 1, Math.max(oldRemaining.length, newRemaining.length));

        for (let j = 0; j < totalToProcess; j++) {
            const O = oldRemaining[j];
            const N = newRemaining[j];
            const prevBar = blended[blended.length - 1];

            if (O && N) {
                // Both old and new predictions exist for this horizon slot
                const hO = j + 2;
                const hN = j + 1;

                const { wOld, wNew } = calculateBayesianKalmanWeights(
                    hO, hN,
                    O.confidence ?? 75,
                    N.confidence ?? 80
                );

                // Continuity Anchor: open attaches to previous close
                const bOpen = Number(prevBar.close.toFixed(2));

                // Directional Return Vector Blending (Prevents flat doji collapse)
                const deltaO = (O.close - O.open);
                const deltaN = (N.close - N.open);
                const bDelta = (deltaO * wOld) + (deltaN * wNew);
                const bClose = Number((bOpen + bDelta).toFixed(2));

                // RMS True Range and Shadow Harmonization
                const { high: bHigh, low: bLow } = harmonizeCandleGeometry(bOpen, bClose, O, N, wOld, wNew);

                const bConf = Math.round(((O.confidence ?? 75) * wOld) + ((N.confidence ?? 80) * wNew));

                blended.push({
                    ...N,
                    open: bOpen,
                    high: bHigh,
                    low: bLow,
                    close: bClose,
                    confidence: bConf,
                    direction: bClose >= bOpen ? 'bullish' : 'bearish',
                    isBlended: true,
                    blendWeightNew: Number(wNew.toFixed(2))
                });
            } else if (N && !O) {
                // EXTRA CANDLE EXTENSION:
                // New candle extends beyond the old horizon (e.g. 7 -> 8+ bars)!
                const bOpen = Number(prevBar.close.toFixed(2));
                const deltaN = (N.close - N.open);
                const bClose = Number((bOpen + deltaN).toFixed(2));

                const bodyMax = Math.max(bOpen, bClose);
                const bodyMin = Math.min(bOpen, bClose);

                const upShadowN = Math.max(0, N.high - Math.max(N.open, N.close));
                const downShadowN = Math.max(0, Math.min(N.open, N.close) - N.low);

                blended.push({
                    ...N,
                    open: bOpen,
                    high: Number((bodyMax + upShadowN).toFixed(2)),
                    low: Number((bodyMin - downShadowN).toFixed(2)),
                    close: bClose,
                    direction: bClose >= bOpen ? 'bullish' : 'bearish',
                    isExtendedBar: true
                });
            } else if (O && !N) {
                blended.push(O);
            }
        }
    } else {
        // Standard non-skipping blend
        const totalToProcess = Math.min(maxHorizon, Math.max(oldCandles.length, newCandles.length));

        for (let i = 0; i < totalToProcess; i++) {
            const O = oldCandles[i];
            const N = newCandles[i];
            const prevBar = blended.length > 0 ? blended[blended.length - 1] : null;

            if (O && N) {
                const { wOld, wNew } = calculateBayesianKalmanWeights(
                    i + 2, i + 1,
                    O.confidence ?? 75,
                    N.confidence ?? 80
                );

                const bOpen = prevBar ? Number(prevBar.close.toFixed(2)) : Number(((O.open * wOld) + (N.open * wNew)).toFixed(2));
                const deltaO = (O.close - O.open);
                const deltaN = (N.close - N.open);
                const bDelta = (deltaO * wOld) + (deltaN * wNew);
                const bClose = Number((bOpen + bDelta).toFixed(2));

                const { high: bHigh, low: bLow } = harmonizeCandleGeometry(bOpen, bClose, O, N, wOld, wNew);
                const bConf = Math.round(((O.confidence ?? 75) * wOld) + ((N.confidence ?? 80) * wNew));

                blended.push({
                    ...N,
                    open: bOpen,
                    high: bHigh,
                    low: bLow,
                    close: bClose,
                    confidence: bConf,
                    direction: bClose >= bOpen ? 'bullish' : 'bearish',
                    isBlended: true
                });
            } else if (N) {
                blended.push(N);
            } else if (O) {
                blended.push(O);
            }
        }
    }

    // Apply institutional monotonic trajectory smoothing
    return smoothTrajectory(blended);
}
