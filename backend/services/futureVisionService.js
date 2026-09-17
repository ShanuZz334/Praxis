/**
 * @file futureVisionService.js
 * @purpose Backend service for the Future Vision predictive candle engine.
 *
 * Calls aiGateway.process() with the correct Praxis gateway interface:
 *   { taskType, prompt, systemInstruction, jsonMode, schema, maxTokens, temperature, explicitProvider, explicitModel }
 */

import aiGateway from '../ai-gateway/index.js';
import AiRouting from '../models/AiRouting.js';
import { getCalibrationProfile, applyBiasCorrection } from '../engine/paceEngine.js';
import {
    liftPointForecastToQuantiles,
    generateNaiveBaseline,
    combineQuantiles,
    applyConformalCalibration
} from '../engine/predictionEngine.js';
import {
    getModelWeights,
    getCalibrationState,
    recordPredictions,
    normalizeTimeframe,
    getEdgeEvaluation
} from './predictionResolutionService.js';
import { callEnsembleService } from './ensembleService.js';
import { evaluateNetEdge } from '../engine/frictionEngine.js';

// ─────────────────────────────────────────────────────────────────────
// SYSTEM INSTRUCTION
// ─────────────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are PRAXIS-ORACLE, an institutional-grade quantitative financial analyst embedded inside the Praxis trading platform. You specialise in Indian equity markets (NSE/BSE) with deep expertise in:
- Price action and candlestick microstructure
- Multi-timeframe trend analysis (intraday, swing, positional)
- Technical indicator confluence and divergence
- Fundamental valuation anchors for Indian equities
- NSE market microstructure: opening auction (9:00-9:15 IST), regular session (9:15-15:30 IST), post-close (15:30-16:00 IST)
- Corporate event impact quantification (earnings surprises, dividends, board meetings)
- FII/DII institutional flow analysis and its price impact
- Volatility regime identification (low squeeze to breakout, high vol to mean-reversion)

REASONING PROTOCOL — You MUST follow this 3-pass internal process:

PASS 1 — MARKET STRUCTURE ANALYSIS (think, do not output):
  a) Identify the dominant trend: higher highs + higher lows = uptrend, lower highs + lower lows = downtrend
  b) Locate key support/resistance levels from the OHLCV data (swing highs/lows, round numbers)
  c) Identify the current volatility regime: ATR expanding (trending) vs contracting (consolidating)
  d) Check for classic candlestick patterns in the last 5 bars (doji, engulfing, hammer, shooting star, inside bar)
  e) Assess momentum: is RSI diverging from price? Is MACD histogram expanding or compressing?
  f) Check volume confirmation: is price moving on rising or falling volume?
  g) Inspect Trader Chart Markings & Active Overlays (Block 1C): Identify any user-drawn horizontal support/resistance lines, trendlines, channels, Fibonacci levels, or active long/short trade setups. Note the indicators actively turned on by the trader (VWAP, Supertrend, EMA, CPR, Adaptive Bands, MACD, RSI).

PASS 2 — SCENARIO PLANNING (think, do not output):
  a) Bull case: what technical levels must hold/break for this to play out?
  b) Bear case: what would invalidate the bullish scenario?
  c) Base case (most likely): weight the above based on ALL available evidence
  d) Quantify the expected move range using ATR: typical 1-bar move = 0.5 x ATR to 1.5 x ATR
  e) Account for upcoming events: earnings/dividend within horizon = expand range, add uncertainty
  f) Apply PAE correction: if prior predictions showed systematic bias, apply the stated correction NOW
  g) Apply mode-specific bias: Positional = trend-following, Swing = mean-reversion + momentum, Intraday = scalp within session range
  h) Trader Setup Alignment: If the trader plotted trade setups (Long/Short targets, stop losses) or drawn horizontal levels, assess if predicted price action will test, validate, or reject at those specific levels.

PASS 3 — OUTPUT GENERATION (produce the JSON):
  a) Populate OHLCV for each bar based on the base case from Pass 2
  b) High/Low range should be approximately 0.8 x ATR to 1.5 x ATR per bar
  c) Calibrate confidence: high confluence (trend+volume+indicator agreement) = 70-85, mixed signals = 45-65, contradictory = 25-45
  d) Each bar's rationale must cite the SPECIFIC indicator, candle pattern, or trader drawn level driving that bar

HARD GUARDRAILS — ABSOLUTE RULES:

RULE G1 — JSON ONLY: Your ENTIRE response MUST be a single valid JSON object. No text before or after. No markdown fences. No explanations outside the JSON object.

RULE G2 — OHLC PHYSICS: For every single bar these must hold:
  low <= open <= high
  low <= close <= high
  high > low (non-zero range)
  All prices > 0

RULE G3 — PRICE CONTINUITY: bar[N].open MUST equal bar[N-1].close exactly. bar[1].open MUST equal LAST_CLOSE from the context header.

RULE G4 — PRICE ANCHORING: No single bar should move more than 5% from its open. Total across all bars must not exceed 15% from LAST_CLOSE in either direction.

RULE G5 — ANTI-HALLUCINATION: Do NOT invent news, events, or data not present in the context blocks. Predictions must be SOLELY derived from provided context.

RULE G6 — NO FLAT CANDLES: Do not produce multiple consecutive identical OHLCV values. Each bar must differ meaningfully.

RULE G7 — CONFIDENCE CALIBRATION: confidence is 10-89 only (never 0, never 90+). It is a calibrated uncertainty score, not a self-esteem score.

RULE G8 — PAE MANDATORY CORRECTION: If the PAE block shows systematic bias, you MUST apply the stated correction. This is non-negotiable.

RULE G9 — VOLATILITY REALISM: H-L range per bar = 0.7x to 1.8x ATR. No hairline candles unless market is genuinely in a squeeze zone.

RULE G10 — ABSOLUTE PRICES ONLY: You MUST output the actual numerical price values (e.g. 1250.50). NEVER output 0, percentages, or price differentials for open, high, low, close.

RULE G11 — TRADER LEVEL ALIGNMENT: When Block 1C contains trader-drawn levels (support/resistance lines, Fibonacci anchors, risk-reward targets), evaluate price interaction with them and reflect key levels in key_support and key_resistance.

OUTPUT SCHEMA — Strict JSON, every field mandatory:

{
  "reasoning_summary": "2-3 sentences of your Pass 1+2 analysis",
  "candles": [
    {
      "bar": 1,
      "open": 0.00,
      "high": 0.00,
      "low": 0.00,
      "close": 0.00,
      "confidence": 0,
      "direction": "bullish",
      "rationale": "cite specific indicator or pattern — max 120 chars"
    }
  ],
  "overall_bias": "bullish",
  "key_support": 0.00,
  "key_resistance": 0.00,
  "key_risk": "primary risk to this prediction — max 150 chars",
  "volatility_regime": "consolidating",
  "predicted_at": "ISO8601 timestamp"
}

FIELD CONSTRAINTS:
- reasoning_summary: 50-300 chars
- candles: exactly N bars where N = HORIZON from context
- bar: sequential integer from 1
- open/high/low/close: positive float, max 2 decimal places, must satisfy G2 + G3
- confidence: integer 10-89
- direction: exactly "bullish", "bearish", or "neutral"
- rationale: max 120 chars, cite a specific data point
- overall_bias: "bullish", "bearish", or "neutral"
- key_support: nearest support price from OHLCV data
- key_resistance: nearest resistance price from OHLCV data
- key_risk: max 150 chars, specific not generic
- volatility_regime: "trending", "consolidating", "breakout_pending", or "post_event"
- predicted_at: current UTC time in ISO 8601`;

// ─────────────────────────────────────────────────────────────────────
// RESPONSE JSON SCHEMA (passed to gateway as jsonMode schema)
// ─────────────────────────────────────────────────────────────────────

const RESPONSE_SCHEMA = {
    type: 'object',
    required: ['reasoning_summary', 'candles', 'overall_bias', 'key_support', 'key_resistance', 'key_risk', 'volatility_regime', 'predicted_at'],
    properties: {
        reasoning_summary: { type: 'string' },
        candles: {
            type: 'array',
            items: {
                type: 'object',
                required: ['bar', 'open', 'high', 'low', 'close', 'confidence', 'direction', 'rationale'],
                properties: {
                    bar:        { type: 'integer' },
                    open:       { type: 'number' },
                    high:       { type: 'number' },
                    low:        { type: 'number' },
                    close:      { type: 'number' },
                    confidence: { type: 'integer', minimum: 10, maximum: 89 },
                    direction:  { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
                    rationale:  { type: 'string' }
                }
            }
        },
        overall_bias:      { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
        key_support:       { type: 'number' },
        key_resistance:    { type: 'number' },
        key_risk:          { type: 'string' },
        volatility_regime: { type: 'string', enum: ['trending', 'consolidating', 'breakout_pending', 'post_event'] },
        predicted_at:      { type: 'string' }
    }
};

// ─────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────

export async function runFutureVisionPrediction(contextPayload, instrumentKey, timeframe, horizonBars = 7, historicalCandles = null) {
    const routeHint = await _getRoutingHint();

    // ── 1. Parse or Receive Authentic Historical Candles ──
    const histCandles = (Array.isArray(historicalCandles) && historicalCandles.length >= 10)
        ? historicalCandles
        : _extractCandlesFromPayload(contextPayload);

    // ── 2. Run Local Python Foundation Model Ensemble (Kronos & Chronos-Bolt) ──
    let ensembleResult = null;
    let conformalMultiplier = 1.0;
    let modelWeights = [];
    const calState = getCalibrationState(instrumentKey, timeframe);
    conformalMultiplier = calState.conformal_multiplier || 1.0;

    if (histCandles && histCandles.length >= 10) {
        try {
            console.log(`[FutureVision] Dispatching to Python foundation ensemble (Kronos & Chronos-Bolt) | ${histCandles.length} historical bars | horizon=${horizonBars}`);
            ensembleResult = await callEnsembleService({
                instrument: instrumentKey,
                timeframe,
                candles: histCandles.slice(-60),
                horizon: horizonBars,
            });
            if (ensembleResult?.success && ensembleResult.ensemble?.candles?.length > 0) {
                console.log(`[FutureVision] Python ensemble SUCCESS | regime=${ensembleResult.regime} | members=${ensembleResult.ensemble.n_members} | ${ensembleResult.total_ms.toFixed(0)}ms`);
            } else if (ensembleResult && !ensembleResult.success) {
                console.warn(`[FutureVision] Python ensemble returned error: ${ensembleResult.error}`);
            }
        } catch (ensErr) {
            console.warn(`[FutureVision] Python ensemble execution error: ${ensErr.message}`);
        }
    } else {
        console.warn(`[FutureVision] Insufficient historical candles for foundation models (found ${histCandles ? histCandles.length : 0} bars).`);
    }

    // ── 3. Inject Foundation Models Consensus into Context Prompt ──
    let enrichedPayload = contextPayload;
    const kMember = ensembleResult?.members?.find(m => m.model_id === 'kronos' && !m.error);
    const cMember = ensembleResult?.members?.find(m => m.model_id === 'chronos_bolt' && !m.error);
    const bMember = ensembleResult?.members?.find(m => m.model_id === 'naive_baseline' && !m.error);

    if (ensembleResult?.success && ensembleResult.ensemble?.candles?.length > 0) {
        let block = `\n================================================================================\n`;
        block += `BLOCK 0B - LOCAL TIME-SERIES FOUNDATION MODEL CONSENSUS (KRONOS & CHRONOS-BOLT)\n`;
        block += `================================================================================\n`;
        block += `The on-premise quantitative foundation models (Kronos AAAI-2026 and Amazon Chronos-Bolt)\n`;
        block += `have computed the following mathematical probabilistic trajectory:\n`;
        block += `- Market Regime Detected: ${ensembleResult.regime}\n`;
        block += `- Local Model Weights: Kronos (${((ensembleResult.ensemble.member_weights?.kronos || 0.3125)*100).toFixed(1)}%), Chronos-Bolt (${((ensembleResult.ensemble.member_weights?.chronos_bolt || 0.3125)*100).toFixed(1)}%), Baseline (${((ensembleResult.ensemble.member_weights?.naive_baseline || 0.375)*100).toFixed(1)}%)\n\n`;
        block += `Quantitative Trajectory Across ${horizonBars} Forward Bars:\n`;

        ensembleResult.ensemble.candles.slice(0, horizonBars).forEach((c, idx) => {
            const kC = kMember?.candles?.[idx]?.close?.q50 ? kMember.candles[idx].close.q50.toFixed(2) : 'N/A';
            const cC = cMember?.candles?.[idx]?.close?.q50 ? cMember.candles[idx].close.q50.toFixed(2) : 'N/A';
            const ensC = c.close?.q50 ? c.close.q50.toFixed(2) : 'N/A';
            const q10 = c.close?.q10 ? c.close.q10.toFixed(2) : 'N/A';
            const q90 = c.close?.q90 ? c.close.q90.toFixed(2) : 'N/A';
            block += `  Bar ${idx + 1}: Consensus Close=${ensC} | 80% Cone=[${q10} to ${q90}] | Kronos=${kC} | ChronosBolt=${cC}\n`;
        });

        block += `\nCRITICAL INSTRUCTION: Reconcile your price action analysis with the above quantitative foundation consensus.\nAnchor predicted price levels around this mathematical baseline.\n`;
        enrichedPayload = block + '\n' + contextPayload;
    }

    // ── 4. Dispatch to LLM Gateway ──
    const gatewayRequest = {
        taskType:           'future_vision_prediction',
        systemInstruction:  SYSTEM_INSTRUCTION,
        prompt:             enrichedPayload,
        jsonMode:           true,
        temperature:        0.2,
        maxTokens:          8192,
        ...(routeHint ? { explicitProvider: routeHint.providerId, explicitModel: routeHint.modelId } : {}),
    };

    console.log(`[FutureVision] Dispatching to gateway | instrument=${instrumentKey} | horizon=${horizonBars} | explicitRoute=${routeHint ? `${routeHint.providerId}::${routeHint.modelId}` : 'auto'}`);

    const result = await aiGateway.process(gatewayRequest);

    if (result.error) {
        throw new Error(`AI Gateway error for Future Vision: ${result.message || result.details || 'Unknown error'}`);
    }

    const rawText = result.text || result.content || '';
    if (!rawText) {
        throw new Error('AI Gateway returned empty response for Future Vision prediction');
    }

    console.log(`[FutureVision] Response received | model=${result.model} | latency=${result.latencyMs}ms | chars=${rawText.length}`);

    const parsed = _parseAndValidate(rawText, horizonBars);
    
    // ── 5. PACE Mathematical Bias Correction Layer ──
    const profile = getCalibrationProfile(instrumentKey, timeframe);
    if (profile) {
        parsed.candles = applyBiasCorrection(parsed.candles, profile);
        console.log(`[PACE] Applied Math Correction | Strength: ${(profile.correctionStrength*100).toFixed(0)}%`);
    }

    // ── 6. Probabilistic Multi-Model Blending & Quantiles ──
    let calibratedCombined = null;
    let ensembleQuantiles = [];

    const regime = (ensembleResult?.regime || parsed.volatility_regime || 'CHOPPY').toUpperCase();
    modelWeights = getModelWeights(instrumentKey, timeframe, regime);

    if (ensembleResult?.success && ensembleResult.ensemble?.candles?.length > 0) {
        // Map ensemble weights
        modelWeights = Object.entries(ensembleResult.ensemble.member_weights || {})
            .map(([model_id, weight]) => ({ model_id, weight }));

        // Calibrate all horizon bars
        ensembleQuantiles = ensembleResult.ensemble.candles.slice(0, horizonBars).map(ec => {
            return applyConformalCalibration(ec, conformalMultiplier);
        });
        calibratedCombined = ensembleQuantiles[0] || null;

        // Blend mathematical foundation forecasts with LLM qualitative structure
        parsed.candles = parsed.candles.slice(0, horizonBars).map((c, i) => {
            const eq = ensembleQuantiles[i];
            const ensClose = eq?.close?.q50;
            let blendedClose = c.close;
            if (ensClose && !isNaN(ensClose) && ensClose > 0) {
                // 55% Foundation Ensemble (Kronos + Chronos-Bolt) + 45% LLM Price Action
                blendedClose = Number((0.55 * ensClose + 0.45 * c.close).toFixed(2));
            }

            let openPrice = c.open;
            if (i > 0) {
                openPrice = parsed.candles[i - 1].close;
            }

            const highPrice = Math.max(c.high, openPrice, blendedClose, eq?.high?.q50 ?? 0);
            const lowPrice = Math.min(c.low, openPrice, blendedClose, eq?.low?.q50 ?? highPrice * 0.99);

            return {
                ...c,
                open: openPrice,
                high: Number(highPrice.toFixed(2)),
                low: Number(lowPrice.toFixed(2)),
                close: blendedClose,
                q10: eq?.close?.q10 ? Number(eq.close.q10.toFixed(2)) : c.low,
                q25: eq?.close?.q25 ? Number(eq.close.q25.toFixed(2)) : c.low,
                q50: eq?.close?.q50 ? Number(eq.close.q50.toFixed(2)) : blendedClose,
                q75: eq?.close?.q75 ? Number(eq.close.q75.toFixed(2)) : c.high,
                q90: eq?.close?.q90 ? Number(eq.close.q90.toFixed(2)) : c.high,
                kronosQ50: kMember?.candles?.[i]?.close?.q50 ? Number(kMember.candles[i].close.q50.toFixed(2)) : null,
                chronosQ50: cMember?.candles?.[i]?.close?.q50 ? Number(cMember.candles[i].close.q50.toFixed(2)) : null,
                baselineQ50: bMember?.candles?.[i]?.close?.q50 ? Number(bMember.candles[i].close.q50.toFixed(2)) : null,
            };
        });

        // Record member predictions asynchronously to local DB
        const targetTime = _estimateTargetCandleTime(timeframe);
        const memberPreds = (ensembleResult.members || [])
            .filter(m => !m.error && m.candles?.length > 0)
            .map(m => ({
                model_id: m.model_id,
                weight: ensembleResult.ensemble.member_weights?.[m.model_id] ?? 0.25,
                quantiles: m.candles[0],
            }));

        const firstCandle = parsed.candles[0];
        const estAtr = firstCandle ? Math.max(Math.abs(firstCandle.high - firstCandle.low), firstCandle.close * 0.01) : 10.0;
        if (firstCandle) {
            const fvQuantiles = liftPointForecastToQuantiles(firstCandle, estAtr);
            memberPreds.push({ model_id: 'future_vision', weight: 0, quantiles: fvQuantiles });
        }

        Promise.resolve().then(() => {
            recordPredictions({
                instrument: instrumentKey,
                timeframe,
                predictedAt: parsed.predicted_at || new Date().toISOString(),
                targetCandleTime: targetTime,
                regime,
                modelPredictions: memberPreds,
                ensembleQuantiles: calibratedCombined,
                featuresHash: `ensemble_${horizonBars}bars_${result.model || 'auto'}`
            });
        }).catch(recErr => console.error('[PredictionEngine] Async prediction record failed:', recErr.message));

    } else {
        // Fallback: 2-member baseline combiner when python service is unavailable
        const firstCandle = parsed.candles && parsed.candles[0];
        const estAtr = firstCandle ? Math.max(Math.abs(firstCandle.high - firstCandle.low), firstCandle.close * 0.01) : 10.0;
        if (firstCandle) {
            const weightMap = new Map(modelWeights.map(w => [w.model_id, w.weight]));
            const fvWeight = weightMap.get('future_vision') || weightMap.get('naive_baseline') || 0.5;
            const baseWeight = weightMap.get('naive_baseline') || 0.5;

            const fvQuantiles = liftPointForecastToQuantiles(firstCandle, estAtr);
            const baseCandle = { close: firstCandle.open, open: firstCandle.open, high: firstCandle.open + estAtr, low: firstCandle.open - estAtr };
            const baseQuantiles = generateNaiveBaseline(baseCandle, estAtr);

            const combined = combineQuantiles([
                { model_id: 'future_vision', weight: fvWeight, quantiles: fvQuantiles },
                { model_id: 'naive_baseline', weight: baseWeight, quantiles: baseQuantiles }
            ]);
            calibratedCombined = applyConformalCalibration(combined, conformalMultiplier);

            const targetTime = _estimateTargetCandleTime(timeframe);
            Promise.resolve().then(() => {
                recordPredictions({
                    instrument: instrumentKey,
                    timeframe,
                    predictedAt: parsed.predicted_at || new Date().toISOString(),
                    targetCandleTime: targetTime,
                    regime,
                    modelPredictions: [
                        { model_id: 'future_vision', weight: fvWeight, quantiles: fvQuantiles },
                        { model_id: 'naive_baseline', weight: baseWeight, quantiles: baseQuantiles }
                    ],
                    ensembleQuantiles: calibratedCombined,
                    featuresHash: `fv_fallback_${horizonBars}bars_${result.model || 'auto'}`
                });
            }).catch(recErr => console.error('[PredictionEngine] Async prediction record failed:', recErr.message));
        }
    }

    // ── 7. Evaluate Institutional Friction Drag & Statistical Edge ──
    let frictionEvaluation = null;
    let edgeEvaluation = null;
    try {
        edgeEvaluation = getEdgeEvaluation(instrumentKey, timeframe, regime);
        const currentPrice = parsed.candles && parsed.candles[0] ? parsed.candles[0].open : null;
        if (currentPrice && calibratedCombined) {
            frictionEvaluation = evaluateNetEdge({
                currentPrice,
                forecastQuantiles: calibratedCombined,
                instrument: instrumentKey,
                timeframe
            });
        }
    } catch (fErr) {
        console.warn('[FutureVision] Friction evaluation bypassed:', fErr.message);
    }

    // ── 8. Formulate Unified Model Attribution Name ──
    let modelUsed = result.model || 'unknown';
    if (ensembleResult?.success) {
        const localNames = [];
        if (kMember && !kMember.error) localNames.push('Kronos-Small');
        if (cMember && !cMember.error) localNames.push('Chronos-Bolt');
        if (localNames.length > 0) {
            modelUsed = `Praxis Hybrid Ensemble [${localNames.join(' + ')} + ${result.model || 'LLM'}]`;
        }
    }

    return { 
        ...parsed, 
        quantiles: calibratedCombined,
        ensembleQuantiles,
        conformalMultiplier,
        modelWeights,
        friction: frictionEvaluation,
        edge: edgeEvaluation,
        modelUsed,
        cloudModelUsed: result.model || 'unknown',
        ensembleMembers: ensembleResult?.members || [],
        regime,
        latencyMs: result.latencyMs,
        fallbackTriggered: result.fallbackTriggered || false,
        fallbackReason: result.fallbackReason || null
    };
}

/**
 * Extract historical OHLCV candles from contextPayload CSV block.
 */
function _extractCandlesFromPayload(contextPayload) {
    if (!contextPayload || typeof contextPayload !== 'string') return [];
    const marker = 'Date,Open,High,Low,Close,Volume';
    const idx = contextPayload.indexOf(marker);
    if (idx === -1) return [];

    const afterMarker = contextPayload.slice(idx + marker.length).trim();
    const endIdx = afterMarker.indexOf('==');
    const csvContent = endIdx !== -1 ? afterMarker.slice(0, endIdx).trim() : afterMarker;

    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    const candles = [];
    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 5) {
            const timestamp = parts[0]?.trim();
            const open = parseFloat(parts[1]);
            const high = parseFloat(parts[2]);
            const low = parseFloat(parts[3]);
            const close = parseFloat(parts[4]);
            const volume = parts[5] ? parseFloat(parts[5]) : 0;
            if (!isNaN(open) && !isNaN(close) && open > 0 && close > 0) {
                candles.push({ timestamp, open, high, low, close, volume });
            }
        }
    }
    return candles;
}

function _estimateTargetCandleTime(timeframe) {
    const tf = normalizeTimeframe(timeframe);
    const now = new Date();
    let msToAdd = 24 * 3600 * 1000;
    if (tf === '1minute') msToAdd = 60 * 1000;
    else if (tf === '5minute') msToAdd = 5 * 60 * 1000;
    else if (tf === '15minute') msToAdd = 15 * 60 * 1000;
    else if (tf === 'day') msToAdd = 24 * 3600 * 1000;
    else if (tf === 'week') msToAdd = 7 * 24 * 3600 * 1000;
    return new Date(now.getTime() + msToAdd).toISOString();
}

// ─────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────

async function _getRoutingHint() {
    try {
        const routing = await AiRouting.findOne({ isSingleton: true }).lean();
        if (routing?.futureVision?.providerId && routing?.futureVision?.modelId) {
            return { providerId: routing.futureVision.providerId, modelId: routing.futureVision.modelId };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Multi-layer robust JSON parser with server-side guardrail enforcement.
 * Layer 1: Direct JSON.parse
 * Layer 2: Strip markdown fences, retry
 * Layer 3: Regex extract first {...} block
 * Layer 4: Find first { character, slice from there
 */
function _parseAndValidate(rawText, horizonBars) {
    let parsed = null;
    let clean  = rawText.trim();

    // Layer 1: Direct parse
    try { parsed = JSON.parse(clean); } catch {}

    // Layer 2: Strip markdown fences
    if (!parsed) {
        const fence = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (fence) { try { parsed = JSON.parse(fence[1].trim()); } catch {} }
    }

    // Layer 3: Extract first valid JSON object
    if (!parsed) {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) { try { parsed = JSON.parse(match[0]); } catch {} }
    }

    // Layer 4: Slice from first {
    if (!parsed) {
        const idx = clean.indexOf('{');
        if (idx >= 0) { try { parsed = JSON.parse(clean.slice(idx)); } catch {} }
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error(`Future Vision: could not parse AI response. Raw (first 500 chars): ${rawText.slice(0, 500)}`);
    }
    if (!parsed.candles || !Array.isArray(parsed.candles) || parsed.candles.length === 0) {
        throw new Error(`Future Vision: AI response missing "candles" array. Keys found: ${Object.keys(parsed).join(', ')}`);
    }

    // ── Server-side guardrail enforcement ────────────────────────────────────────
        const validated = parsed.candles.slice(0, horizonBars).map((c, i) => {
        const open  = parseFloat(c.open)  || 0;
        const close = parseFloat(c.close) || 0;
        let   high  = Math.max(parseFloat(c.high)  || 0, open, close);
        let   low   = Math.min(parseFloat(c.low)   || high * 0.999, open, close);

        // FATAL GUARDRAIL: Reject hallucinated zeroes or impossible prices from weak models
        if (open === 0 || close === 0 || low <= 0 || low < open * 0.1 || high > open * 10) {
            throw new Error(`AI generated impossible price values (Open: ${open}, Low: ${low}). The selected model is hallucinating. Please select a more capable model in PAI Settings.`);
        }

        // G2: ensure non-degenerate candle
        if (low >= high) low = _round(high * 0.9995);

        let confidence = parseInt(c.confidence, 10);
        if (isNaN(confidence)) confidence = 60;
        confidence = Math.max(10, Math.min(89, confidence));

        return {
            bar:        i + 1,
            open:       _round(open),
            high:       _round(high),
            low:        _round(low),
            close:      _round(close),
            confidence,
            direction:  ['bullish','bearish','neutral'].includes(c.direction) ? c.direction : (close >= open ? 'bullish' : 'bearish'),
            rationale:  String(c.rationale || '').slice(0, 120).replace(/"/g, "'"),
        };
    });

    // G3: Price continuity — snap any gap >2%
    for (let i = 1; i < validated.length; i++) {
        const prevClose = validated[i - 1].close;
        if (prevClose > 0 && Math.abs(validated[i].open - prevClose) / prevClose > 0.02) {
            validated[i].open = prevClose;
            validated[i].high = Math.max(validated[i].high, validated[i].open, validated[i].close);
            validated[i].low  = Math.min(validated[i].low,  validated[i].open, validated[i].close);
            if (validated[i].low >= validated[i].high) validated[i].low = _round(validated[i].high * 0.9995);
        }
    }

    // G4: Price anchoring ±15% of first open
    const firstOpen  = validated[0]?.open || 1;
    const maxAllowed = firstOpen * 1.15;
    const minAllowed = firstOpen * 0.85;
    validated.forEach(c => {
        c.open  = _round(Math.min(Math.max(c.open,  minAllowed), maxAllowed));
        c.high  = _round(Math.min(c.high,  maxAllowed));
        c.low   = _round(Math.max(c.low,   minAllowed));
        c.close = _round(Math.min(Math.max(c.close, minAllowed), maxAllowed));
    });

    // G6: Anti-flat jitter
    for (let i = 2; i < validated.length; i++) {
        if (validated[i-2].close === validated[i-1].close && validated[i-1].close === validated[i].close) {
            const j = validated[i].close * 0.0005;
            validated[i].close = _round(validated[i].close + (i % 2 === 0 ? j : -j));
        }
    }

    return {
        candles:           validated,
        reasoning_summary: String(parsed.reasoning_summary || '').slice(0, 300),
        overall_bias:      ['bullish','bearish','neutral'].includes(parsed.overall_bias) ? parsed.overall_bias : 'neutral',
        key_support:       _round(parseFloat(parsed.key_support)    || 0),
        key_resistance:    _round(parseFloat(parsed.key_resistance)  || 0),
        key_risk:          String(parsed.key_risk || '').slice(0, 150),
        volatility_regime: ['trending','consolidating','breakout_pending','post_event'].includes(parsed.volatility_regime)
            ? parsed.volatility_regime : 'consolidating',
        predicted_at:      parsed.predicted_at || new Date().toISOString(),
    };
}

function _round(v) { return Math.round(v * 100) / 100; }