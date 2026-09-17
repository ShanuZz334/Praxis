/**
 * @file predictionEngine.js
 * @purpose Pure mathematical engine for Praxis probabilistic forecasting.
 * 
 * Implements:
 * 1. Pinball (Quantile) Loss
 * 2. Winkler Interval Score
 * 3. Hedge / Multiplicative-Weights Algorithm
 * 4. Vincentization (Weighted Quantile Averaging)
 * 5. Naive Baseline Forecaster (Random Walk / ATR Cone)
 * 6. Conformal Calibration Scaling (Finite-sample adjusted)
 * 7. Lifting point forecasts to quantile distributions
 */

export const QUANTILE_LEVELS = [0.10, 0.25, 0.50, 0.75, 0.90];
export const DEFAULT_ETA = 0.5; // Learning rate for Hedge updates
export const MIN_WEIGHT_FLOOR = 0.001; // Prevents complete model extinction

// Standard normal quantile z-scores:
// q10: -1.28155, q25: -0.67449, q50: 0, q75: 0.67449, q90: 1.28155
const Z_SCORES = {
    0.10: -1.28155,
    0.25: -0.67449,
    0.50: 0.0,
    0.75: 0.67449,
    0.90: 1.28155
};

/**
 * Single quantile pinball loss.
 * L_tau(y, y_hat) = max(tau * (y - y_hat), (1 - tau) * (y_hat - y))
 * 
 * @param {number} actual - True realized value (y)
 * @param {number} predicted - Predicted quantile value (y_hat)
 * @param {number} tau - Quantile level between 0 and 1 (e.g. 0.10, 0.50, 0.90)
 * @returns {number} Pinball loss (non-negative)
 */
export function singlePinballLoss(actual, predicted, tau) {
    if (actual >= predicted) {
        return tau * (actual - predicted);
    } else {
        return (1.0 - tau) * (predicted - actual);
    }
}

/**
 * Multi-quantile pinball loss across an OHLC set.
 * 
 * @param {object} actualCandle - { open, high, low, close }
 * @param {object} predictedQuantiles - {
 *   q10_o, q25_o, q50_o, q75_o, q90_o,
 *   q10_h, q25_h, q50_h, q75_h, q90_h,
 *   q10_l, q25_l, q50_l, q75_l, q90_l,
 *   q10_c, q25_c, q50_c, q75_c, q90_c
 * }
 * @param {Array<number>} taus - Quantile levels to evaluate (default: QUANTILE_LEVELS)
 * @returns {number} Average pinball loss normalized by actual close
 */
export function computeCandlePinballLoss(actualCandle, predictedQuantiles, taus = QUANTILE_LEVELS) {
    if (!actualCandle || !predictedQuantiles) return 0;

    const actuals = {
        o: Number(actualCandle.open),
        h: Number(actualCandle.high),
        l: Number(actualCandle.low),
        c: Number(actualCandle.close)
    };

    if (isNaN(actuals.c) || actuals.c <= 0) return 0;

    let totalLoss = 0;
    let evalCount = 0;

    for (const key of ['o', 'h', 'l', 'c']) {
        const y = actuals[key];
        if (isNaN(y) || y <= 0) continue;

        const fullField = key === 'o' ? 'open' : key === 'h' ? 'high' : key === 'l' ? 'low' : 'close';
        for (const tau of taus) {
            const tauNum = Math.round(tau * 100);
            const tauKey = `q${tauNum}_${key}`;
            let yHat = Number(predictedQuantiles[tauKey]);
            if (isNaN(yHat) && predictedQuantiles[fullField]) {
                yHat = Number(predictedQuantiles[fullField][`q${tauNum}`]);
            }
            if (!isNaN(yHat) && yHat > 0) {
                totalLoss += singlePinballLoss(y, yHat, tau);
                evalCount++;
            }
        }
    }

    if (evalCount === 0) return 0;

    // Normalize by close price to keep loss dimensionless and stable across instruments
    const avgLoss = totalLoss / evalCount;
    return (avgLoss / actuals.c) * 100; // Return in percentage points (e.g. 0.45% error)
}

/**
 * Winkler Interval Score for nominal 1 - alpha coverage (default: 80% coverage -> alpha = 0.20).
 * 
 * IS_alpha(y, L, U) = (U - L) + (2/alpha) * (L - y) * 1(y < L) + (2/alpha) * (y - U) * 1(y > U)
 * 
 * @param {number} actual - Actual outcome
 * @param {number} lower - Predicted 10th percentile (L)
 * @param {number} upper - Predicted 90th percentile (U)
 * @param {number} alpha - Tail probability (0.20 for 80% central interval)
 * @returns {number} Interval score
 */
export function computeIntervalScore(actual, lower, upper, alpha = 0.20) {
    if (isNaN(actual) || isNaN(lower) || isNaN(upper)) return 0;
    const width = Math.max(0, upper - lower);
    let penalty = 0;
    if (actual < lower) {
        penalty = (2.0 / alpha) * (lower - actual);
    } else if (actual > upper) {
        penalty = (2.0 / alpha) * (actual - upper);
    }
    return width + penalty;
}

/**
 * Hedge Multiplicative Weight Update.
 * w_i <- w_i * exp(-eta * loss_i)
 * 
 * @param {Array<{ model_id: string, weight: number, loss: number }>} models 
 * @param {number} eta - Learning rate (default: DEFAULT_ETA = 0.5)
 * @returns {Array<{ model_id: string, weight: number }>} Renormalized weights summing to 1.0
 */
export function updateHedgeWeights(models, eta = DEFAULT_ETA) {
    if (!models || models.length === 0) return [];

    // Step 1: Exponential loss penalization
    const updated = models.map(m => {
        const currentWeight = Math.max(MIN_WEIGHT_FLOOR, m.weight || 1.0 / models.length);
        const loss = Math.max(0, m.loss || 0);
        const newWeight = Math.max(MIN_WEIGHT_FLOOR, currentWeight * Math.exp(-eta * loss));
        return {
            model_id: m.model_id,
            weight: newWeight
        };
    });

    // Step 2: Renormalize so sum(w_i) == 1.0
    const totalWeight = updated.reduce((sum, m) => sum + m.weight, 0);
    if (totalWeight <= 0) {
        const uniform = 1.0 / updated.length;
        return updated.map(m => ({ ...m, weight: uniform }));
    }

    return updated.map(m => ({
        model_id: m.model_id,
        weight: Number((m.weight / totalWeight).toFixed(6))
    }));
}

/**
 * Vincentization: Weighted Quantile Averaging.
 * Averages each quantile level separately across models weighted by w_i.
 * 
 * @param {Array<{ model_id: string, weight: number, quantiles: object }>} ensembleMembers
 * @returns {object} Combined quantile forecast preserving distribution shape
 */
export function combineQuantiles(ensembleMembers) {
    if (!ensembleMembers || ensembleMembers.length === 0) return null;

    // Filter valid members with positive weights
    const valid = ensembleMembers.filter(m => m.weight > 0 && m.quantiles);
    if (valid.length === 0) return null;

    const totalWeight = valid.reduce((sum, m) => sum + m.weight, 0);

    const result = {};
    const keys = ['o', 'h', 'l', 'c'];

    for (const key of keys) {
        for (const tau of QUANTILE_LEVELS) {
            const tauKey = `q${Math.round(tau * 100)}_${key}`;
            let weightedSum = 0;

            for (const member of valid) {
                const val = Number(member.quantiles[tauKey]) || 0;
                weightedSum += member.weight * val;
            }

            result[tauKey] = Number((weightedSum / totalWeight).toFixed(2));
        }
    }

    // Physical OHLC sanity checks
    for (const tau of QUANTILE_LEVELS) {
        const tauStr = Math.round(tau * 100);
        const oKey = `q${tauStr}_o`;
        const hKey = `q${tauStr}_h`;
        const lKey = `q${tauStr}_l`;
        const cKey = `q${tauStr}_c`;

        let o = result[oKey];
        let h = result[hKey];
        let l = result[lKey];
        let c = result[cKey];

        // Ensure Low <= Open, Close <= High
        h = Math.max(h, o, c);
        l = Math.min(l, o, c);

        result[hKey] = Number(h.toFixed(2));
        result[lKey] = Number(l.toFixed(2));
    }

    return result;
}

/**
 * Naive Baseline Forecaster (Member #7: Random Walk with ATR Cone).
 * Next candle = this candle (random walk median) with quantiles derived from ATR.
 * 
 * @param {object} currentCandle - { open, high, low, close }
 * @param {number} atr - Average True Range of current instrument/timeframe
 * @returns {object} Quantile forecast { q10_o, ..., q90_c }
 */
export function generateNaiveBaseline(currentCandle, atr) {
    const c = Number(currentCandle.close);
    const effectiveAtr = Number(atr) > 0 ? Number(atr) : (c * 0.015); // Fallback 1.5% vol

    // Gaussian standard deviation approximated from ATR (IQR / 1.349)
    const sigma = effectiveAtr / 1.349;

    const quantiles = {};

    // Close quantiles: Random walk centered at current close
    for (const tau of QUANTILE_LEVELS) {
        const z = Z_SCORES[tau];
        const tauStr = Math.round(tau * 100);
        quantiles[`q${tauStr}_c`] = Number((c + z * sigma).toFixed(2));
    }

    // Open quantiles: Anchored tightly to current close with tiny drift noise
    for (const tau of QUANTILE_LEVELS) {
        const z = Z_SCORES[tau];
        const tauStr = Math.round(tau * 100);
        quantiles[`q${tauStr}_o`] = Number((c + z * (sigma * 0.15)).toFixed(2));
    }

    // High quantiles: Expected upside expansion above close
    for (const tau of QUANTILE_LEVELS) {
        const z = Z_SCORES[tau];
        const tauStr = Math.round(tau * 100);
        const baseHigh = c + effectiveAtr * 0.5;
        quantiles[`q${tauStr}_h`] = Number(Math.max(c, baseHigh + z * sigma).toFixed(2));
    }

    // Low quantiles: Expected downside expansion below close
    for (const tau of QUANTILE_LEVELS) {
        const z = Z_SCORES[tau];
        const tauStr = Math.round(tau * 100);
        const baseLow = c - effectiveAtr * 0.5;
        quantiles[`q${tauStr}_l`] = Number(Math.min(c, baseLow + z * sigma).toFixed(2));
    }

    // Enforce OHLC ordering
    for (const tau of QUANTILE_LEVELS) {
        const tauStr = Math.round(tau * 100);
        const o = quantiles[`q${tauStr}_o`];
        const cVal = quantiles[`q${tauStr}_c`];
        quantiles[`q${tauStr}_h`] = Math.max(quantiles[`q${tauStr}_h`], o, cVal);
        quantiles[`q${tauStr}_l`] = Math.min(quantiles[`q${tauStr}_l`], o, cVal);
    }

    return quantiles;
}

/**
 * Lift a single point candle forecast (e.g. from FutureVision LLM) into a calibrated quantile distribution.
 * 
 * @param {object} pointCandle - { open, high, low, close, confidence }
 * @param {number} atr - Instrument ATR
 * @returns {object} Quantile forecast
 */
export function liftPointForecastToQuantiles(pointCandle, atr) {
    const o = Number(pointCandle.open);
    const h = Number(pointCandle.high);
    const l = Number(pointCandle.low);
    const c = Number(pointCandle.close);
    const confidence = Math.min(89, Math.max(10, Number(pointCandle.confidence) || 50));

    // Uncertainty scale inversely proportional to confidence: confidence 85 -> 0.7x ATR, confidence 25 -> 1.5x ATR
    const confFactor = 1.6 - (confidence / 100.0);
    const effectiveAtr = (Number(atr) > 0 ? Number(atr) : (c * 0.015)) * confFactor;
    const sigma = effectiveAtr / 1.349;

    const quantiles = {};

    for (const tau of QUANTILE_LEVELS) {
        const z = Z_SCORES[tau];
        const tauStr = Math.round(tau * 100);

        quantiles[`q${tauStr}_o`] = Number((o + z * (sigma * 0.2)).toFixed(2));
        quantiles[`q${tauStr}_c`] = Number((c + z * sigma).toFixed(2));
        quantiles[`q${tauStr}_h`] = Number(Math.max(o, c, h + z * (sigma * 0.6)).toFixed(2));
        quantiles[`q${tauStr}_l`] = Number(Math.min(o, c, l + z * (sigma * 0.6)).toFixed(2));
    }

    // Physical constraints
    for (const tau of QUANTILE_LEVELS) {
        const tauStr = Math.round(tau * 100);
        const curO = quantiles[`q${tauStr}_o`];
        const curC = quantiles[`q${tauStr}_c`];
        quantiles[`q${tauStr}_h`] = Math.max(quantiles[`q${tauStr}_h`], curO, curC);
        quantiles[`q${tauStr}_l`] = Math.min(quantiles[`q${tauStr}_l`], curO, curC);
    }

    return quantiles;
}

/**
 * Conformal Nonconformity Score.
 * Computes how far the truth landed outside the predicted 80% interval, normalized by interval half-width.
 * 
 * score = |actual - median| / halfwidth
 * 
 * @param {number} actual - True close
 * @param {number} q50 - Predicted median close
 * @param {number} q10 - Predicted 10th percentile close
 * @param {number} q90 - Predicted 90th percentile close
 * @returns {number} Nonconformity score (>= 0)
 */
export function computeConformityScore(actual, q50, q10, q90) {
    const halfWidth = Math.max(1e-4, 0.5 * Math.abs(q90 - q10));
    return Math.abs(actual - q50) / halfWidth;
}

/**
 * Fit Conformal Multiplier from a rolling window of conformity scores.
 * Uses finite-sample corrected quantile: k = ceil((n + 1) * (1 - alpha)) for alpha = 0.20 (80% nominal coverage).
 * 
 * @param {Array<number>} conformityScores - Array of rolling nonconformity scores
 * @param {number} nominalLevel - e.g. 0.80 for 80% coverage
 * @returns {number} Multiplicative correction factor (default 1.0 if insufficient data)
 */
export function fitConformalMultiplier(conformityScores, nominalLevel = 0.80) {
    if (!conformityScores || conformityScores.length < 10) return 1.0;

    // Filter valid positive finite numbers and sort ascending
    const sorted = conformityScores
        .filter(s => typeof s === 'number' && isFinite(s) && s >= 0)
        .sort((a, b) => a - b);

    const n = sorted.length;
    if (n < 10) return 1.0;

    const alpha = 1.0 - nominalLevel;
    // Finite-sample rank index
    const k = Math.min(n, Math.ceil((n + 1) * (1.0 - alpha)));
    const rawMultiplier = sorted[k - 1];

    // Clip between 0.5 and 3.5 to prevent extreme explosions
    return Number(Math.max(0.5, Math.min(3.5, rawMultiplier)).toFixed(3));
}

/**
 * Apply conformal multiplier to an 80% forecast interval.
 * Expands or contracts the interval so empirical coverage tracks nominal 80%.
 * 
 * @param {object} quantiles - Uncalibrated quantiles
 * @param {number} multiplier - Conformal multiplier s
 * @returns {object} Calibrated quantiles
 */
export function applyConformalCalibration(quantiles, multiplier = 1.0) {
    if (!quantiles || multiplier === 1.0) return quantiles;

    const calibrated = { ...quantiles };
    const s = Math.max(0.5, Math.min(3.5, multiplier));

    for (const key of ['o', 'h', 'l', 'c']) {
        const q50 = calibrated[`q50_${key}`];
        const q10 = calibrated[`q10_${key}`];
        const q90 = calibrated[`q90_${key}`];

        if (q50 && q10 && q90) {
            const lowerSpread = q50 - q10;
            const upperSpread = q90 - q50;

            calibrated[`q10_${key}`] = Number((q50 - s * lowerSpread).toFixed(2));
            calibrated[`q90_${key}`] = Number((q50 + s * upperSpread).toFixed(2));
        }
    }

    return calibrated;
}
