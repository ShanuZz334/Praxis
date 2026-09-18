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

    // ── 1. Fetch Routing & Model Selection Configuration ──
    const routing = await AiRouting.findOne({ isSingleton: true }).lean();
    const fvConfig = routing?.futureVision || {};
    const activeEnsembleModels = Array.isArray(fvConfig.ensembleModels) && fvConfig.ensembleModels.length > 0
        ? fvConfig.ensembleModels
        : ['master_llm', 'kronos', 'chronos_bolt', 'lag_llama', 'naive_baseline'];
    const customWeights = fvConfig.ensembleWeights || { master_llm: 45, kronos: 25, chronos_bolt: 20, lag_llama: 15, naive_baseline: 10 };

    const useMasterLlm = activeEnsembleModels.includes('master_llm');
    const quantModelIds = ['kronos', 'chronos_bolt', 'lag_llama', 'naive_baseline'];
    const activeQuantModels = activeEnsembleModels.filter(m => quantModelIds.includes(m));
    const useQuantEnsemble = activeQuantModels.length > 0;

    // Calculate normalized weights for all active models
    const rawWeights = {};
    let totalActiveWeight = 0;
    activeEnsembleModels.forEach(m => {
        const w = Number(customWeights[m]) > 0 ? Number(customWeights[m]) : (m === 'master_llm' ? 45 : m === 'kronos' ? 25 : m === 'chronos_bolt' ? 20 : m === 'lag_llama' ? 15 : 10);
        rawWeights[m] = w;
        totalActiveWeight += w;
    });
    if (totalActiveWeight <= 0) totalActiveWeight = 100;
    const normWeights = {};
    activeEnsembleModels.forEach(m => {
        normWeights[m] = rawWeights[m] / totalActiveWeight;
    });

    // Normalized weights specifically for Python ensemble members
    const pythonWeights = {};
    let quantSum = 0;
    activeQuantModels.forEach(m => {
        quantSum += (rawWeights[m] || 1);
    });
    if (quantSum <= 0) quantSum = 1;
    quantModelIds.forEach(m => {
        pythonWeights[m] = activeQuantModels.includes(m) ? ((rawWeights[m] || 1) / quantSum) : 0;
    });

    // ── 2. Parse or Receive Authentic Historical Candles ──
    const histCandles = (Array.isArray(historicalCandles) && historicalCandles.length >= 10)
        ? historicalCandles
        : _extractCandlesFromPayload(contextPayload);

    // ── 3. Run Local Python Foundation Model Ensemble if Enabled ──
    let ensembleResult = null;
    let conformalMultiplier = 1.0;
    let modelWeights = [];
    const calState = getCalibrationState(instrumentKey, timeframe);
    conformalMultiplier = calState.conformal_multiplier || 1.0;

    if (useQuantEnsemble && histCandles && histCandles.length >= 10) {
        try {
            console.log(`[FutureVision] Dispatching to Python foundation ensemble (${activeQuantModels.join(', ')}) | ${histCandles.length} historical bars | horizon=${horizonBars}`);
            ensembleResult = await callEnsembleService({
                instrument: instrumentKey,
                timeframe,
                candles: histCandles.slice(-60),
                horizon: horizonBars,
                weights: pythonWeights
            });
            if (ensembleResult?.success && ensembleResult.ensemble?.candles?.length > 0) {
                console.log(`[FutureVision] Python ensemble SUCCESS | regime=${ensembleResult.regime} | members=${ensembleResult.ensemble.n_members} | ${ensembleResult.total_ms.toFixed(0)}ms`);
            } else if (ensembleResult && !ensembleResult.success) {
                console.warn(`[FutureVision] Python ensemble returned error: ${ensembleResult.error}`);
            }
        } catch (ensErr) {
            console.warn(`[FutureVision] Python ensemble execution error: ${ensErr.message}`);
        }
    } else if (useQuantEnsemble) {
        console.warn(`[FutureVision] Insufficient historical candles for foundation models (found ${histCandles ? histCandles.length : 0} bars).`);
    }

    // ── 4. Inject Foundation Models Consensus into Context Prompt ──
    let enrichedPayload = contextPayload;
    const kMember = ensembleResult?.members?.find(m => m.model_id === 'kronos' && !m.error);
    const cMember = ensembleResult?.members?.find(m => m.model_id === 'chronos_bolt' && !m.error);
    const lMember = ensembleResult?.members?.find(m => m.model_id === 'lag_llama' && !m.error);
    const bMember = ensembleResult?.members?.find(m => m.model_id === 'naive_baseline' && !m.error);

    if (useMasterLlm && ensembleResult?.success && ensembleResult.ensemble?.candles?.length > 0) {
        let block = `\n================================================================================\n`;
        block += `BLOCK 0B - LOCAL TIME-SERIES FOUNDATION MODEL CONSENSUS (${activeQuantModels.map(m => m.toUpperCase()).join(' & ')})\n`;
        block += `================================================================================\n`;
        block += `The on-premise quantitative foundation models\n`;
        block += `have computed the following mathematical probabilistic trajectory:\n`;
        block += `- Market Regime Detected: ${ensembleResult.regime}\n`;
        block += `- Active Quant Weights: ${activeQuantModels.map(m => `${m} (${((pythonWeights[m] || 0)*100).toFixed(1)}%)`).join(', ')}\n\n`;
        block += `Quantitative Trajectory Across ${horizonBars} Forward Bars:\n`;

        ensembleResult.ensemble.candles.slice(0, horizonBars).forEach((c, idx) => {
            const kC = kMember?.candles?.[idx]?.close?.q50 ? kMember.candles[idx].close.q50.toFixed(2) : 'N/A';
            const cC = cMember?.candles?.[idx]?.close?.q50 ? cMember.candles[idx].close.q50.toFixed(2) : 'N/A';
            const lC = lMember?.candles?.[idx]?.close?.q50 ? lMember.candles[idx].close.q50.toFixed(2) : 'N/A';
            const ensC = c.close?.q50 ? c.close.q50.toFixed(2) : 'N/A';
            const q10 = c.close?.q10 ? c.close.q10.toFixed(2) : 'N/A';
            const q90 = c.close?.q90 ? c.close.q90.toFixed(2) : 'N/A';
            block += `  Bar ${idx + 1}: Consensus Close=${ensC} | 80% Cone=[${q10} to ${q90}] | Kronos=${kC} | ChronosBolt=${cC} | LagLlama=${lC}\n`;
        });

        block += `\nCRITICAL INSTRUCTION: Reconcile your price action analysis with the above quantitative foundation consensus.\nAnchor predicted price levels around this mathematical baseline.\n`;
        enrichedPayload = block + '\n' + contextPayload;
    }

    // ── 5. Generate Predictions: LLM vs Direct Quantitative Consensus ──
    let result = null;
    let parsed = null;

    if (useMasterLlm) {
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

        result = await aiGateway.process(gatewayRequest);

        if (result.error) {
            throw new Error(`AI Gateway error for Future Vision: ${result.message || result.details || 'Unknown error'}`);
        }

        const rawText = result.text || result.content || '';
        if (!rawText) {
            throw new Error('AI Gateway returned empty response for Future Vision prediction');
        }

        console.log(`[FutureVision] Response received | model=${result.model} | latency=${result.latencyMs}ms | chars=${rawText.length}`);
        parsed = _parseAndValidate(rawText, horizonBars);
    } else {
        // Master LLM turned off by user: synthesize directly from quantitative ensemble or baseline
        console.log(`[FutureVision] Master LLM disabled by user settings. Using pure quantitative ensemble [${activeQuantModels.join(', ')}].`);
        const lastHist = histCandles && histCandles.length > 0 ? histCandles[histCandles.length - 1] : { close: 100, open: 100 };
        const estAtr = Math.max(0.5, (lastHist.high || lastHist.close) - (lastHist.low || lastHist.close) || lastHist.close * 0.01);
        
        let quantCandles = [];
        if (ensembleResult?.success && ensembleResult.ensemble?.candles?.length > 0) {
            let prevC = lastHist.close;
            quantCandles = ensembleResult.ensemble.candles.slice(0, horizonBars).map((ec, idx) => {
                const openP = prevC;
                const closeP = ec.close?.q50 ? Number(ec.close.q50.toFixed(2)) : openP;
                const highP = ec.high?.q50 ? Number(Math.max(openP, closeP, ec.high.q50).toFixed(2)) : Math.max(openP, closeP) + estAtr * 0.3;
                const lowP = ec.low?.q50 ? Number(Math.min(openP, closeP, ec.low.q50).toFixed(2)) : Math.min(openP, closeP) - estAtr * 0.3;
                prevC = closeP;
                return {
                    bar: idx + 1,
                    open: Number(openP.toFixed(2)),
                    high: Number(highP.toFixed(2)),
                    low: Number(lowP.toFixed(2)),
                    close: Number(closeP.toFixed(2)),
                    confidence: 78,
                    direction: closeP >= openP ? 'bullish' : 'bearish',
                    rationale: `Quantitative ensemble consensus (${activeQuantModels.join(' + ')})`
                };
            });
        } else {
            // Pure native JS baseline fallback
            let prevC = lastHist.close;
            for (let i = 0; i < horizonBars; i++) {
                const baseQuantiles = generateNaiveBaseline({ close: prevC, open: prevC, high: prevC + estAtr, low: prevC - estAtr }, estAtr);
                const closeP = Number((baseQuantiles.q50_c ?? baseQuantiles.close?.q50 ?? prevC).toFixed(2));
                const openP = prevC;
                const highP = Number((baseQuantiles.q50_h ?? (Math.max(openP, closeP) + estAtr * 0.3)).toFixed(2));
                const lowP = Number((baseQuantiles.q50_l ?? (Math.min(openP, closeP) - estAtr * 0.3)).toFixed(2));
                prevC = closeP;
                quantCandles.push({
                    bar: i + 1,
                    open: openP,
                    high: highP,
                    low: lowP,
                    close: closeP,
                    confidence: 65,
                    direction: closeP >= openP ? 'bullish' : 'bearish',
                    rationale: `Statistical drift & ATR baseline fallback`
                });
            }
        }

        const isBull = quantCandles[0].close >= quantCandles[0].open;
        parsed = {
            reasoning_summary: `Direct quantitative ensemble forecast computed via [${activeQuantModels.join(', ')}] with zero qualitative LLM variance.`,
            candles: quantCandles,
            overall_bias: isBull ? 'bullish' : 'bearish',
            key_support: Number(Math.min(...quantCandles.map(c => c.low)).toFixed(2)),
            key_resistance: Number(Math.max(...quantCandles.map(c => c.high)).toFixed(2)),
            key_risk: 'Macro momentum departure from statistical distribution cones',
            volatility_regime: (ensembleResult?.regime || 'choppy').toLowerCase(),
            predicted_at: new Date().toISOString()
        };

        result = {
            model: `Quant Ensemble [${activeQuantModels.join(' + ')}]`,
            latencyMs: ensembleResult?.total_ms || 15,
            fallbackTriggered: false
        };
    }

    // ── 5. PACE Mathematical Bias Correction Layer ──
    const profile = getCalibrationProfile(instrumentKey, timeframe);
    if (profile && parsed?.candles) {
        parsed.candles = applyBiasCorrection(parsed.candles, profile);
        console.log(`[PACE] Applied Math Correction | Strength: ${(profile.correctionStrength*100).toFixed(0)}%`);
    }

    // ── 6. Probabilistic Multi-Model Blending & Quantiles ──
    let calibratedCombined = null;
    let ensembleQuantiles = [];

    const regime = (ensembleResult?.regime || parsed?.volatility_regime || 'CHOPPY').toUpperCase();
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

        // Dynamic multi-model blending between Quantitative Ensemble and Master LLM
        const blendedCandles = [];
        const rawSlice = (parsed.candles || []).slice(0, horizonBars);
        const llmRatio = useMasterLlm ? (normWeights['master_llm'] || 0) : 0;
        const quantRatio = useQuantEnsemble ? (1 - llmRatio) : 0;

        for (let i = 0; i < rawSlice.length; i++) {
            const c = rawSlice[i];
            const eq = ensembleQuantiles[i];
            const ensClose = eq?.close?.q50;
            let blendedClose = c.close;
            if (ensClose && !isNaN(ensClose) && ensClose > 0 && useQuantEnsemble) {
                blendedClose = useMasterLlm
                    ? Number((quantRatio * ensClose + llmRatio * c.close).toFixed(2))
                    : Number(ensClose.toFixed(2));
            } else if (!useQuantEnsemble) {
                blendedClose = Number(c.close.toFixed(2));
            }

            let openPrice = c.open;
            if (i > 0 && blendedCandles[i - 1]) {
                openPrice = blendedCandles[i - 1].close;
            }

            // Harmonize shadow ranges to prevent extreme artificial wicks (FC-005)
            const llmRange = Math.max(0.01, c.high - c.low);
            const ensRange = (eq?.high?.q50 && eq?.low?.q50) ? Math.max(0.01, eq.high.q50 - eq.low.q50) : llmRange;
            const blendRange = (useMasterLlm && useQuantEnsemble)
                ? (quantRatio * ensRange + llmRatio * llmRange)
                : (useQuantEnsemble ? ensRange : llmRange);

            const bodyMax = Math.max(openPrice, blendedClose);
            const bodyMin = Math.min(openPrice, blendedClose);
            const upWickRatio = Math.max(0, c.high - Math.max(c.open, c.close)) / llmRange;
            const downWickRatio = Math.max(0, Math.min(c.open, c.close) - c.low) / llmRange;
            const highPrice = Number(Math.max(bodyMax + (blendRange * upWickRatio), bodyMax).toFixed(2));
            const lowPrice  = Number(Math.min(bodyMin - (blendRange * downWickRatio), bodyMin).toFixed(2));
            const isBull = blendedClose >= openPrice;
            const direction = isBull ? 'bullish' : 'bearish';

            blendedCandles.push({
                ...c,
                open: openPrice,
                high: Number(highPrice.toFixed(2)),
                low: Number(lowPrice.toFixed(2)),
                close: blendedClose,
                direction,
                q10: eq?.close?.q10 ? Number(eq.close.q10.toFixed(2)) : lowPrice,
                q25: eq?.close?.q25 ? Number(eq.close.q25.toFixed(2)) : lowPrice,
                q50: eq?.close?.q50 ? Number(eq.close.q50.toFixed(2)) : blendedClose,
                q75: eq?.close?.q75 ? Number(eq.close.q75.toFixed(2)) : highPrice,
                q90: eq?.close?.q90 ? Number(eq.close.q90.toFixed(2)) : highPrice,
                kronosQ50: kMember?.candles?.[i]?.close?.q50 ? Number(kMember.candles[i].close.q50.toFixed(2)) : null,
                chronosQ50: cMember?.candles?.[i]?.close?.q50 ? Number(cMember.candles[i].close.q50.toFixed(2)) : null,
                lagLlamaQ50: lMember?.candles?.[i]?.close?.q50 ? Number(lMember.candles[i].close.q50.toFixed(2)) : null,
                baselineQ50: bMember?.candles?.[i]?.close?.q50 ? Number(bMember.candles[i].close.q50.toFixed(2)) : null,
            });
        }
        parsed.candles = blendedCandles;

        // Record member predictions asynchronously to local DB
        // Record member predictions for ALL horizon steps asynchronously to local DB (FA-011)
        Promise.resolve().then(() => {
            parsed.candles.forEach((candle, stepIdx) => {
                const targetTime = _estimateTargetCandleTime(timeframe, stepIdx);
                const memberPreds = (ensembleResult.members || [])
                    .filter(m => !m.error && m.candles?.length > stepIdx)
                    .map(m => ({
                        model_id: m.model_id,
                        weight: ensembleResult.ensemble.member_weights?.[m.model_id] ?? 0.25,
                        quantiles: m.candles[stepIdx],
                    }));

                const estAtr = Math.max(Math.abs(candle.high - candle.low), candle.close * 0.01, 1.0);
                const fvQuantiles = liftPointForecastToQuantiles(candle, estAtr);
                memberPreds.push({ model_id: 'future_vision', weight: 0, quantiles: fvQuantiles });

                const stepEq = ensembleResult.ensemble?.candles?.[stepIdx] || null;

                recordPredictions({
                    instrument: instrumentKey,
                    timeframe,
                    predictedAt: parsed.predicted_at || new Date().toISOString(),
                    targetCandleTime: targetTime,
                    regime,
                    modelPredictions: memberPreds,
                    ensembleQuantiles: stepEq,
                    featuresHash: `ensemble_h${stepIdx + 1}_${horizonBars}bars_${result.model || 'auto'}`
                });
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
    const contributingModels = [];
    if (useMasterLlm) contributingModels.push(result.model || 'Master LLM');
    if (activeQuantModels.includes('kronos') && kMember && !kMember.error) contributingModels.push('Kronos');
    if (activeQuantModels.includes('chronos_bolt') && cMember && !cMember.error) contributingModels.push('Chronos-Bolt');
    if (activeQuantModels.includes('lag_llama') && lMember && !lMember.error) contributingModels.push('Lag-Llama');
    if (activeQuantModels.includes('naive_baseline')) contributingModels.push('Baseline Drift');

    let modelUsed = contributingModels.length > 1
        ? `Praxis Ensemble [${contributingModels.join(' + ')}]`
        : (contributingModels[0] || result.model || 'Praxis Multi-Model');

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
        fallbackReason: result.fallbackReason || null,
        activeModels: activeEnsembleModels,
        ensembleConfig: {
            activeModels: activeEnsembleModels,
            weights: normWeights
        }
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

function _estimateTargetCandleTime(timeframe, stepIndex = 0) {
    const tf = normalizeTimeframe(timeframe);
    const now = new Date();
    if (tf === 'day' || tf === 'week') {
        let target = new Date(now.getTime());
        const daysToAdd = stepIndex + 1;
        let added = 0;
        while (added < daysToAdd) {
            target = new Date(target.getTime() + 24 * 3600 * 1000);
            const istDate = new Date(target.getTime() + (5.5 * 3600000));
            const istDay = istDate.getUTCDay();
            if (istDay !== 0 && istDay !== 6) {
                added++;
            }
        }
        return target.toISOString();
    }
    let stepMs = 15 * 60 * 1000;
    if (tf === '1minute') stepMs = 60 * 1000;
    else if (tf === '3minute') stepMs = 3 * 60 * 1000;
    else if (tf === '5minute') stepMs = 5 * 60 * 1000;
    else if (tf === '15minute') stepMs = 15 * 60 * 1000;
    else if (tf === '30minute') stepMs = 30 * 60 * 1000;
    // Align now to candle interval boundary so prediction resolution accurately matches candle timestamps
    const roundedNow = Math.floor(now.getTime() / stepMs) * stepMs;
    return new Date(roundedNow + stepMs * (stepIndex + 1)).toISOString();
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

    // G4: Price anchoring ±15% of first open (FB-004 fix: strict physical invariants)
    const firstOpen  = validated[0]?.open || 1;
    const maxAllowed = firstOpen * 1.15;
    const minAllowed = firstOpen * 0.85;
    validated.forEach(c => {
        c.open  = _round(Math.min(Math.max(c.open,  minAllowed), maxAllowed));
        c.high  = _round(Math.min(Math.max(c.high,  minAllowed), maxAllowed));
        c.low   = _round(Math.min(Math.max(c.low,   minAllowed), maxAllowed));
        c.close = _round(Math.min(Math.max(c.close, minAllowed), maxAllowed));
        c.high  = Math.max(c.high, c.open, c.close);
        c.low   = Math.min(c.low, c.open, c.close);
        if (c.low >= c.high) c.high = _round(c.low * 1.0005);
    });

    // G6: Anti-flat jitter
    for (let i = 2; i < validated.length; i++) {
        if (validated[i-2].close === validated[i-1].close && validated[i-1].close === validated[i].close) {
            const j = validated[i].close * 0.0005;
            validated[i].close = _round(validated[i].close + (i % 2 === 0 ? j : -j));
            validated[i].high  = Math.max(validated[i].high, validated[i].close);
            validated[i].low   = Math.min(validated[i].low,  validated[i].close);
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