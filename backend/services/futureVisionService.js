/**
 * @file futureVisionService.js
 * @purpose Backend service for the Future Vision predictive candle engine.
 *
 * Calls aiGateway.process() with the correct Praxis gateway interface:
 *   { taskType, prompt, systemInstruction, jsonMode, schema, maxTokens, temperature, explicitProvider, explicitModel }
 */

import aiGateway from '../ai-gateway/index.js';
import AiRouting from '../models/AiRouting.js';

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

PASS 2 — SCENARIO PLANNING (think, do not output):
  a) Bull case: what technical levels must hold/break for this to play out?
  b) Bear case: what would invalidate the bullish scenario?
  c) Base case (most likely): weight the above based on ALL available evidence
  d) Quantify the expected move range using ATR: typical 1-bar move = 0.5 x ATR to 1.5 x ATR
  e) Account for upcoming events: earnings/dividend within horizon = expand range, add uncertainty
  f) Apply PAE correction: if prior predictions showed systematic bias, apply the stated correction NOW
  g) Apply mode-specific bias: Positional = trend-following, Swing = mean-reversion + momentum, Intraday = scalp within session range

PASS 3 — OUTPUT GENERATION (produce the JSON):
  a) Populate OHLCV for each bar based on the base case from Pass 2
  b) High/Low range should be approximately 0.8 x ATR to 1.5 x ATR per bar
  c) Calibrate confidence: high confluence (trend+volume+indicator agreement) = 70-85, mixed signals = 45-65, contradictory = 25-45
  d) Each bar's rationale must cite the SPECIFIC indicator or candle pattern driving that bar

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

export async function runFutureVisionPrediction(contextPayload, instrumentKey, horizonBars = 7) {
    const routeHint = await _getRoutingHint();

    const gatewayRequest = {
        taskType:           'future_vision_prediction',
        systemInstruction:  SYSTEM_INSTRUCTION,
        prompt:             contextPayload,
        jsonMode:           true,
        temperature:        0.2,
        maxTokens:          3500,
        // If user has explicitly selected a Future Vision model in PAI settings, use it
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
    return { 
        ...parsed, 
        modelUsed: result.model || 'unknown', 
        latencyMs: result.latencyMs,
        fallbackTriggered: result.fallbackTriggered || false,
        fallbackReason: result.fallbackReason || null
    };
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