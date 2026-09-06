/**
 * @file futureVisionContextAssembler.js
 * @purpose Builds the full institutional-grade 6-block context payload for Future Vision.
 *
 * Key design: we do NOT just forward raw numbers. We pre-compute derived analytics
 * from the OHLCV data and indicator values so the AI receives actionable, pre-digested
 * intelligence rather than a pile of raw CSVs to interpret.
 *
 * Derived analytics computed here:
 *   - Swing high/low detection (support & resistance levels)
 *   - Price change statistics (recent momentum, drawdown, range expansion)
 *   - Candlestick pattern detection (last 5 bars)
 *   - Volume profile classification
 *   - Volatility regime classification (ATR trend: expanding vs contracting)
 *   - Market-hours awareness (NSE session timing)
 *   - Fundamental valuation signal (over/under/fair value vs sector)
 */

import { getPAEReport } from './predictionAccuracyEngine';

const FV_SETTINGS_KEY = 'praxis_future_vision_settings';

// ─────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────

export function getFVSettings() {
    try {
        const s = JSON.parse(localStorage.getItem(FV_SETTINGS_KEY) || '{}');
        return {
            horizonBars:         s.horizonBars         ?? 7,
            ohlcvBars:           s.ohlcvBars           ?? 50,
            showCone:            s.showCone            ?? true,
            autoRefreshOnNewBar: s.autoRefreshOnNewBar ?? false,
            confidenceHigh:      s.confidenceHigh      ?? 75,
            confidenceLow:       s.confidenceLow       ?? 50,
        };
    } catch {
        return { horizonBars: 7, ohlcvBars: 50, showCone: true, autoRefreshOnNewBar: false, confidenceHigh: 75, confidenceLow: 50 };
    }
}

export function saveFVSettings(updates) {
    const cur = getFVSettings();
    localStorage.setItem(FV_SETTINGS_KEY, JSON.stringify({ ...cur, ...updates }));
}

// ─────────────────────────────────────────────────────────────────────
// MAIN ASSEMBLER
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {Array}  params.ohlcv         [{time,open,high,low,close,volume}]
 * @param {string} params.instrumentKey e.g. "NSE_EQ|INE008A01015"
 * @param {string} params.symbol        e.g. "AXISBANK"
 * @param {string} params.timeframe     e.g. "15m"
 * @param {string} params.tradingMode   "positional"|"swing"|"intraday"
 * @param {object} params.indicators    live snapshot from chart
 * @param {object} params.fundamentals  from DataRegistry
 * @param {Array}  params.events        upcoming events array
 * @param {number} params.horizonBars
 */
export function assembleContext({
    ohlcv = [],
    instrumentKey = '',
    symbol = '',
    timeframe = 'day',
    tradingMode = 'swing',
    indicators = {},
    fundamentals = {},
    events = [],
    horizonBars = 7,
    ohlcvBars = 50,
    aiNarratives = {}
}) {
    // ─── Pre-process OHLCV ────────────────────────────────────────────
    const clampedBars = Math.max(10, Math.min(ohlcvBars, 200));
    const windowMain = ohlcv.slice(-clampedBars);
    const window20 = ohlcv.slice(-Math.min(20, clampedBars));
    const window5  = ohlcv.slice(-5);
    const last     = windowMain.at(-1) ?? {};
    const prev     = windowMain.at(-2) ?? {};
    const lastClose = last.close ?? 0;

    // ─── Block 1A: Raw OHLCV CSV ──────────────────────────────────────
    const ohlcvCsv = windowMain
        .map(c => `${_formatTime(c.time)},${_f2(c.open)},${_f2(c.high)},${_f2(c.low)},${_f2(c.close)},${Math.round(c.volume ?? 0)}`)
        .join('\n');

    // ─── Block 1B: Derived Price Analytics ───────────────────────────
    const priceAnalytics = _computePriceAnalytics(windowMain, window20, window5, last, prev, indicators);

    const _trim = (s, n = 800) => s && s.length > n ? s.substring(0, n) + '...' : (s || 'N/A');
    const technicalBlock   = _trim(aiNarratives['Technical']);
    const fundamentalBlock = _trim(aiNarratives['Fundamentals']);
    const eventBlock       = _trim(aiNarratives['Events']);
    const optionsBlock     = _trim(aiNarratives['Options']);
    const globalBlock      = _trim(aiNarratives['Global']);
    const sessionBlock = _computeSessionBlock(tradingMode, timeframe, horizonBars);
    const paeReport = getPAEReport(instrumentKey, timeframe);

    return `
  ================================================================================
  PRAXIS FUTURE VISION - PREDICTION BRIEF
  ================================================================================
  
  INSTRUMENT : ${symbol}
  KEY        : ${instrumentKey}
  TIMEFRAME  : ${timeframe}
  MODE       : ${tradingMode.toUpperCase()}
  LAST_CLOSE : ${_f2(lastClose)}
  HORIZON    : ${horizonBars} candles forward
  REQUESTED  : ${new Date().toISOString()} (UTC)
  
  ================================================================================
  BLOCK 1 - PRICE ACTION
  ================================================================================
  
  A 1.1 RAW OHLCV - Last ${windowMain.length} bars (format: time,O,H,L,C,V)
  Note: Most recent bar at the bottom. Analyse recency-weighted.
  ${ohlcvCsv}
  
  A 1.2 DERIVED PRICE ANALYTICS (pre-computed for you)
  ${priceAnalytics}
  
  ================================================================================
  BLOCK 2 - TECHNICAL NARRATIVE
  ================================================================================
  ${technicalBlock}
  
  ================================================================================
  BLOCK 3 - FUNDAMENTAL NARRATIVE
  ================================================================================
  ${fundamentalBlock}
  
  ================================================================================
  BLOCK 4 - EVENTS NARRATIVE
  ================================================================================
  ${eventBlock}
  
  ================================================================================
  BLOCK 4.1 - OPTIONS NARRATIVE
  ================================================================================
  ${optionsBlock}
  
  ================================================================================
  BLOCK 4.2 - GLOBAL MACRO NARRATIVE
  ================================================================================
  ${globalBlock}
  
  ================================================================================
  BLOCK 5 - SESSION & MODE CONTEXT
  ================================================================================
  ${sessionBlock}
  
  ================================================================================
  BLOCK 6 - PREDICTION ACCURACY ENGINE (PAE) REPORT
  ================================================================================
  
  ${paeReport}

════════════════════════════════════════════════════════
YOUR TASK
════════════════════════════════════════════════════════

1. Follow the 3-pass Reasoning Protocol from your system instructions.
2. Identify the most probable price path for the next ${horizonBars} candles.
3. First bar open MUST equal ₹${_f2(lastClose)} exactly.
4. Apply any PAE correction stated in Block 6 before generating close prices.
5. Output exactly ${horizonBars} candle objects in the JSON schema.
6. All guardrails G1–G10 are enforced server-side — violations will be rejected.`;
}

// ─────────────────────────────────────────────────────────────────────
// DERIVED ANALYTICS COMPUTERS
// ─────────────────────────────────────────────────────────────────────

function _computePriceAnalytics(w96, w20, w5, last, prev, indicators) {
    const lines = [];
    const lc = last.close ?? 0;
    const lo = last.open  ?? 0;

    // Momentum
    const chg1bar = prev.close ? ((lc - prev.close) / prev.close * 100) : null;
    const first20 = w20[0]?.close;
    const chg20   = first20 ? ((lc - first20) / first20 * 100) : null;

    if (chg1bar != null) lines.push(`Last bar change       : ${chg1bar >= 0 ? '+' : ''}${_f2(chg1bar)}%`);
    if (chg20   != null) lines.push(`20-bar change         : ${chg20 >= 0 ? '+' : ''}${_f2(chg20)}%`);

    // True Range / Volatility
    const atr5 = _computeATR(w5);
    const atr20 = _computeATR(w20);
    if (atr5)  lines.push(`ATR(5)                : ₹${_f2(atr5)} (${_f2(atr5/lc*100)}% of price)`);
    if (atr20) lines.push(`ATR(20)               : ₹${_f2(atr20)} (${_f2(atr20/lc*100)}% of price)`);
    if (atr5 && atr20) {
        const volRegime = atr5 > atr20 * 1.15 ? 'EXPANDING (trending/volatile)' : atr5 < atr20 * 0.85 ? 'CONTRACTING (squeeze — breakout pending)' : 'STABLE';
        lines.push(`Volatility regime     : ${volRegime}`);
    }

    // Swing Highs/Lows (last 20 bars) — key S/R
    const highs20 = w20.map(c => c.high).filter(Boolean);
    const lows20  = w20.map(c => c.low).filter(Boolean);
    if (highs20.length) lines.push(`20-bar swing HIGH     : ₹${_f2(Math.max(...highs20))} (resistance)`);
    if (lows20.length)  lines.push(`20-bar swing LOW      : ₹${_f2(Math.min(...lows20))} (support)`);

    // Price position within 20-bar range
    if (highs20.length && lows20.length) {
        const rangeHigh = Math.max(...highs20), rangeLow = Math.min(...lows20);
        const position  = rangeHigh !== rangeLow ? ((lc - rangeLow) / (rangeHigh - rangeLow) * 100) : 50;
        lines.push(`Price in 20-bar range : ${_f1(position)}% (0=bottom, 100=top)`);
        if (position > 80) lines.push(`  → Near range TOP — watch for resistance / distribution`);
        if (position < 20) lines.push(`  → Near range BOTTOM — watch for support / accumulation`);
    }

    // Volume trend
    const vol5avg  = w5.length  ? w5.reduce((a, c)  => a + (c.volume ?? 0), 0) / w5.length  : null;
    const vol20avg = w20.length ? w20.reduce((a, c) => a + (c.volume ?? 0), 0) / w20.length : null;
    if (vol5avg && vol20avg) {
        const volRatio = vol5avg / vol20avg;
        const volLabel = volRatio > 1.3 ? 'ABOVE AVERAGE (strong conviction)' : volRatio < 0.7 ? 'BELOW AVERAGE (weak conviction)' : 'AVERAGE';
        lines.push(`Volume (5-bar vs 20)  : ${_f2(vol5avg / 1000)}K vs ${_f2(vol20avg / 1000)}K — ${volLabel}`);
    }

    // Candlestick pattern detection (last 5 bars)
    const patterns = _detectCandlePatterns(w5);
    if (patterns.length) lines.push(`Candle patterns (L5)  : ${patterns.join(', ')}`);
    else lines.push(`Candle patterns (L5)  : No classic pattern — price in equilibrium`);

    // Last candle anatomy
    const lastRange = (last.high ?? 0) - (last.low ?? 0);
    const lastBody  = Math.abs(lc - lo);
    if (lastRange > 0) {
        const bodyRatio = (lastBody / lastRange * 100).toFixed(0);
        const wickUp    = ((last.high ?? 0) - Math.max(lc, lo)) / lastRange * 100;
        const wickDn    = (Math.min(lc, lo) - (last.low ?? 0)) / lastRange * 100;
        lines.push(`Last candle anatomy   : Body ${bodyRatio}% of range | Upper wick ${_f1(wickUp)}% | Lower wick ${_f1(wickDn)}%`);
        if (wickUp > 40 && lc < lo)  lines.push(`  → Long upper wick on red bar — REJECTION / bearish signal`);
        if (wickDn > 40 && lc > lo)  lines.push(`  → Long lower wick on green bar — SUPPORT HOLD / bullish signal`);
        if (bodyRatio < 15)          lines.push(`  → Doji / indecision — market at inflection point`);
    }

    return lines.join('\n');
}

function _computeTechnicalBlock(ind, lastClose, tradingMode) {
    const {
        rsi = null, rsiSignal = null,
        macdLine = null, macdSignal = null, macdHist = null,
        supertrendDir = null,
        ema9 = null, ema21 = null, ema50 = null,
        vwap = null,
        bandsMode = tradingMode === 'intraday' ? 'scalp' : 'swing',
        bandsUpper = null, bandsLower = null, bandsMid = null,
        bandsWidth = null,
        atr14 = null,
    } = ind;

    const lines = [];

    // RSI with overbought/oversold context
    if (rsi != null) {
        let rsiCtx = rsiSignal || (rsi > 70 ? 'OVERBOUGHT — reversal risk elevated' : rsi < 30 ? 'OVERSOLD — bounce potential' : rsi > 55 ? 'Bullish momentum zone' : rsi < 45 ? 'Bearish momentum zone' : 'Neutral');
        lines.push(`RSI(14)         : ${_f1(rsi)} — ${rsiCtx}`);
    }

    // MACD with histogram interpretation
    if (macdLine != null && macdSignal != null) {
        const macdCross = macdLine > macdSignal ? 'Bullish (line above signal)' : 'Bearish (line below signal)';
        const histDir   = macdHist != null ? (macdHist >= 0 ? 'positive & ' + (Math.abs(macdHist) > 0 ? 'expanding' : 'flattening') : 'negative & ' + 'expanding') : '';
        lines.push(`MACD            : line=${_f2(macdLine)}, signal=${_f2(macdSignal)}, hist=${_f2(macdHist)} — ${macdCross}, histogram ${histDir}`);
    }

    // Supertrend (trend direction + support/resistance level)
    if (supertrendDir) {
        lines.push(`Supertrend      : ${supertrendDir.toUpperCase()} — primary trend is ${supertrendDir === 'bullish' ? 'UP, Supertrend acts as dynamic support' : 'DOWN, Supertrend acts as dynamic resistance'}`);
    }

    // EMA crossover & price vs EMA
    if (ema9 != null && ema21 != null) {
        const emaCross = ema9 > ema21 ? 'EMA9 > EMA21 (Golden Cross — bullish structure)' : 'EMA9 < EMA21 (Death Cross — bearish structure)';
        const priceVsEMA = lastClose > ema9 && lastClose > ema21 ? 'Price ABOVE both EMAs (strong uptrend)'
            : lastClose < ema9 && lastClose < ema21 ? 'Price BELOW both EMAs (strong downtrend)'
            : lastClose > ema21 && lastClose < ema9 ? 'Price between EMAs (pullback in uptrend / potential recovery)'
            : 'Price between EMAs (bounce in downtrend / potential rejection)';
        lines.push(`EMA 9/21        : ${_f2(ema9)} / ${_f2(ema21)} — ${emaCross}`);
        lines.push(`Price vs EMAs   : ${priceVsEMA}`);
    }
    if (ema50 != null) {
        lines.push(`EMA 50          : ₹${_f2(ema50)} — Price is ${lastClose >= ema50 ? 'ABOVE (macro bullish)' : 'BELOW (macro bearish)'}`);
    }

    // VWAP — intraday anchor
    if (vwap != null) {
        const vwapDist = ((lastClose - vwap) / vwap * 100);
        lines.push(`VWAP            : ₹${_f2(vwap)} — Price ${vwapDist >= 0 ? '+' : ''}${_f2(vwapDist)}% ${lastClose >= vwap ? 'ABOVE (institutional bias LONG)' : 'BELOW (institutional bias SHORT)'}`);
    }

    // Adaptive Bands
    if (bandsWidth != null) {
        lines.push(`Adaptive Bands  : Mode=${bandsMode}, Width=₹${_f2(bandsWidth)}${bandsUpper ? `, Upper=₹${_f2(bandsUpper)}, Lower=₹${_f2(bandsLower)}, Mid=₹${_f2(bandsMid)}` : ''}`);
        if (atr14 && bandsWidth < atr14 * 0.8) lines.push(`  → BAND SQUEEZE active — breakout setup, direction undetermined`);
    }

    if (atr14 != null) {
        lines.push(`ATR(14)         : ₹${_f2(atr14)} — Expected single-bar range: ₹${_f2(atr14*0.7)}–₹${_f2(atr14*1.5)}`);
        lines.push(`  → For ${horizonBarLabel(ind._horizonBars)}: total expected range ≈ ₹${_f2(atr14 * Math.sqrt(ind._horizonBars ?? 7))}`);
    }

    // Options market data (from Options page registry)
    const { pcr = null, ivRank = null, maxPain = null } = ind;
    if (pcr != null || ivRank != null || maxPain != null) {
        const optLines = [];
        if (pcr != null) {
            const pcrCtx = pcr > 1.2 ? 'BULLISH (high put buying = contrarian bullish)' : pcr < 0.7 ? 'BEARISH (call heavy = contrarian bearish)' : 'NEUTRAL';
            optLines.push(`PCR: ${_f2(pcr)} — ${pcrCtx}`);
        }
        if (ivRank != null) optLines.push(`IV Rank: ${_f1(ivRank)}% ${ivRank > 70 ? '(HIGH IV — premium rich, expect mean reversion)' : ivRank < 30 ? '(LOW IV — cheap options, expect expansion)' : ''}`);
        if (maxPain != null) optLines.push(`Max Pain: ₹${_f2(maxPain)}`);
        lines.push(`Options Data    : ${optLines.join(', ')}`);
    }

    if (!lines.length) return 'No technical indicator data available. Base prediction on price action only.';
    return lines.join('\n');
}

function horizonBarLabel(n) { return n ? `${n}-bar horizon` : 'the horizon'; }

function _computeFundamentalBlock(f) {
    const lines = [];

    if (!f || Object.keys(f).length === 0) {
        return 'Fundamental data not available. Do not fabricate any fundamental metrics.';
    }

    // Valuation
    const valLines = [];
    if (f.pe      != null) valLines.push(`PE: ${_f1(f.pe)}`);
    if (f.forwardPE != null) valLines.push(`Forward PE: ${_f1(f.forwardPE)}`);
    if (f.pb      != null) valLines.push(`PB: ${_f2(f.pb)}`);
    if (f.evEbitda != null) valLines.push(`EV/EBITDA: ${_f1(f.evEbitda)}x`);
    if (valLines.length) {
        lines.push(`Valuation       : ${valLines.join(', ')}`);
        if (f.pe && f.forwardPE) {
            if (f.pe > f.forwardPE * 1.1) lines.push(`  → Trailing PE > Forward PE: earnings expected to GROW — constructive`);
            else if (f.pe < f.forwardPE * 0.9) lines.push(`  → Trailing PE < Forward PE: earnings expected to DECLINE — caution`);
        }
    }

    // Growth
    const growLines = [];
    if (f.epsGrowth      != null) growLines.push(`EPS YoY: ${f.epsGrowth >= 0 ? '+' : ''}${_f1(f.epsGrowth)}%`);
    if (f.revenueGrowth  != null) growLines.push(`Revenue YoY: ${f.revenueGrowth >= 0 ? '+' : ''}${_f1(f.revenueGrowth)}%`);
    if (f.profitGrowth   != null) growLines.push(`Profit YoY: ${f.profitGrowth >= 0 ? '+' : ''}${_f1(f.profitGrowth)}%`);
    if (growLines.length) lines.push(`Growth          : ${growLines.join(', ')}`);

    // Quality / margins
    const qualLines = [];
    if (f.netMargin      != null) qualLines.push(`Net Margin: ${_f1(f.netMargin)}%`);
    if (f.operatingMargin != null) qualLines.push(`Op. Margin: ${_f1(f.operatingMargin)}%`);
    if (f.roe            != null) qualLines.push(`ROE: ${_f1(f.roe)}%`);
    if (f.roce           != null) qualLines.push(`ROCE: ${_f1(f.roce)}%`);
    if (qualLines.length) lines.push(`Quality         : ${qualLines.join(', ')}`);

    // Balance sheet health
    const bsLines = [];
    if (f.debtToEquity   != null) bsLines.push(`D/E: ${_f2(f.debtToEquity)}`);
    if (f.interestCoverage != null) bsLines.push(`Int. Coverage: ${_f1(f.interestCoverage)}x`);
    if (f.currentRatio   != null) bsLines.push(`Current Ratio: ${_f2(f.currentRatio)}`);
    if (bsLines.length) lines.push(`Balance Sheet   : ${bsLines.join(', ')}`);

    // Institutional ownership
    const instLines = [];
    if (f.promoterHolding != null) instLines.push(`Promoter: ${_f1(f.promoterHolding)}%`);
    if (f.fiiHolding      != null) instLines.push(`FII: ${_f1(f.fiiHolding)}%`);
    if (f.diiHolding      != null) instLines.push(`DII: ${_f1(f.diiHolding)}%`);
    if (instLines.length) lines.push(`Ownership       : ${instLines.join(', ')}`);

    // Institutional flow (direction + magnitude)
    if (f.fiiFlow != null) {
        const fiiDir = f.fiiFlow > 0 ? 'NET BUYER' : 'NET SELLER';
        lines.push(`FII Flow        : ${fiiDir} ₹${_fmtCr(Math.abs(f.fiiFlow))} Cr — ${Math.abs(f.fiiFlow) > 1000 ? 'SIGNIFICANT institutional move' : 'modest flow'}`);
    }
    if (f.diiFlow != null) {
        const diiDir = f.diiFlow > 0 ? 'NET BUYER' : 'NET SELLER';
        lines.push(`DII Flow        : ${diiDir} ₹${_fmtCr(Math.abs(f.diiFlow))} Cr`);
    }

    // Macro anchors
    if (f.repoRate != null) lines.push(`RBI Repo Rate   : ${_f2(f.repoRate)}% — ${f.repoRate > 6 ? 'Elevated (tightening environment)' : 'Accommodative (growth supportive)'}`);

    if (!lines.length) return 'Fundamental data fields are present but all null. Omit fundamentals from prediction rationale.';
    return lines.join('\n');
}

function _computeEventBlock(events, horizonBars, timeframe) {
    if (!events || events.length === 0) {
        return 'No significant corporate events detected in the prediction horizon. Standard market session assumed.';
    }

    const barDays = _barsToDays(horizonBars, timeframe);
    const lines   = [];
    let hasHighImpact = false;

    events.slice(0, 8).forEach(e => {
        const daysAway = e.daysUntil ?? null;
        let impact = 'LOW';
        const type = (e.type || e.title || '').toLowerCase();
        if (type.includes('earnings') || type.includes('result') || type.includes('q1') || type.includes('q2') || type.includes('q3') || type.includes('q4')) impact = 'HIGH';
        else if (type.includes('dividend') || type.includes('board')) impact = 'MEDIUM';
        else if (type.includes('agm') || type.includes('ipo') || type.includes('split')) impact = 'MEDIUM';

        if (impact === 'HIGH') hasHighImpact = true;
        const withinHorizon = daysAway != null && daysAway <= barDays;

        lines.push(`• [${impact}] ${e.date || 'TBD'}: ${e.type || e.title || 'Event'}${daysAway != null ? ` (${daysAway}d away${withinHorizon ? ' ← WITHIN PREDICTION HORIZON' : ''})` : ''}`);
    });

    if (hasHighImpact) {
        lines.push('');
        lines.push('⚠ HIGH-IMPACT event detected: Widen your predicted High-Low range by 20-40%, reduce confidence by 10-20 points, and note the event in key_risk.');
    }

    return lines.join('\n');
}

function _computeSessionBlock(tradingMode, timeframe, horizonBars) {
    const nowIST = new Date(Date.now() + (5.5 * 3600000));
    const h = nowIST.getHours(), m = nowIST.getMinutes();

    let session, sessionNote;
    if      (h < 9 || (h === 9 && m < 0))  { session = 'Pre-Market'; sessionNote = 'Market has not opened. Overnight sentiment and global cues dominate first candle.'; }
    else if (h === 9 && m < 15)             { session = 'Opening Auction'; sessionNote = 'Price discovery phase. High volatility, wide spreads. First candle range often exceeds ATR.'; }
    else if (h === 9 || (h === 10 && m < 30)) { session = 'Opening Drive'; sessionNote = 'Trend established from opening. Watch for continuation or early reversal.'; }
    else if (h < 12)                        { session = 'Morning Session'; sessionNote = 'Institutional participation high. Trends tend to persist.'; }
    else if (h < 13)                        { session = 'Midday Lull'; sessionNote = 'Reduced participation, choppy price action common. Indicators less reliable.'; }
    else if (h < 15)                        { session = 'Afternoon Session'; sessionNote = 'Resurgent activity. Late-session momentum builds. FPI flows visible.'; }
    else if (h === 15 && m <= 30)           { session = 'Closing Drive'; sessionNote = 'Final 30min. Institutional rebalancing, closing prints. High volume, directional.'; }
    else                                    { session = 'Post-Market'; sessionNote = 'Market closed. Predictions apply to NEXT SESSION opening and subsequent bars.'; }

    const modeGuide = {
        positional: 'Multi-session trend. Daily/Weekly closing price is primary. Intraday noise is secondary. Weight fundamentals and sector rotation heavily.',
        swing:      '2–7 session swing. Entry at technical inflection. EMA crossovers, RSI extremes, MACD histogram turns are primary signals.',
        intraday:   'Single-session scalp. VWAP is the most important anchor. Opening drive direction, volume surges, and L1/L2 levels dominate.',
    };

    const singleBarDuration = {
        '1m': '1 minute', '3m': '3 minutes', '5m': '5 minutes', '15m': '15 minutes',
        '30m': '30 minutes', '1h': '1 hour', '2h': '2 hours', '4h': '4 hours',
        'daily': '1 trading day', '1D': '1 trading day', 'weekly': '1 week', '1W': '1 week',
    }[timeframe] || timeframe;

    return [
        `Market Session      : ${session}`,
        `Session Note        : ${sessionNote}`,
        `IST Time            : ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
        `Bar Duration        : ${singleBarDuration}`,
        `Horizon Coverage    : ${horizonBars} × ${singleBarDuration} = ${_barsToDays(horizonBars, timeframe).toFixed(1)} trading day(s)`,
        `Trading Mode        : ${tradingMode.toUpperCase()}`,
        `Mode Guide          : ${modeGuide[tradingMode] || modeGuide.swing}`,
    ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────
// PRIVATE ANALYTICS HELPERS
// ─────────────────────────────────────────────────────────────────────

function _computeATR(bars) {
    if (!bars || bars.length < 2) return null;
    let total = 0, n = 0;
    for (let i = 1; i < bars.length; i++) {
        const hi   = bars[i].high ?? 0, lo = bars[i].low ?? 0, pc = bars[i-1].close ?? 0;
        const tr   = Math.max(hi - lo, Math.abs(hi - pc), Math.abs(lo - pc));
        if (tr > 0) { total += tr; n++; }
    }
    return n ? total / n : null;
}

function _detectCandlePatterns(bars) {
    if (!bars || bars.length < 2) return [];
    const patterns = [];
    const last2 = bars.slice(-2);
    const last1 = bars.at(-1) ?? {};
    const prev1 = bars.at(-2) ?? {};

    const body1 = Math.abs(last1.close - last1.open);
    const range1 = (last1.high - last1.low) || 1;
    const upperWick1 = last1.high - Math.max(last1.close, last1.open);
    const lowerWick1 = Math.min(last1.close, last1.open) - last1.low;
    const isBullish1 = last1.close > last1.open;
    const isBearish1 = last1.close < last1.open;

    // Doji
    if (body1 / range1 < 0.1) patterns.push('Doji (indecision)');
    // Hammer
    if (lowerWick1 > body1 * 2 && upperWick1 < body1 * 0.5 && isBullish1) patterns.push('Hammer (bullish reversal)');
    // Shooting Star
    if (upperWick1 > body1 * 2 && lowerWick1 < body1 * 0.5 && isBearish1) patterns.push('Shooting Star (bearish reversal)');
    // Marubozu (strong candle, minimal wicks)
    if (body1 / range1 > 0.85 && isBullish1) patterns.push('Bullish Marubozu (strong buying)');
    if (body1 / range1 > 0.85 && isBearish1) patterns.push('Bearish Marubozu (strong selling)');
    // Engulfing
    if (prev1.open && prev1.close) {
        const prevBody = Math.abs(prev1.close - prev1.open);
        if (isBullish1 && prev1.close < prev1.open && last1.open <= prev1.close && last1.close >= prev1.open) patterns.push('Bullish Engulfing');
        if (isBearish1 && prev1.close > prev1.open && last1.open >= prev1.close && last1.close <= prev1.open) patterns.push('Bearish Engulfing');
    }
    // Inside Bar
    if (last1.high < prev1.high && last1.low > prev1.low) patterns.push('Inside Bar (consolidation/compression)');

    return patterns;
}

function _barsToDays(n, tf) {
    const m = { '1m':1,'3m':3,'5m':5,'15m':15,'30m':30,'1h':60,'2h':120,'4h':240,'daily':390,'1D':390,'weekly':1950,'1W':1950 };
    const minsPerBar = m[tf] || 15;
    return (n * minsPerBar) / 390; // NSE trading day = 375 mins + 15 pre
}

// ─────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────
function _f2(v) { return v != null && !isNaN(v) ? parseFloat(v).toFixed(2) : 'N/A'; }
function _f1(v) { return v != null && !isNaN(v) ? parseFloat(v).toFixed(1) : 'N/A'; }
function _fmtCr(v) { return v != null ? (v / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A'; }
function _formatTime(t) {
    if (!t) return '';
    if (typeof t === 'number') return new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ');
    if (typeof t === 'string') return t.slice(0, 16).replace('T', ' ');
    if (t.year) return `${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')} 00:00`;
    return String(t);
}