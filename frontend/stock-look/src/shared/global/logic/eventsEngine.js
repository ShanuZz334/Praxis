/**
 * @file eventsEngine.js
 * @purpose Institutional-grade Market Events AI extraction, deterministic PES-7 scoring,
 *          multi-prompt instrument routing, input validation, and UI styling.
 * @architecture
 *   Section 1: UI Color Constants
 *   Section 2: UI Helper Functions
 *   Section 3: PES-7 Deterministic Scoring Formula
 *   Section 4: Instrument Type Definitions & Auto-Detector
 *   Section 5: 6 Institutional AI System Prompts
 *   Section 6: Prompt Router
 *   Section 7: Event Extraction Prompt Builder
 *   Section 8: Input Validator
 * @rule5_compliance All business logic is isolated here so React and Node can share it natively.
 */

import { TRADING_MODES } from '../../../config/tradingModes.js';
import { getEventCategoryWeights, getEventHorizonWeights } from '../../../config/weights/eventsSectionWeights.js';

// ============================================================================================
// SECTION 1: UI Color Constants & Definitions
// ============================================================================================

export const EVENT_CATEGORIES = [
    { label: "Macro", color: "#2E5BFF" },
    { label: "Earnings", color: "#22C55E" },
    { label: "Policy", color: "#4F46E5" },
    { label: "Corporate", color: "#8B5CF6" },
    { label: "Geopolitical", color: "#DC2626" },
    { label: "Commodities", color: "#F59E0B" },
    { label: "Currency", color: "#06B6D4" },
    { label: "Bonds", color: "#64748B" },
    { label: "Global", color: "#0F766E" },
    { label: "Economy", color: "#0284C7" }
];

export const SENTIMENT_LEVELS = [
    { label: "Very Bullish", color: "#16A34A" },
    { label: "Bullish", color: "#22C55E" },
    { label: "Neutral", color: "#94A3B8" },
    { label: "Bearish", color: "#F97316" },
    { label: "Very Bearish", color: "#DC2626" }
];

export const IMPORTANCE_LEVELS = [
    { label: "Low", color: "#94A3B8" },
    { label: "Medium", color: "#2E5BFF" },
    { label: "High", color: "#F59E0B" },
    { label: "Critical", color: "#DC2626" }
];

export const SEVERITY_LEVELS = [
    { label: "Normal", color: "#94A3B8" },
    { label: "Important", color: "#F59E0B" },
    { label: "Major", color: "#EA580C" },
    { label: "Systemic", color: "#DC2626" },
    { label: "Black Swan", color: "#7C3AED" }
];

export const OVERRIDE_MODES = [
    { label: "None", color: "#94A3B8" },
    { label: "Watch", color: "#FACC15" },
    { label: "Override", color: "#8B5CF6" },
    { label: "Force Override", color: "#2E5BFF" }
];

export const EVENT_HORIZONS = [
    { label: "Intraday", color: "#2E5BFF" },
    { label: "Swing", color: "#22C55E" },
    { label: "Positional", color: "#06B6D4" },
    { label: "Structural", color: "#8B5CF6" },
    { label: "Long Term", color: "#4F46E5" }
];

export const SOURCE_COLORS = {
    "RBI": "#2563EB",
    "SEBI": "#16A34A",
    "NSE": "#2E5BFF",
    "BSE": "#0F766E",
    "Bloomberg": "#F59E0B",
    "Reuters": "#DC2626",
    "CNBC": "#06B6D4",
    "CNBC TV18": "#0284C7",
    "Moneycontrol": "#15803D",
    "Upstox": "#9333EA",
    "Economic Times": "#E11D48",
    "Mint": "#FB923C",
    "Business Standard": "#2563EB",
    "Financial Express": "#0284C7",
    "NDTV Profit": "#DC2626",
    "Zee Business": "#1E40AF",
    "Yahoo Finance": "#7C3AED",
    "WSJ": "#404040",
    "Financial Times": "#FCA5A5",
    "Exchange Filing": "#8B5CF6",
    "Government": "#6366F1",
    "Company PR": "#94A3B8",
    "Default": "#94A3B8"
};

// ============================================================================================
// SECTION 2: UI Helper Functions
// ============================================================================================

export function getEventScoreColor(score) {
    // Thresholds calibrated to the internal ±100 PES-7 scale.
    const s = Number(score) || 0;
    if (s <= -50) return { label: "Extremely Negative", color: "#DC2626" }; // Crimson Red
    if (s < 0)    return { label: "Negative",           color: "#F97316" }; // Orange Red
    if (s === 0)  return { label: "Neutral",             color: "#94A3B8" }; // Slate Gray
    if (s < 50)   return { label: "Positive",            color: "#22C55E" }; // Emerald Green
    return         { label: "Extremely Positive",        color: "#2E5BFF" }; // Praxis Blue
}

export function getConfidenceColor(confidence) {
    if (confidence === undefined || confidence === null) return "#94A3B8";
    const c = Number(confidence) || 0;
    if (c <= 50) return "#E5484D"; // Red
    if (c <= 70) return "#F59E0B"; // Amber
    if (c <= 85) return "#22C55E"; // Green
    return "#2E5BFF"; // Praxis Blue
}

export function getCategoryColor(categoryName) {
    const cat = EVENT_CATEGORIES.find(c => c.label.toLowerCase() === categoryName?.toLowerCase());
    return cat ? cat.color : "#94A3B8";
}

export function getSourceColor(sourceName) {
    for (const key of Object.keys(SOURCE_COLORS)) {
        if (sourceName?.toLowerCase().includes(key.toLowerCase())) {
            return SOURCE_COLORS[key];
        }
    }
    return SOURCE_COLORS["Default"];
}

// Map attributes to their config colors easily
function findColor(list, label) {
    const item = list.find(x => x.label.toLowerCase() === label?.toLowerCase());
    return item ? item.color : "#94A3B8";
}

export const getColorMap = (event) => ({
    sentiment: findColor(SENTIMENT_LEVELS, event.sentiment),
    importance: findColor(IMPORTANCE_LEVELS, event.importance),
    severity: findColor(SEVERITY_LEVELS, event.severity),
    override: findColor(OVERRIDE_MODES, event.override_mode),
    horizon: findColor(EVENT_HORIZONS, event.horizon),
    confidence: getConfidenceColor(event.confidence),
    scoreHex: getEventScoreColor(event.event_score).color,
    sourceHex: getSourceColor(event.source),
    categoryHex: getCategoryColor(event.category)
});

// ============================================================================================
// SECTION 3: PES-7 Deterministic Scoring Formula
// ============================================================================================

/**
 * PES-7 Weight Tables — Institutional Grade (v2).
 *
 * SCALE RATIONALE:
 * - Sentiment is the base signal: ±100 pts max. This is the raw directional force.
 * - Importance gates how much of that signal reaches the portfolio (30%–100%).
 * - Severity gates the structural market impact of the event (30%–100%).
 * - Horizon weights persistence: Intraday events matter less than Structural shifts.
 * - Confidence is a sigmoid curve — events below 50% AI confidence barely register.
 *   At 80% confidence, the event carries ~76% weight. At 95%, ~93%.
 *
 * Combined theoretical max: 100 × 1.00 × 1.00 × 1.15 × ~0.97 ≈ 111 → clamped to ±100.
 */
export const PES7_WEIGHTS = {
    sentiment: {
        "Very Bullish": +100.0,
        "Bullish":       +60.0,
        "Neutral":         0.0,
        "Bearish":        -60.0,
        "Very Bearish":  -100.0
    },
    importance: {
        "Low":      0.30,  // Low-importance noise barely moves the needle
        "Medium":   0.55,
        "High":     0.80,
        "Critical": 1.00   // Critical events carry full importance weight
    },
    severity: {
        "Normal":     0.30,  // Routine events: minimal structural impact
        "Important":  0.55,
        "Major":      0.80,
        "Systemic":   0.92,
        "Black Swan": 1.00   // Market-defining events: full severity weight
    },
    horizon: {
        "Intraday":   0.70,  // Noise — fades within hours
        "Swing":      0.85,
        "Positional": 1.00,  // Standard multi-week impact: baseline
        "Structural": 1.10,
        "Long Term":  1.15   // Multi-quarter structural shifts carry premium weight
    }
};

/**
 * Sigmoid confidence curve for PES-7.
 * Creates a conviction threshold — low-confidence events barely register.
 * conf=30 → 0.07 | conf=50 → 0.25 | conf=65 → 0.50 | conf=80 → 0.76 | conf=95 → 0.93
 * @private
 */
function confidenceSigmoid(conf) {
    return 1.0 / (1.0 + Math.exp(-0.08 * (conf - 65)));
}

/**
 * Computes dynamic exponential time-decay factor for an event at render time.
 *
 * Decay curve (relative to TTL):
 *   t=0       → 1.00 (full weight — event is fresh)
 *   t=TTL/4   → 0.61 (40% weight shed by quarter-life)
 *   t=TTL/2   → 0.37 (majority weight shed)
 *   t=TTL     → 0.00 (event has expired, zero contribution)
 *
 * @param {string|null} createdAt  - ISO timestamp of DB insert
 * @param {string|null} publishedTime - ISO timestamp of original event
 * @param {number}      ttlHours   - Event time-to-live in hours
 * @returns {number} Decay factor [0.0 – 1.0]
 */
export function computeTimeDecay(createdAt, publishedTime, ttlHours) {
    const eventDate = publishedTime ? new Date(publishedTime) : new Date(createdAt || Date.now());
    const ttl = Math.max(1, Number(ttlHours) || 72);
    const hoursElapsed = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed < 0)    return 1.0; // Future-dated events: full weight
    if (hoursElapsed >= ttl) return 0.0; // Expired events: zero weight
    return Math.exp(-2.0 * hoursElapsed / ttl);
}

/**
 * Converts the internal ±100 raw PES-7 score to the ±10 display range shown on cards.
 * Use this everywhere a human-readable score is rendered in the UI.
 */
export function getDisplayScore(rawScore) {
    return Math.round((Number(rawScore) || 0) / 10 * 10) / 10;
}

/**
 * Computes the deterministic PES-7 Event Score (Institutional Grade v3).
 *
 * Formula: SentimentBase × Importance × Severity × HorizonWeight × ConfidenceSigmoid
 * Internal scale: ±100  |  Display scale (via getDisplayScore): ±10
 *
 * The AI NEVER outputs event_score. This function is the sole source of truth.
 */
export function computeEventScore(sentiment, importance, severity, confidence, horizon = "Positional") {
    const sentWeight = PES7_WEIGHTS.sentiment[sentiment]   ?? 0.0;
    const impMult    = PES7_WEIGHTS.importance[importance] ?? 0.55;
    const sevMult    = PES7_WEIGHTS.severity[severity]     ?? 0.30;
    const horizMult  = PES7_WEIGHTS.horizon[horizon]       ?? 1.00;
    const confFactor = confidenceSigmoid(Math.max(0, Math.min(100, Number(confidence) || 60)));
    const raw        = sentWeight * impMult * sevMult * horizMult * confFactor;
    return Math.round(Math.max(-100.0, Math.min(100.0, raw)) * 10) / 10;
}

/**
 * Computes Market Impact / Structural Volatility Magnitude (Omega) in range [0, 100].
 * In institutional quant modeling, even if an event has a Neutral directional score (0.0),
 * its importance, severity, and confidence impart substantial market volatility kinetic energy.
 */
export function computeEventImpactMagnitude(importance, severity, confidence, horizon = "Positional") {
    const impMult    = PES7_WEIGHTS.importance[importance] ?? 0.55;
    const sevMult    = PES7_WEIGHTS.severity[severity]     ?? 0.30;
    const horizMult  = PES7_WEIGHTS.horizon[horizon]       ?? 1.00;
    const confFactor = confidenceSigmoid(Math.max(0, Math.min(100, Number(confidence) || 60)));
    const magnitude  = 100.0 * impMult * sevMult * (horizMult / 1.15) * confFactor;
    return Math.round(Math.max(0.0, Math.min(100.0, magnitude)) * 10) / 10;
}

/**
 * Returns a full PES-7 breakdown object for display in the UI / Diagnostics.
 */
export function getPES7Breakdown(sentiment, importance, severity, confidence, horizon = "Positional") {
    const sentWeight = PES7_WEIGHTS.sentiment[sentiment]   ?? 0.0;
    const impMult    = PES7_WEIGHTS.importance[importance] ?? 0.55;
    const sevMult    = PES7_WEIGHTS.severity[severity]     ?? 0.30;
    const horizMult  = PES7_WEIGHTS.horizon[horizon]       ?? 1.00;
    const confFactor = confidenceSigmoid(Math.max(0, Math.min(100, Number(confidence) || 60)));
    const finalScore = computeEventScore(sentiment, importance, severity, confidence, horizon);
    const impactMag  = computeEventImpactMagnitude(importance, severity, confidence, horizon);
    return {
        sentimentWeight:      sentWeight,
        importanceMultiplier: impMult,
        severityMultiplier:   sevMult,
        horizonMultiplier:    horizMult,
        confidenceFactor:     Math.round(confFactor * 1000) / 1000,
        rawScore:             sentWeight * impMult * sevMult * horizMult * confFactor,
        finalScore,
        displayScore:         getDisplayScore(finalScore),
        impactMagnitude:      impactMag,
        displayImpact:        (impactMag / 10).toFixed(1)
    };
}

// ============================================================================================
// SECTION 4: Instrument Type Definitions & Auto-Detector
// ============================================================================================

export const INSTRUMENT_TYPES = {
    MACRO_POLICY: {
        label: "Macro / Policy",
        description: "RBI, SEBI, Government policy, CPI, GDP, inflation, interest rates",
        color: "#4F46E5",
        keywords: ["rbi", "sebi", "repo rate", "interest rate", "inflation", "cpi", "gdp",
                   "monetary policy", "budget", "fiscal", "government", "ministry",
                   "finance minister", "rate hike", "rate cut", "federal reserve", "fed",
                   "fomc", "ecb", "rate decision", "mpc", "open market", "liquidity"]
    },
    INDICES: {
        label: "Indices / Broad Market",
        description: "NIFTY, BANKNIFTY, SENSEX, broad market moves, FII/DII flows",
        color: "#2E5BFF",
        keywords: ["nifty", "banknifty", "bank nifty", "sensex", "indices", "index",
                   "market breadth", "fii", "dii", "advance decline", "circuit breaker",
                   "market cap", "vix", "india vix", "midcap", "smallcap", "broad market",
                   "stock market", "equity market"]
    },
    EQUITY: {
        label: "Equity / Corporate",
        description: "Single stock earnings, corporate events, management, promoter activity",
        color: "#22C55E",
        keywords: ["quarterly results", "q1", "q2", "q3", "q4", "earnings", "eps", "revenue",
                   "profit", "loss", "ebitda", "margin", "promoter", "management", "ceo", "md",
                   "board", "agm", "egm", "buyback", "dividend", "rights issue", "ipo", "qip",
                   "merger", "acquisition", "demerger", "pledge", "insider", "bulk deal",
                   "block deal", "exchange filing", "bse filing"]
    },
    COMMODITY: {
        label: "Commodity",
        description: "Crude oil, gold, silver, metals, agricultural commodities",
        color: "#F59E0B",
        keywords: ["crude", "oil", "brent", "wti", "gold", "silver", "copper", "aluminium",
                   "aluminum", "zinc", "nickel", "iron ore", "steel", "commodity", "metal",
                   "wheat", "sugar", "natural gas", "opec", "energy", "mcx", "comex"]
    },
    CURRENCY: {
        label: "Currency / FX",
        description: "INR, USDINR, RBI FX intervention, rupee movement",
        color: "#06B6D4",
        keywords: ["rupee", "inr", "usdinr", "dollar", "forex", "fx", "currency",
                   "exchange rate", "rbi intervention", "dollar reserves", "current account",
                   "trade deficit", "capital flows", "fema", "currency depreciation"]
    },
    GLOBAL: {
        label: "Global / Geopolitical",
        description: "US markets, China macro, EU, geopolitical risk, global risk-off",
        color: "#DC2626",
        keywords: ["us market", "wall street", "dow jones", "s&p 500", "nasdaq", "china",
                   "europe", "geopolitical", "war", "conflict", "sanctions", "tariff",
                   "trade war", "recession", "global", "international", "middle east",
                   "russia", "ukraine", "taiwan", "us inflation", "global selloff", "risk off"]
    }
};

/**
 * Auto-detects instrument type from headline + content + source text.
 * Priority order: MACRO_POLICY > CURRENCY > COMMODITY > EQUITY > GLOBAL > INDICES
 */
export function detectInstrumentType(headline = "", content = "", source = "") {
    const combined = `${headline} ${content} ${source}`.toLowerCase();
    const priority = ["MACRO_POLICY", "CURRENCY", "COMMODITY", "EQUITY", "GLOBAL", "INDICES"];
    for (const type of priority) {
        if (INSTRUMENT_TYPES[type].keywords.some(kw => combined.includes(kw))) return type;
    }
    return "INDICES";
}

// ============================================================================================
// SECTION 5: 6 Institutional AI System Prompts
// ============================================================================================

const SHARED_OUTPUT_SCHEMA = `
Output ONLY a raw JSON object (no markdown, no triple-backtick wrapper):
{
  "headline": "string - COMPLETE, non-truncated institutional headline. Must NEVER cut off mid-word, mid-number (e.g. '23,2'), or end with dangling prepositions/symbols. If summarizing, ensure complete grammatical closure; otherwise retain the original headline.",
  "summary": "string - 2-3 sentences of institutional analysis (NOT a restatement of headline)",
  "category": "Macro | Earnings | Policy | Corporate | Geopolitical | Commodities | Currency | Bonds | Global | Economy",
  "sub_category": "string - specific subcategory e.g. Rate Decision, Q1 Results, Crude Inventory, FII Outflow",
  "source": "string - exact source name",
  "published_time": "ISO 8601 timestamp or null",
  "sentiment": "Very Bullish | Bullish | Neutral | Bearish | Very Bearish",
  "importance": "Low | Medium | High | Critical",
  "severity": "Normal | Important | Major | Systemic | Black Swan",
  "override_mode": "None | Watch | Override | Force Override",
  "horizon": "Intraday | Swing | Positional | Structural | Long Term",
  "confidence": integer 0-100,
  "affected_assets": ["array of NSE/BSE ticker symbols or index names, max 8. Include ALL stocks and indices mentioned in headline and summary."],
  "instrument_type": "MACRO_POLICY | INDICES | EQUITY | COMMODITY | CURRENCY | GLOBAL",
  "key_data_points": ["specific quantitative facts from the news e.g. 5.1% CPI, Rate held at 6.5%, Rs 4,200 Cr FII outflow"],
  "hashtags": ["array of 3-5 institutional hashtags e.g. #MacroPolicy, #RateDecision, #NIFTY50, #MarketRally"],
  "reasoning": "string - detailed institutional explanation: mechanism, sector sensitivity, horizon",
  "ttl_hours": "integer - the estimated time-to-live of this event's impact in hours (e.g. 24 for intraday noise, 72 for typical earnings, 720 for structural shifts, 8760 for a pandemic)"
}

CRITICAL RULES:
- HEADLINE INTEGRITY: Never truncate headlines. Never end with incomplete numbers, dangling prepositions, or trailing symbols (; , - / &).
- DO NOT include event_score. The backend computes it deterministically.
- Neutral sentiment CANNOT have Major, Systemic, or Black Swan severity.
- Very Bearish or Very Bullish sentiment should typically have Major or higher severity.
- key_data_points must have at least 1 entry for High or Critical importance events.
- affected_assets must use correct NSE ticker symbols (e.g. SBIN not State Bank of India, HDFCBANK, ONGC, LICI, etc.).`;

export const MACRO_POLICY_SYSTEM_PROMPT = `You are Praxis AI, an institutional macro-policy event analyst for Indian equities.
Specialization: RBI/SEBI/Government decisions, CPI, GDP, IIP, and macroeconomic data releases.

DOMAIN RULES:
1. RBI rate hike -> Bearish for REALTY, auto, NBFCs; mixed for BANKNIFTY (NIM helps but growth slows).
2. RBI rate cut or stance softening -> Bullish for REALTY, NBFCs, credit-linked sectors.
3. CPI above 6% (RBI upper band) -> Bearish macro; rate hike risk, tighten sentiment.
4. GDP miss vs estimates >0.5% -> Bearish, Important severity minimum.
5. SEBI regulatory crackdown -> Bearish for the specific segment, use Corporate category.
6. Budget capex increase -> Bullish for Infra, Defense, Cement.
7. Budget: tax hike on market instruments -> Bearish for overall market.
8. Specify dissenting MPC members if mentioned.

FEW-SHOT EXAMPLE:
${JSON.stringify({
    headline: "RBI Holds Repo Rate at 6.5%, Shifts Stance to Neutral",
    summary: "The Reserve Bank of India MPC voted 4-2 to hold the repo rate at 6.5% while shifting its stance from withdrawal of accommodation to neutral, signaling a future rate cut pivot. This reduces cost-of-capital premium for rate-sensitive sectors but may temporarily pressure bank NIMs.",
    category: "Policy",
    sub_category: "Rate Decision",
    source: "RBI",
    published_time: null,
    sentiment: "Bullish",
    importance: "Critical",
    severity: "Major",
    override_mode: "Watch",
    horizon: "Positional",
    confidence: 90,
    affected_assets: ["NIFTY", "BANKNIFTY", "FINNIFTY", "REALTY", "SBIN", "HDFCBANK", "LICHSGFIN"],
    instrument_type: "MACRO_POLICY",
    key_data_points: ["Repo rate held at 6.5%", "Stance changed to Neutral", "MPC vote: 4-2"],
    reasoning: "A stance change to Neutral is forward guidance for rate cuts. Structurally bullish for Real Estate, NBFCs, and select banks. BANKNIFTY benefits from renewed credit cycle optimism. Near-term NIM compression risk for banks as yields fall. FII flows likely improve on reduced carry trade cost.",
    ttl_hours: 720
}, null, 2)}
${SHARED_OUTPUT_SCHEMA}`;

export const INDICES_SYSTEM_PROMPT = `You are Praxis AI, an institutional index and broad-market event analyst for Indian equities.
Specialization: index-level moves, FII/DII activity, market breadth, volatility events, circuit-level developments.

DOMAIN RULES:
1. FII net outflow >2000 Cr in a single session -> Bearish, Important severity minimum.
2. VIX spike >20 -> escalate severity by one level; VIX >25 -> Systemic consideration.
3. Upper/Lower circuit on NIFTY/SENSEX -> Systemic severity, Very Bearish or Very Bullish.
4. Market breadth: A/D ratio worse than 1:3 -> confirm Bearish sentiment.
5. Options expiry week events -> note amplification risk; horizon is typically Intraday.
6. FII buying >3000 Cr -> Bullish signal, watch for trend vs mean reversion.
7. Always include NIFTY, BANKNIFTY, SENSEX for broad market events.

FEW-SHOT EXAMPLE:
${JSON.stringify({
    headline: "NIFTY50 Falls 1.8% as FIIs Pull Rs 4200 Cr; VIX Spikes to 18",
    summary: "NIFTY50 declined 1.8% in broad selloff driven by heavy FII outflows of Rs 4200 crore, with breadth deteriorating to 1:4 advance-decline ratio. India VIX surging past 18 signals elevated near-term volatility and potential for further downside if selling persists.",
    category: "Macro",
    sub_category: "FII Outflow / Market Breadth",
    source: "NSE",
    published_time: null,
    sentiment: "Bearish",
    importance: "High",
    severity: "Major",
    override_mode: "Watch",
    horizon: "Swing",
    confidence: 85,
    affected_assets: ["NIFTY", "BANKNIFTY", "SENSEX", "MIDCPNIFTY", "FINNIFTY"],
    instrument_type: "INDICES",
    key_data_points: ["NIFTY down 1.8%", "FII outflow Rs 4200 Cr", "VIX at 18", "A/D ratio 1:4"],
    reasoning: "FII outflows of this magnitude with deteriorating breadth signal institutional de-risking. VIX above 16 typically precedes swing-level corrections of 3-5%. Key support at NIFTY 23800 (200 DMA). Watch DII absorption rate next session to gauge institutional support.",
    ttl_hours: 24
}, null, 2)}
${SHARED_OUTPUT_SCHEMA}`;

export const EQUITY_SYSTEM_PROMPT = `You are Praxis AI, an institutional equity and corporate event analyst for Indian equities.
Specialization: earnings, management changes, corporate actions, promoter activity, exchange filings.

DOMAIN RULES:
1. Earnings surprise >+15% vs estimate -> Very Bullish; >+5% -> Bullish.
2. Earnings miss >-10% -> Very Bearish; >-5% miss -> Bearish.
3. Revenue deceleration even with PAT beat -> reduce sentiment one level; note in reasoning.
4. Promoter pledge increase >5% in a quarter -> Bearish; pledge release -> Bullish.
5. Management change (CEO/MD) without reason -> Watch override, Positional horizon minimum.
6. Dividend: >5% yield -> Bullish for that stock specifically.
7. Merger/Acquisition: acquirer typically short-term Bearish (premium risk); target -> Bullish.
8. For earnings, include sector peers in affected_assets for read-through impact.
9. QIP/Rights dilution -> near-term Bearish, structural Neutral/Bullish.
10. Audit qualifications or NCLT/IBC proceedings -> Systemic severity immediately.

FEW-SHOT EXAMPLE:
${JSON.stringify({
    headline: "Infosys Q1FY26: PAT Rs 6368 Cr (+7.1% YoY), Guidance Raised to 4.5-5%",
    summary: "Infosys reported Q1FY26 PAT of Rs 6368 crore, up 7.1% YoY, beating estimates of Rs 6100 crore. Management raised FY26 revenue growth guidance from 3.5-4.5% to 4.5-5%, driven by deal wins in BFSI and manufacturing verticals.",
    category: "Earnings",
    sub_category: "Quarterly Results - IT Sector",
    source: "Exchange Filing",
    published_time: null,
    sentiment: "Bullish",
    importance: "Critical",
    severity: "Important",
    override_mode: "None",
    horizon: "Swing",
    confidence: 88,
    affected_assets: ["INFY", "TCS", "WIPRO", "HCLTECH", "NIFTYIT", "LTIM"],
    instrument_type: "EQUITY",
    key_data_points: ["PAT Rs 6368 Cr vs est Rs 6100 Cr", "Revenue beat consensus", "Guidance raised to 4.5-5%"],
    reasoning: "Guidance upgrade removes the bear case of US tech demand slowdown. A 4.5-5% guidance by Infosys creates sector re-rating for NIFTYIT. Peer read-through positive for TCS, HCL Tech, Wipro. Key risk: US BFSI discretionary spend sustainability.",
    ttl_hours: 72
}, null, 2)}
${SHARED_OUTPUT_SCHEMA}`;

export const COMMODITY_SYSTEM_PROMPT = `You are Praxis AI, an institutional commodity event analyst covering Indian market pass-through effects.
Specialization: commodity price events and their downstream impact on listed Indian companies.

DOMAIN RULES:
1. Crude oil spike >3% -> Bearish for OMCs (BPCL, IOCL, HPCL), Airlines (INDIGO), Paints (ASIANPAINT).
2. Crude decline >3% -> Bullish for same sectors; flag government fuel price revision possibility.
3. Gold >2% rise -> Bullish for Jewellery (TITAN, KALYANKJIL); Bearish for gold importers.
4. Steel/Iron ore rise -> Bearish for auto makers; Bullish for steel producers (TATASTEEL, SAIL, JSWSTEEL).
5. Agri commodity spike (wheat, sugar, edible oils) -> Bearish for FMCG companies.
6. OPEC+ decisions: Important severity minimum; unscheduled meetings -> Major.
7. Natural gas events impact city gas (IGL, MGL, GUJGAS) and fertilizer companies.

FEW-SHOT EXAMPLE:
${JSON.stringify({
    headline: "Brent Crude Surges 4.2% to $89 on OPEC+ Surprise Production Cut",
    summary: "Brent crude rose 4.2% to $89/barrel after OPEC+ announced an unexpected 1.5 Mb/day voluntary production cut, tightening global supply. Significant pass-through implications for Indian OMCs, airlines, and paint companies.",
    category: "Commodities",
    sub_category: "Crude Oil - Supply Event",
    source: "Bloomberg",
    published_time: null,
    sentiment: "Bearish",
    importance: "High",
    severity: "Major",
    override_mode: "Watch",
    horizon: "Positional",
    confidence: 82,
    affected_assets: ["BPCL", "IOCL", "HPCL", "INDIGO", "SPICEJET", "ASIANPAINT", "BERGERPAINTS"],
    instrument_type: "COMMODITY",
    key_data_points: ["Brent at $89/bbl (+4.2%)", "OPEC+ cut 1.5 Mb/day", "Effective next month"],
    reasoning: "At $89/bbl, OMC marketing margins are under severe pressure without retail fuel price hikes. BPCL/IOCL/HPCL directly impacted. Airlines face ATF cost spike of 8-10%. Paint companies face crude-derivative inflation. Government fuel price hike would be electorally sensitive. Rupee stability critical - weaker INR amplifies landed crude cost.",
    ttl_hours: 168
}, null, 2)}
${SHARED_OUTPUT_SCHEMA}`;

export const CURRENCY_SYSTEM_PROMPT = `You are Praxis AI, an institutional currency and FX event analyst for Indian markets.
Specialization: INR/USD movements, RBI FX intervention, capital flow events, and sector-level impact.

DOMAIN RULES:
1. INR depreciation (USDINR rise): Bullish for IT exporters (TCS, INFY, WIPRO), Pharma exporters (SUNPHARMA, DRREDDY).
   Bearish for OMCs (crude import cost), Airlines, Capital goods importers.
2. INR appreciation: Bearish for IT, Pharma exporters. Bullish for import-heavy industries, OMCs.
3. DXY >105 -> watch for continued INR pressure; DXY <100 -> INR relief likely.
4. RBI confirmed intervention -> cap depreciation narrative; note forex reserve cost.
5. Current account deficit widening -> Bearish for INR, flag in reasoning.
6. USDINR above 85 -> flag as psychological level, Important severity minimum.
7. Always list both positively AND negatively affected sectors in reasoning.

FEW-SHOT EXAMPLE:
${JSON.stringify({
    headline: "INR Hits 84.80 vs USD as FII Outflows Accelerate; RBI Intervenes",
    summary: "The rupee weakened to 84.80 against the dollar, near all-time lows, driven by persistent FII outflows and stronger Dollar Index at 106.2. RBI intervention through dollar sales temporarily capped losses, but sustained pressure could trigger imported inflation.",
    category: "Currency",
    sub_category: "INR Depreciation - FII Outflow",
    source: "Reuters",
    published_time: null,
    sentiment: "Bearish",
    importance: "High",
    severity: "Important",
    override_mode: "None",
    horizon: "Swing",
    confidence: 78,
    affected_assets: ["NIFTY", "TCS", "INFY", "WIPRO", "IOCL", "BPCL", "SUNPHARMA"],
    instrument_type: "CURRENCY",
    key_data_points: ["USDINR at 84.80", "DXY at 106.2", "RBI intervention confirmed"],
    reasoning: "IT exporters benefit as USD revenues translate higher. OMCs face higher crude import bills. Pharma exporters see margin tailwind. RBI intervention means aggressive moves beyond 85 will be resisted. Watch forex reserves as proxy for intervention intensity.",
    ttl_hours: 48
}, null, 2)}
${SHARED_OUTPUT_SCHEMA}`;

export const GLOBAL_SYSTEM_PROMPT = `You are Praxis AI, an institutional global macro and geopolitical event analyst covering impact on Indian equities.
Specialization: US Federal Reserve decisions, China macro, European events, geopolitical risk, global risk-off/risk-on.

DOMAIN RULES:
1. US Fed rate hike or hawkish guidance -> Bearish for Indian equities (FII outflow, USDINR pressure). Systemic if >50bps.
2. US Fed rate cut or pivot -> Bullish for Indian equities (FII inflow, INR appreciation, liquidity).
3. China slowdown/PMI miss -> Bearish for metals, commodities globally; check India metal sector.
4. China stimulus -> Bullish for metals, EM equities broadly.
5. US-China trade escalation -> Bearish for global trade; check India export sectors.
6. Middle East conflict escalation -> Very Bearish for crude importers (India); Bullish for crude/energy.
7. DXY spike >1% in a day -> flag INR depreciation risk.
8. US recession risk signals -> Very Bearish; IT sector (US revenue) directly hit.
9. Quantify potential FII flow impact on India in reasoning.
10. Geopolitical events: use Geopolitical category; flag if India is directly in conflict theater.

FEW-SHOT EXAMPLE:
${JSON.stringify({
    headline: "US Fed Signals Two More Rate Hikes in 2025; 10Y Treasury Yield Hits 5.1%",
    summary: "Fed Chair Powell indicated two additional rate hikes remain on the table for 2025 at Jackson Hole, with the 10Y Treasury yield rising to 5.1% — a multi-year high. This raises the opportunity cost of EM investments significantly, threatening FII outflows from Indian equities.",
    category: "Global",
    sub_category: "US Fed - Rate Guidance",
    source: "Bloomberg",
    published_time: null,
    sentiment: "Bearish",
    importance: "Critical",
    severity: "Systemic",
    override_mode: "Override",
    horizon: "Positional",
    confidence: 85,
    affected_assets: ["NIFTY", "BANKNIFTY", "FINNIFTY", "NIFTYIT"],
    instrument_type: "GLOBAL",
    key_data_points: ["Two more Fed hikes signaled", "10Y Treasury at 5.1%", "Powell speaks at Jackson Hole"],
    reasoning: "10Y UST at 5.1% makes risk-free US returns highly attractive vs Indian equity risk premium. FII historically sell EM equities when US risk-free rates exceed 4.5%. BANKNIFTY and NIFTYIT most vulnerable due to high FII ownership. Structural resilience: domestic SIP inflows provide DII counter.",
    ttl_hours: 720
}, null, 2)}
${SHARED_OUTPUT_SCHEMA}`;

// ============================================================================================
// SECTION 6: Prompt Router
// ============================================================================================

export const ALL_PROMPTS = {
    MACRO_POLICY: { key: "MACRO_POLICY", label: "Macro / Policy",        prompt: MACRO_POLICY_SYSTEM_PROMPT },
    INDICES:      { key: "INDICES",      label: "Indices / Broad Market", prompt: INDICES_SYSTEM_PROMPT      },
    EQUITY:       { key: "EQUITY",       label: "Equity / Corporate",     prompt: EQUITY_SYSTEM_PROMPT       },
    COMMODITY:    { key: "COMMODITY",    label: "Commodity",               prompt: COMMODITY_SYSTEM_PROMPT    },
    CURRENCY:     { key: "CURRENCY",     label: "Currency / FX",          prompt: CURRENCY_SYSTEM_PROMPT     },
    GLOBAL:       { key: "GLOBAL",       label: "Global / Geopolitical",  prompt: GLOBAL_SYSTEM_PROMPT       }
};

/**
 * Returns the correct system prompt for the given instrument type.
 * @param {string} instrumentType - key from INSTRUMENT_TYPES
 * @param {boolean} useFewShot    - if false, strips the FEW-SHOT EXAMPLE section
 * @returns {string} system prompt
 */
export function resolvePromptByInstrumentType(instrumentType, useFewShot = true) {
    const promptEntry = ALL_PROMPTS[instrumentType] || ALL_PROMPTS.INDICES;
    const prompt = promptEntry.prompt;
    if (!useFewShot) {
        return prompt.replace(/\nFEW-SHOT EXAMPLE:[\s\S]*?\}\n/m, "\n");
    }
    return prompt;
}

// ============================================================================================
// SECTION 7: Event Extraction Prompt Builder
// ============================================================================================

/**
 * Builds the user-facing extraction prompt with instrument context injected.
 */
export function buildEventExtractionPrompt(headline, content, source, instrumentType = "INDICES") {
    const typeInfo = INSTRUMENT_TYPES[instrumentType];
    return `Analyze the following financial market event for Indian equities.

INSTRUMENT CONTEXT: ${typeInfo?.description || "General market event"}
INSTRUMENT TYPE: ${typeInfo?.label || instrumentType}

HEADLINE: ${headline}
SOURCE: ${source}
CONTENT: ${content}

Apply your domain-specific rules for ${typeInfo?.label || instrumentType} events.
Identify all key quantitative data points from the content.
Return the extracted JSON object.`;
}

// Backward-compat alias (eventsRoutes.js imports this name)
export const EVENT_EXTRACTION_SYSTEM_PROMPT = MACRO_POLICY_SYSTEM_PROMPT;

// ============================================================================================
// SECTION 8: Input Validator, Entity Extraction & Hashtags Taxonomy
// ============================================================================================

const VALID_SENTIMENTS  = ["Very Bullish", "Bullish", "Neutral", "Bearish", "Very Bearish"];
const VALID_IMPORTANCE  = ["Low", "Medium", "High", "Critical"];
const VALID_SEVERITY    = ["Normal", "Important", "Major", "Systemic", "Black Swan"];
const VALID_OVERRIDE    = ["None", "Watch", "Override", "Force Override"];
const VALID_HORIZONS    = ["Intraday", "Swing", "Positional", "Structural", "Long Term"];
const VALID_INSTRUMENTS = ["MACRO_POLICY", "INDICES", "EQUITY", "COMMODITY", "CURRENCY", "GLOBAL"];

/**
 * Detects whether a headline was truncated mid-sentence, mid-word, or mid-number by an AI model.
 * Institutional signals of truncation:
 * 1. Cutoff numbers: ends in comma or decimal before digits finish, e.g. "23,2" or "10." or "₹"
 * 2. Dangling prepositions/conjunctions/articles: e.g. "and", "or", "for", "with", "at", "of", "to", "in", "by", "from", "the", "a", "an", "as", "while", "after", "before", "due", "into", "is", "are", "was", "were", "has", "have", "had", "its", "their", "which", "that", "above", "below", "between", "over", "under", "during", "amid", "among", "near", "up to", "up"
 * 3. Trailing punctuation or open symbols: comma, semicolon, dash, hyphen, colon, open bracket, currency sign (₹, $, €), ampersand, slash
 * 4. Suspiciously cut-off token fragment: e.g. trailing single/double uppercase letter fragment preceded by space or punctuation like ", NIF", "; TCS", "for S", "SENSE"
 * 5. Relative length truncation: headline is under 25 chars when original was much longer and doesn't finish cleanly.
 */
export function isHeadlineTruncated(headline, originalHeading = "") {
    if (!headline || typeof headline !== "string") return true;
    const h = headline.trim();
    if (h.length === 0) return true;

    // 1. Cutoff numbers e.g. "23,2" or "500," or "10."
    if (/\b\d+,\d{1,2}$/.test(h)) return true;
    if (/[\d,]\.$/.test(h) && !/\b(no|inc|corp|ltd|co)\.$/i.test(h)) return true;
    if (/\d+,$/.test(h)) return true;

    // 2. Trailing dangling punctuation / symbols: comma, semicolon, dash, slash, ampersand, currency
    if (/[,;:\-–—\(\[\{₹$€£&/\\#@\+]\s*$/.test(h)) return true;

    // 3. Trailing prepositions / conjunctions / connectors
    const trailingConnectors = /\b(and|or|for|with|to|at|of|in|on|by|from|the|a|an|as|while|after|before|due|into|is|are|was|were|has|have|had|its|their|which|that|above|below|between|over|under|during|amid|among|near|up to|up)\s*$/i;
    if (trailingConnectors.test(h)) return true;

    // 4. Fragment abbreviations like ", NIF" or "SENSE" or "for S"
    if (/[,\s;]([A-Z]{1,3})\s*$/.test(h)) {
        const match = h.match(/[,\s;]([A-Z]{1,3})\s*$/);
        const frag = match ? match[1] : "";
        if (frag.length <= 2 && !["IT", "US", "UK", "EU", "AI", "EV", "FX", "PE", "PB", "LT"].includes(frag)) {
            return true;
        }
        if (["NIF", "SEN", "TAT", "INF", "HDF"].includes(frag)) {
            return true;
        }
    }

    // 5. If original heading exists and current headline is less than half the length and doesn't end in terminal punctuation
    if (originalHeading && originalHeading.length > 35 && h.length < 25 && !/[.!?]$/.test(h)) {
        return true;
    }

    return false;
}

/**
 * Systematic institutional F&O entity & ticker dictionary.
 */
const ASSET_ENTITY_MAP = [
    // Indices & Major Benchmarks
    { pattern: /\b(NIFTY\s*50|NIFTY50|NIFTY)\b/i, symbol: "NIFTY" },
    { pattern: /\b(BANK\s*NIFTY|BANKNIFTY)\b/i, symbol: "BANKNIFTY" },
    { pattern: /\b(SENSEX)\b/i, symbol: "SENSEX" },
    { pattern: /\b(FIN\s*NIFTY|FINNIFTY)\b/i, symbol: "FINNIFTY" },
    { pattern: /\b(MIDCPNIFTY|MIDCAP\s*NIFTY)\b/i, symbol: "MIDCPNIFTY" },
    { pattern: /\b(NIFTY\s*IT|IT\s*INDEX|NIFTYIT)\b/i, symbol: "NIFTYIT" },
    { pattern: /\b(NIFTY\s*AUTO|AUTO\s*INDEX)\b/i, symbol: "NIFTYAUTO" },
    { pattern: /\b(NIFTY\s*PHARMA|PHARMA\s*INDEX)\b/i, symbol: "NIFTYPHARMA" },
    { pattern: /\b(NIFTY\s*METAL|METAL\s*INDEX)\b/i, symbol: "NIFTYMETAL" },
    { pattern: /\b(NIFTY\s*FMCG|FMCG\s*INDEX)\b/i, symbol: "NIFTYFMCG" },
    { pattern: /\b(NIFTY\s*REALTY|REALTY\s*INDEX|REALTY)\b/i, symbol: "REALTY" },
    { pattern: /\b(INDIA\s*VIX|VIX)\b/i, symbol: "INDIAVIX" },

    // Top Liquid Equities & Corporate Names
    { pattern: /\b(RELIANCE|RIL)\b/i, symbol: "RELIANCE" },
    { pattern: /\b(HDFC\s*BANK|HDFCBANK|HDFC)\b/i, symbol: "HDFCBANK" },
    { pattern: /\b(ICICI\s*BANK|ICICIBANK|ICICI)\b/i, symbol: "ICICIBANK" },
    { pattern: /\b(STATE\s*BANK|STATE\s*BANK\s*OF\s*INDIA|SBIN|SBI)\b/i, symbol: "SBIN" },
    { pattern: /\b(TATA\s*CONSULTANCY|TCS)\b/i, symbol: "TCS" },
    { pattern: /\b(INFOSYS|INFY)\b/i, symbol: "INFY" },
    { pattern: /\b(BHARTI\s*AIRTEL|AIRTEL|BHARTIARTL)\b/i, symbol: "BHARTIARTL" },
    { pattern: /\b(ITC)\b/i, symbol: "ITC" },
    { pattern: /\b(KOTAK\s*BANK|KOTAK\s*MAHINDRA|KOTAKBANK)\b/i, symbol: "KOTAKBANK" },
    { pattern: /\b(LARSEN|L&T|LNT)\b/i, symbol: "LT" },
    { pattern: /\b(TATA\s*MOTORS|TATAMOTORS|TMPV)\b/i, symbol: "TATAMOTORS" },
    { pattern: /\b(ONGC|OIL\s*AND\s*NATURAL\s*GAS)\b/i, symbol: "ONGC" },
    { pattern: /\b(OIL\s*INDIA)\b/i, symbol: "OIL" },
    { pattern: /\b(LIC|LICI|LIFE\s*INSURANCE\s*CORP)\b/i, symbol: "LICI" },
    { pattern: /\b(HCL\s*TECH|HCL\s*TECHNOLOGIES|HCLTECH)\b/i, symbol: "HCLTECH" },
    { pattern: /\b(WIPRO)\b/i, symbol: "WIPRO" },
    { pattern: /\b(TECH\s*MAHINDRA|TECHM)\b/i, symbol: "TECHM" },
    { pattern: /\b(MARUTI|MARUTI\s*SUZUKI)\b/i, symbol: "MARUTI" },
    { pattern: /\b(MAHINDRA\s*&\s*MAHINDRA|M&M)\b/i, symbol: "M&M" },
    { pattern: /\b(SUN\s*PHARMA|SUNPHARMA)\b/i, symbol: "SUNPHARMA" },
    { pattern: /\b(DR\s*REDDY|DRREDDY)\b/i, symbol: "DRREDDY" },
    { pattern: /\b(CIPLA)\b/i, symbol: "CIPLA" },
    { pattern: /\b(TATA\s*STEEL|TATASTEEL)\b/i, symbol: "TATASTEEL" },
    { pattern: /\b(JSW\s*STEEL|JSWSTEEL)\b/i, symbol: "JSWSTEEL" },
    { pattern: /\b(SAIL|STEEL\s*AUTHORITY)\b/i, symbol: "SAIL" },
    { pattern: /\b(HINDALCO)\b/i, symbol: "HINDALCO" },
    { pattern: /\b(TITAN)\b/i, symbol: "TITAN" },
    { pattern: /\b(ASIAN\s*PAINTS|ASIAN\s*PAINT|ASIANPAINT)\b/i, symbol: "ASIANPAINT" },
    { pattern: /\b(BERGER\s*PAINTS|BERGERPAINTS)\b/i, symbol: "BERGERPAINTS" },
    { pattern: /\b(BPCL|BHARAT\s*PETROLEUM)\b/i, symbol: "BPCL" },
    { pattern: /\b(IOCL|IOC|INDIAN\s*OIL)\b/i, symbol: "IOCL" },
    { pattern: /\b(HPCL|HINDUSTAN\s*PETROLEUM)\b/i, symbol: "HPCL" },
    { pattern: /\b(INDIGO|INTERGLOBE\s*AVIATION)\b/i, symbol: "INDIGO" },
    { pattern: /\b(PAYTM|ONE97)\b/i, symbol: "PAYTM" },
    { pattern: /\b(YES\s*BANK|YESBANK)\b/i, symbol: "YESBANK" },
    { pattern: /\b(BAJAJ\s*FINANCE|BAJFINANCE)\b/i, symbol: "BAJFINANCE" },
    { pattern: /\b(BAJAJ\s*FINSERV|BAJAJFINSV)\b/i, symbol: "BAJAJFINSV" },
    { pattern: /\b(AXIS\s*BANK|AXISBANK)\b/i, symbol: "AXISBANK" },
    { pattern: /\b(ADANI\s*ENT|ADANIENT)\b/i, symbol: "ADANIENT" },
    { pattern: /\b(ADANI\s*PORTS|ADANIPORTS)\b/i, symbol: "ADANIPORTS" },
    { pattern: /\b(NTPC)\b/i, symbol: "NTPC" },
    { pattern: /\b(POWER\s*GRID|POWERGRID)\b/i, symbol: "POWERGRID" },
    { pattern: /\b(COAL\s*INDIA|COALINDIA)\b/i, symbol: "COALINDIA" },
    { pattern: /\b(ULTRATECH|ULTRACEMCO)\b/i, symbol: "ULTRACEMCO" },
    { pattern: /\b(NEW\s*INDIA\s*ASSURANCE|NIACL)\b/i, symbol: "NIACL" },
    { pattern: /\b(GENERAL\s*INSURANCE|GICRE|GIC\s*RE)\b/i, symbol: "GICRE" },
    { pattern: /\b(IFCI)\b/i, symbol: "IFCI" },
    { pattern: /\b(EICHER\s*MOTORS|EICHERMOT)\b/i, symbol: "EICHERMOT" },
    { pattern: /\b(RAILTEL)\b/i, symbol: "RAILTEL" },
    { pattern: /\b(BSE)\b/i, symbol: "BSE" },
    { pattern: /\b(CDSL)\b/i, symbol: "CDSL" },
    { pattern: /\b(MAZAGON\s*DOCK|MAZDOCK)\b/i, symbol: "MAZDOCK" },
    { pattern: /\b(BHEL)\b/i, symbol: "BHEL" },
    { pattern: /\b(TITAGARH)\b/i, symbol: "TITAGARH" },
    { pattern: /\b(ZOMATO)\b/i, symbol: "ZOMATO" },
    { pattern: /\b(JIO\s*FIN|JIOFIN)\b/i, symbol: "JIOFIN" }
];

/**
 * Extracts affected stock/index symbols deterministically from headline and summary text.
 */
export function extractAssetsFromText(headline = "", summary = "") {
    const assets = [];
    const headlineText = String(headline || "");
    const summaryText = String(summary || "");

    // Prioritize assets found in headline first
    for (const item of ASSET_ENTITY_MAP) {
        if (item.pattern.test(headlineText) && !assets.includes(item.symbol)) {
            assets.push(item.symbol);
        }
    }
    // Then assets found in summary
    for (const item of ASSET_ENTITY_MAP) {
        if (item.pattern.test(summaryText) && !assets.includes(item.symbol)) {
            assets.push(item.symbol);
        }
    }
    return assets;
}

/**
 * Generates institutional hashtags for taxonomy display and filtering.
 */
export function generateEventHashtags(event) {
    const tags = new Set();
    const cat = String(event.category || "").trim().toLowerCase();
    const subCat = String(event.sub_category || "").trim();
    const instType = String(event.instrument_type || "").trim().toUpperCase();
    const sentiment = String(event.sentiment || "").trim();
    const headline = String(event.headline || "").toLowerCase();
    const assets = Array.isArray(event.affected_assets) ? event.affected_assets : [];

    // 1. Primary Instrument / Macro Tag
    if (instType === "MACRO_POLICY" || cat === "policy" || cat === "macro") {
        tags.add("#MacroPolicy");
    } else if (instType === "COMMODITY" || cat === "commodities") {
        tags.add("#Commodities");
    } else if (instType === "CURRENCY" || cat === "currency") {
        tags.add("#FXMarkets");
    } else if (instType === "GLOBAL" || cat === "global" || cat === "geopolitical") {
        tags.add("#GlobalMacro");
    } else if (cat === "earnings") {
        tags.add("#EarningsSeason");
    } else {
        tags.add("#BroadMarket");
    }

    // 2. Sub-Category / Catalyst Tag
    if (subCat && subCat.length > 2) {
        const cleanSub = "#" + subCat.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanSub.length > 2 && cleanSub.length <= 22) {
            tags.add(cleanSub);
        }
    } else {
        if (/repo|interest rate|monetary|mpc|rbi|rate hike|rate cut/.test(headline)) tags.add("#RateDecision");
        else if (/q1|q2|q3|q4|quarterly|pat|profit|revenue|guidance/.test(headline)) tags.add("#QuarterlyResults");
        else if (/fii|dii|foreign institutional|outflow|inflow/.test(headline)) tags.add("#FIIFlows");
        else if (/crude|oil|brent|petroleum/.test(headline)) tags.add("#CrudeOil");
        else if (/inflation|cpi|wpi/.test(headline)) tags.add("#InflationCPI");
        else if (/ipo|ofs|bidding|anchor/.test(headline)) tags.add("#IPOWatch");
        else if (/vix|volatility|circuit/.test(headline)) tags.add("#MarketVolatility");
        else if (/upi|mdr|payment|digital payment/.test(headline)) tags.add("#DigitalPayments");
        else if (/ceo|md|leadership|board|management/.test(headline)) tags.add("#LeadershipChange");
        else if (/gainers|losers|top gainers/.test(headline)) tags.add("#TopMovers");
        else tags.add("#MarketIntelligence");
    }

    // 3. Asset Ticker Tags (Top 2 primary)
    for (const a of assets.slice(0, 2)) {
        if (typeof a === "string" && a.length > 1) {
            tags.add("#" + a.replace(/[^a-zA-Z0-9]/g, ''));
        }
    }

    // 4. Directional / Dynamic Tag
    if (sentiment === "Very Bullish" || sentiment === "Bullish") {
        tags.add(/rally|surge|jump|gain|high/.test(headline) ? "#MarketRally" : "#BullishBias");
    } else if (sentiment === "Very Bearish" || sentiment === "Bearish") {
        tags.add(/slide|drop|fall|tumble|low/.test(headline) ? "#MarketCorrection" : "#BearishPressure");
    } else {
        tags.add("#Consolidation");
    }

    return Array.from(tags).slice(0, 5);
}

/**
 * Validates and sanitizes an AI response before computing score and saving to DB.
 * Returns { valid, errors, sanitized } — sanitized always has a computed event_score.
 */
export function validateAndSanitizeEvent(raw, originalHeading = "") {
    const errors = [];
    const sanitized = { ...raw };

    // Anti-truncation guardrail: check if headline is cut off
    if (!sanitized.headline || sanitized.headline.trim().length === 0) {
        if (originalHeading && originalHeading.trim().length > 0) {
            sanitized.headline = originalHeading.trim();
            errors.push("Auto-corrected: empty headline restored from original heading");
        } else {
            errors.push("headline is required");
        }
    } else if (isHeadlineTruncated(sanitized.headline, originalHeading)) {
        if (originalHeading && originalHeading.trim().length > 0) {
            errors.push(`Auto-corrected: truncated headline "${sanitized.headline}" restored from original "${originalHeading}"`);
            sanitized.headline = originalHeading.trim();
        } else {
            // Clean up trailing broken punctuation or numbers
            sanitized.headline = sanitized.headline.replace(/[,;:\-–—\(\[\{₹$€£&/\\#@\+]\s*$/, "").trim();
        }
    }

    if (!VALID_SENTIMENTS.includes(raw.sentiment))   { errors.push(`invalid sentiment: ${raw.sentiment}`);   sanitized.sentiment      = "Neutral"; }
    if (!VALID_IMPORTANCE.includes(raw.importance))  { errors.push(`invalid importance: ${raw.importance}`); sanitized.importance     = "Medium"; }
    if (!VALID_SEVERITY.includes(raw.severity))      { errors.push(`invalid severity: ${raw.severity}`);     sanitized.severity       = "Normal"; }
    if (!VALID_OVERRIDE.includes(raw.override_mode)) { sanitized.override_mode = "None"; }
    if (!VALID_HORIZONS.includes(raw.horizon))       { sanitized.horizon       = "Swing"; }
    if (!VALID_INSTRUMENTS.includes(raw.instrument_type)) { sanitized.instrument_type = "INDICES"; }

    // Logical consistency: Neutral sentiment cannot have Major+ severity
    if (sanitized.sentiment === "Neutral" && ["Major", "Systemic", "Black Swan"].includes(sanitized.severity)) {
        sanitized.severity = "Important";
        errors.push("Auto-corrected: Neutral sentiment cannot have Major+ severity");
    }

    sanitized.confidence      = Math.max(0, Math.min(100, Number(raw.confidence) || 60));
    sanitized.affected_assets = Array.isArray(sanitized.affected_assets) ? sanitized.affected_assets : [];
    sanitized.key_data_points = Array.isArray(sanitized.key_data_points)  ? sanitized.key_data_points  : [];
    sanitized.ttl_hours       = Number.isInteger(Number(raw.ttl_hours)) ? Number(raw.ttl_hours) : 72; // Default to 72 hours (3 days)

    // Category validation & automatic fallback
    const matchedCat = EVENT_CATEGORIES.find(
        c => c.label.toLowerCase() === String(raw.category || "").trim().toLowerCase()
    );
    if (matchedCat) {
        sanitized.category = matchedCat.label;
    } else {
        const INSTRUMENT_TO_CATEGORY = {
            COMMODITY: "Commodities",
            CURRENCY: "Currency",
            GLOBAL: "Global",
            EQUITY: "Corporate",
            MACRO_POLICY: "Macro",
            INDICES: "Macro"
        };
        sanitized.category = INSTRUMENT_TO_CATEGORY[sanitized.instrument_type] || "Macro";
        if (raw.category) {
            errors.push(`Auto-corrected: unknown category "${raw.category}" -> defaulted to "${sanitized.category}"`);
        } else {
            errors.push(`Auto-corrected: missing category -> inferred "${sanitized.category}" from instrument_type`);
        }
    }

    // Clean & normalize affected_assets
    sanitized.affected_assets = sanitized.affected_assets
        .filter(a => typeof a === "string" && a.trim().length > 0)
        .map(a => a.trim().toUpperCase());

    // Comprehensive systematic entity extraction from headline + summary
    const combinedText = `${sanitized.headline || ""} ${sanitized.summary || ""} ${originalHeading || ""}`;
    const extractedAssets = extractAssetsFromText(sanitized.headline, sanitized.summary);
    if (originalHeading) {
        const headingAssets = extractAssetsFromText(originalHeading, "");
        for (const ha of headingAssets) {
            if (!extractedAssets.includes(ha)) extractedAssets.push(ha);
        }
    }

    // Merge systematically extracted assets with AI assets
    const mergedAssets = Array.from(new Set([...extractedAssets, ...sanitized.affected_assets]));
    if (mergedAssets.length > sanitized.affected_assets.length) {
        errors.push(`Auto-corrected: merged extracted assets: ${mergedAssets.join(", ")}`);
        sanitized.affected_assets = mergedAssets.slice(0, 8);
    }

    // If still empty, check sector keyword fallbacks
    if (sanitized.affected_assets.length === 0 && combinedText) {
        const text = combinedText.toUpperCase();
        const fallbackAssets = [];
        if (/BRENT|CRUDE|OIL|OMC/.test(text)) fallbackAssets.push("BPCL", "IOCL", "HPCL");
        if (/PAINT|ASIAN PAINT|BERGER/.test(text)) fallbackAssets.push("ASIANPAINT", "BERGERPAINTS");
        if (/AIRLINE|AVIATION|INDIGO|INTERGLOBE/.test(text)) fallbackAssets.push("INDIGO");
        if (/BANK|RBI|REPO|CREDIT|NIM/.test(text)) fallbackAssets.push("HDFCBANK", "SBIN", "ICICIBANK");
        if (/IT\b|INFOSYS|TCS|WIPRO|TECH M|HCL/.test(text)) fallbackAssets.push("INFY", "TCS", "WIPRO");
        if (/AUTO|VEHICLE|MARUTI|TATA MOTOR|M&M/.test(text)) fallbackAssets.push("MARUTI", "TATAMOTORS", "M&M");
        if (/STEEL|METAL|TATA STEEL|JSW/.test(text)) fallbackAssets.push("TATASTEEL", "JSWSTEEL");
        if (/PHARMA|DRUG|SUN PHARMA|CIPLA/.test(text)) fallbackAssets.push("SUNPHARMA", "CIPLA");
        if (/NIFTY|SENSEX|MARKET WRAP|DOMESTIC MARKET/.test(text)) fallbackAssets.push("NIFTY", "SENSEX");

        if (fallbackAssets.length > 0) {
            sanitized.affected_assets = Array.from(new Set(fallbackAssets)).slice(0, 7);
            errors.push(`Auto-corrected: populated ${sanitized.affected_assets.length} affected assets from keyword triggers`);
        }
    }

    // Quantitative catalyst extraction if key_data_points is empty
    if (sanitized.key_data_points.length === 0 && combinedText) {
        const dataPointMatches = combinedText.match(/(\$\d+(\.\d+)?(\/[a-zA-Z]+)?|\b\d+(\.\d+)?%|\b\d+\s*bps|\b\d+(\.\d+)?\s*(cr|crore|lakh|bn|billion|trillion)|₹\s*[\d,]+(\.\d+)?)/gi);
        if (dataPointMatches && dataPointMatches.length > 0) {
            sanitized.key_data_points = Array.from(new Set(dataPointMatches.map(m => m.trim()))).slice(0, 4);
            errors.push(`Auto-corrected: extracted key data points: ${sanitized.key_data_points.join(", ")}`);
        }
    }

    // Standardize / generate hashtags
    if (Array.isArray(raw.hashtags) && raw.hashtags.length > 0) {
        sanitized.hashtags = raw.hashtags
            .filter(t => typeof t === "string" && t.trim().length > 1)
            .map(t => t.startsWith("#") ? t.trim() : "#" + t.trim().replace(/\s+/g, ''));
    } else {
        sanitized.hashtags = generateEventHashtags(sanitized);
    }

    // Compute event score deterministically
    sanitized.event_score = computeEventScore(
        sanitized.sentiment,
        sanitized.importance,
        sanitized.severity,
        sanitized.confidence,
        sanitized.horizon
    );

    // Compute impact magnitude
    sanitized.impact_magnitude = computeEventImpactMagnitude(
        sanitized.importance,
        sanitized.severity,
        sanitized.confidence,
        sanitized.horizon
    );

    return {
        valid:     errors.filter(e => !e.startsWith("Auto-corrected")).length === 0,
        errors,
        sanitized
    };
}

// ============================================================================================
// SECTION 6: Institutional Asset Extraction (Tailwinds / Headwinds with Beta Sensitivities)
// ============================================================================================

/**
 * Institutional Asset Beta Sensitivities.
 * Maps asset sensitivity coefficients to specific event instruments:
 * - Crude/Commodities: Inverts sign for Upstream E&P (ONGC, OIL = -1.0), amplifies for Paints/OMCs/Aviation (+1.3).
 * - FX/Currency (USDINR depreciation): Inverts sign for IT & Pharma exporters (TCS, INFY, WIPRO, SUNPHARMA = -1.0).
 * - Interest Rates/Macro Policy (Rate Hikes): High sensitivity for Realty (1.3) vs Banks (0.8).
 */
const ASSET_BETA_SENSITIVITIES = {
    COMMODITY: {
        "ONGC": -1.0,  // Upstream benefits from higher crude (reverses bearish commodity signal)
        "OIL": -1.0,
        "BPCL": 1.3,   // Marketing margin hit
        "IOCL": 1.3,
        "HPCL": 1.3,
        "INDIGO": 1.35, // ATF cost surge
        "SPICEJET": 1.35,
        "ASIANPAINT": 1.25, // Raw material inflation
        "BERGERPAINTS": 1.25,
        "TATASTEEL": 1.1,
        "JSWSTEEL": 1.1
    },
    CURRENCY: {
        "TCS": -1.0,   // Rupee weakness boosts USD realizations (reverses bearish currency signal)
        "INFY": -1.0,
        "WIPRO": -1.0,
        "HCLTECH": -1.0,
        "TECHM": -1.0,
        "SUNPHARMA": -0.85,
        "DRREDDY": -0.85,
        "CIPLA": -0.85,
        "BPCL": 1.15,
        "IOCL": 1.15,
        "HPCL": 1.15
    },
    MACRO_POLICY: {
        "REALTY": 1.3,
        "DLF": 1.3,
        "GODREJPROP": 1.3,
        "BANKNIFTY": 0.8,
        "HDFCBANK": 0.8,
        "SBIN": 0.8,
        "MARUTI": 1.1,
        "TATAMOTORS": 1.1,
        "M&M": 1.1
    }
};

function getAssetSensitivityMultiplier(asset, instrumentType) {
    if (!asset || !instrumentType) return 1.0;
    const inst = ASSET_BETA_SENSITIVITIES[instrumentType];
    if (inst && inst[asset] !== undefined) {
        return inst[asset];
    }
    return 1.0;
}

export function extractInstitutionalImpacts(events) {
    if (!events || !Array.isArray(events)) return { tailwinds: [], headwinds: [] };

    // Minimum time-decayed impact for an asset to surface in tailwinds/headwinds.
    const MIN_IMPACT_THRESHOLD = 8.0;

    const assetImpacts = {};

    events.forEach(ev => {
        if (!ev.affected_assets || !Array.isArray(ev.affected_assets)) return;

        const rawScore = Number(ev.event_score) || 0;
        if (rawScore === 0) return;

        // Apply dynamic time decay — events lose influence as they age relative to their TTL
        const decayFactor = computeTimeDecay(ev.created_at, ev.published_time, ev.ttl_hours);
        if (decayFactor === 0) return; // Expired event: skip entirely

        const baseImpact = rawScore * decayFactor;

        ev.affected_assets.forEach(asset => {
            if (!asset || typeof asset !== 'string') return;
            const name = asset.trim().toUpperCase();
            if (name.length === 0) return;

            // Apply institutional beta sensitivity multiplier
            const sensitivity = getAssetSensitivityMultiplier(name, ev.instrument_type);
            const impact = baseImpact * sensitivity;

            if (!assetImpacts[name]) {
                assetImpacts[name] = { totalImpact: 0, count: 0, latestReason: ev.headline, date: ev.created_at };
            }

            assetImpacts[name].totalImpact += impact;
            assetImpacts[name].count += 1;

            if (ev.created_at && (!assetImpacts[name].date || new Date(ev.created_at) > new Date(assetImpacts[name].date))) {
                assetImpacts[name].latestReason = ev.headline;
                assetImpacts[name].date = ev.created_at;
            }
        });
    });

    const impactArray = Object.keys(assetImpacts).map(name => ({
        name,
        totalImpact: assetImpacts[name].totalImpact,
        reason: assetImpacts[name].latestReason
    }));

    // Sort by absolute magnitude (strongest signals surface first)
    impactArray.sort((a, b) => Math.abs(b.totalImpact) - Math.abs(a.totalImpact));

    const tailwinds = [];
    const headwinds = [];

    impactArray.forEach(item => {
        // Display score uses ÷10 scale so val shown is on the familiar ±10 range
        const displayVal = item.totalImpact / 10;
        if (item.totalImpact >= MIN_IMPACT_THRESHOLD && tailwinds.length < 5) {
            tailwinds.push({
                id: item.name,
                label: item.name,
                sub: item.reason.length > 55 ? item.reason.substring(0, 55) + '...' : item.reason,
                val: '+' + displayVal.toFixed(1)
            });
        } else if (item.totalImpact <= -MIN_IMPACT_THRESHOLD && headwinds.length < 5) {
            headwinds.push({
                id: item.name,
                label: item.name,
                sub: item.reason.length > 55 ? item.reason.substring(0, 55) + '...' : item.reason,
                val: displayVal.toFixed(1)
            });
        }
    });

    tailwinds.sort((a, b) => Number(b.val) - Number(a.val));
    headwinds.sort((a, b) => Number(a.val) - Number(b.val));

    return { tailwinds, headwinds };
}

export function computePortfolioMetrics(events, tradingMode = TRADING_MODES.SWING) {
    if (!events || !Array.isArray(events)) return { totalWeight: 0, netMomentum: 0, eventCount: 0, activeSources: 0 };

    // Resolve mode-aware weight multipliers (SWING = all 1.0, no behavior change)
    const horizonWeights  = getEventHorizonWeights(tradingMode);
    const categoryWeights = getEventCategoryWeights(tradingMode);

    let totalWeight = 0;
    let netMomentum = 0;
    const sources = new Set();
    // catMomentum tracks: net momentum, total weight, event count, and directional polarity
    const catMomentum = {};
    const effectiveScores = []; // raw effective impacts for regime divergence penalty

    events.forEach(ev => {
        const rawScore = Number(ev.event_score) || 0;
        if (rawScore === 0) return;

        // Apply dynamic time decay — impact shrinks exponentially as event ages relative to TTL.
        const decayFactor = computeTimeDecay(ev.created_at, ev.published_time, ev.ttl_hours);
        if (decayFactor === 0) return; // Fully expired event: skip

        // Apply horizon multiplier
        const horizonMult = horizonWeights[ev.horizon] ?? 1.0;

        const impact = rawScore * decayFactor * horizonMult;
        effectiveScores.push(Math.abs(impact));
        totalWeight += Math.abs(impact);
        netMomentum += impact;
        if (ev.source) sources.add(ev.source);

        if (ev.category) {
            const cat = ev.category.trim();
            if (!catMomentum[cat]) catMomentum[cat] = { momentum: 0, weight: 0, count: 0, bullishCount: 0, bearishCount: 0 };
            catMomentum[cat].momentum += impact;
            catMomentum[cat].weight   += Math.abs(impact);
            catMomentum[cat].count    += 1;
            if (impact > 0) catMomentum[cat].bullishCount += 1;
            else if (impact < 0) catMomentum[cat].bearishCount += 1;
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // COMPOSITE SCORE — Institutional Grade
    // ─────────────────────────────────────────────────────────────────────────
    // Directional Consensus: -1.0 (pure bearish) to +1.0 (pure bullish)
    const consensus = totalWeight > 0 ? (netMomentum / totalWeight) : 0;

    // Volume Activation (slower curve: 8 events for ~63% activation, 15 for ~85%)
    const activeCount = effectiveScores.length;
    const volumeActivation = 1.0 - Math.exp(-activeCount / 8.0);

    // Regime Divergence Penalty:
    let divergencePenalty = 1.0;
    if (effectiveScores.length > 2) {
        const sorted = [...effectiveScores].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const max    = sorted[sorted.length - 1];
        if (median > 0 && max > 2.5 * median) divergencePenalty = 0.80;
    }

    // Herfindahl-Hirschman Index (HHI) for Sector / Category Concentration
    let sumSquaredShares = 0;
    if (totalWeight > 0) {
        Object.keys(catMomentum).forEach(cat => {
            const share = catMomentum[cat].weight / totalWeight;
            sumSquaredShares += share * share;
        });
    }
    const concentrationPenalty = sumSquaredShares > 0.65 ? 0.88 : 1.0;

    const compositeScore = Math.round(50 + 50 * consensus * volumeActivation * divergencePenalty * concentrationPenalty);

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION / CATEGORY SCORES — Institutional Grade
    // ─────────────────────────────────────────────────────────────────────────
    // Apply category weight multipliers before sorting — this shifts which categories
    // surface at the top based on the active trading mode.
    // SWING mode keeps all multipliers at 1.0 so section order is unchanged.
    Object.keys(catMomentum).forEach(cat => {
        const catMult = categoryWeights[cat] ?? 1.0;
        catMomentum[cat].momentum *= catMult;
        catMomentum[cat].weight   *= catMult;
    });

    const sortedCats = Object.keys(catMomentum).sort((a, b) => Math.abs(catMomentum[b].momentum) - Math.abs(catMomentum[a].momentum));
    const topCats = sortedCats.slice(0, 6); // Top 6 fits the GlobalHeader perfectly

    const sections = topCats.map(cat => {
        const rawMomentum  = catMomentum[cat].momentum;
        const catWeight    = catMomentum[cat].weight;
        const catCount     = catMomentum[cat].count;
        const bullishCount = catMomentum[cat].bullishCount;
        const bearishCount = catMomentum[cat].bearishCount;

        // 1. Category Consensus (-1.0 to +1.0)
        // Directional alignment within this category.
        const catConsensus = catWeight > 0 ? (rawMomentum / catWeight) : 0;

        // 2. Volume Activation — slow logarithmic curve
        // count=1→0.15, count=3→0.39, count=6→0.63, count=10→0.81, count=15→0.92
        const catVolumeActivation = 1.0 - Math.exp(-catCount / 6.0);

        // 3. Contrarian Haircut
        // Measures how unified the category's signals are. If 3 events are bullish
        // but 1 is bearish, conviction is lower than if all 4 are bullish.
        // Ratio: 1.0 = perfect consensus, 0.0 = perfectly split.
        const contrarianRatio = catCount > 0 ? Math.abs(bullishCount - bearishCount) / catCount : 0;

        // 4. Dynamic Score Ceiling Gate
        // Scales with event count — you need more validated signals to earn extreme scores.
        // count=1 → ±15 | count=3 → ±25 | count=6 → ±35 | count=10 → ±45 (hard cap)
        const maxDivergence = Math.min(45, 10 + 5 * catCount);

        // 5. Final Score
        const rawDivergence     = 50 * catConsensus * catVolumeActivation * contrarianRatio;
        const clampedDivergence = Math.max(-maxDivergence, Math.min(maxDivergence, rawDivergence));
        const catScore          = Math.round(50 + clampedDivergence);

        return {
            id:         cat.toLowerCase(),
            shortLabel: cat.substring(0, 4).toUpperCase(),
            score:      Math.max(0, Math.min(100, catScore))
        };
    });

    // -------------------------------------------------------------------------
    // Institutional Confidence Score Algorithm (0-100)
    // -------------------------------------------------------------------------
    let marketConfidence = 0;
    if (events.length > 0) {
        // 1. Signal Alignment: Are events aligning in the same direction or fighting? (0.0 to 1.0)
        const signalAlignment = totalWeight > 0 ? (Math.abs(netMomentum) / totalWeight) : 0;
        
        // 2. Volume Saturation: Confidence approaches 1.0 as sample size increases (Hits ~90% at 10 events)
        const volumeFactor = 1.0 - Math.exp(-events.length / 4.0);
        
        // 3. Innate AI Confidence: Average confidence extracted directly from the raw NLP processing
        let totalInnateConf = 0;
        events.forEach(ev => totalInnateConf += (Number(ev.confidence) || 50));
        const avgInnateConf = totalInnateConf / events.length;
        
        // Weighted Formula: 50% Innate Data Quality, 30% Market Consensus, 20% Statistical Significance
        const score = (avgInnateConf * 0.5) + (signalAlignment * 100 * 0.3) + (volumeFactor * 100 * 0.2);
        
        marketConfidence = Math.min(100, Math.max(0, Math.round(score)));
    }

    return {
        // Display values divided by 10 to convert internal ±100 scale → familiar ±10 range
        totalWeight: (totalWeight / 10).toFixed(1),
        netMomentum: (netMomentum > 0 ? "+" : "") + (netMomentum / 10).toFixed(1),
        netMomentumRaw: netMomentum / 10,
        compositeScore: Math.max(0, Math.min(100, compositeScore)),
        marketConfidence,
        eventCount: events.length,
        activeSources: sources.size,
        sections
    };
}
