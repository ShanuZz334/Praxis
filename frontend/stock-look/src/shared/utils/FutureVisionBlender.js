/**
 * @file FutureVisionBlender.js
 * @purpose Institutional-grade algorithmic blending of rolling time-series forecasts.
 * 
 * When Auto Mode is active, Future Vision generates a new 7-candle prediction 
 * while the previous 6-candle prediction is still valid. Simply overwriting the 
 * old prediction causes jarring visual jumps and discards valuable prior AI state.
 * 
 * This module uses Minimum Variance Unbiased Estimation (MVUE) - essentially a 
 * simplified Kalman Filter update. Since price uncertainty (variance) in a random walk 
 * grows linearly with the forecast horizon (h), we dynamically weight the Old vs New 
 * candles based on their relative horizons.
 */

/**
 * Blends the old remaining predicted candles with a newly generated batch.
 * 
 * @param {Array} oldCandles - Array of remaining predicted candles (e.g. length 6)
 * @param {Array} newCandles - Array of newly generated candles (e.g. length 7)
 * @returns {Array} The blended candles
 */
export function blendRollingForecasts(oldCandles, newCandles) {
    if (!oldCandles || oldCandles.length === 0) return newCandles;
    if (!newCandles || newCandles.length === 0) return oldCandles;

    const blended = [];
    const len = newCandles.length;

    for (let i = 0; i < len; i++) {
        const N = newCandles[i];
        const O = oldCandles[i];

        // If there is no corresponding old candle (e.g. the 7th new candle),
        // we just take the new candle completely.
        if (!O) {
            blended.push(N);
            continue;
        }

        // --- Minimum Variance Unbiased Weighting ---
        // Horizon of new candle is (i + 1). Horizon of old candle was (i + 2) when generated.
        // Variance is proportional to horizon.
        // Weight is inversely proportional to variance.
        const varN = i + 1;
        const varO = i + 2;
        
        const invVarN = 1.0 / varN;
        const invVarO = 1.0 / varO;
        const sumInv = invVarN + invVarO;

        const wN = invVarN / sumInv;
        const wO = invVarO / sumInv;

        // Blend Open and Close (The core body)
        const bOpen = (N.open * wN) + (O.open * wO);
        const bClose = (N.close * wN) + (O.close * wO);

        // To prevent invalid shadows (High < Low), we blend the upper/lower shadows 
        // relative to the blended body, rather than blending High/Low directly.
        const upperShadowN = N.high - Math.max(N.open, N.close);
        const lowerShadowN = Math.min(N.open, N.close) - N.low;

        const upperShadowO = O.high - Math.max(O.open, O.close);
        const lowerShadowO = Math.min(O.open, O.close) - O.low;

        const bUpperShadow = (upperShadowN * wN) + (upperShadowO * wO);
        const bLowerShadow = (lowerShadowN * wN) + (lowerShadowO * wO);

        const bMaxBody = Math.max(bOpen, bClose);
        const bMinBody = Math.min(bOpen, bClose);

        const bHigh = bMaxBody + bUpperShadow;
        const bLow = bMinBody - bLowerShadow;

        // Blend confidence scores if they exist
        const bConfidence = (N.confidence && O.confidence) 
            ? Math.round((N.confidence * wN) + (O.confidence * wO))
            : (N.confidence || O.confidence || 0);

        blended.push({
            ...N, // keep time and other non-price metadata from the new candle
            open: parseFloat(bOpen.toFixed(2)),
            high: parseFloat(bHigh.toFixed(2)),
            low: parseFloat(bLow.toFixed(2)),
            close: parseFloat(bClose.toFixed(2)),
            confidence: bConfidence,
            isBlended: true // flag for debugging/UI tracking
        });
    }

    return blended;
}
