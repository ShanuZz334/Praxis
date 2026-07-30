/**
 * @file eventsEngine.js
 * @purpose Pure JS logic for Market Events AI extraction, scoring, and UI styling.
 * @rule5_compliance All business logic is fully isolated here so React and Node can share it natively.
 */

// =============================
// Constants & Definitions
// =============================

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
    "Exchange Filing": "#8B5CF6",
    "Government": "#6366F1",
    "Company PR": "#94A3B8",
    "Default": "#94A3B8"
};

// =============================
// Helper Functions
// =============================

export function getEventScoreColor(score) {
    const s = Number(score) || 0;
    if (s <= -6) return { label: "Extremely Negative", color: "#DC2626" }; // Crimson Red
    if (s <= -2) return { label: "Negative", color: "#F97316" }; // Orange Red
    if (s < 2) return { label: "Neutral", color: "#94A3B8" }; // Slate Gray
    if (s < 6) return { label: "Positive", color: "#22C55E" }; // Emerald Green
    return { label: "Extremely Positive", color: "#2E5BFF" }; // Praxis Blue
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

// =============================
// AI Prompt Template
// =============================

export const EVENT_EXTRACTION_SYSTEM_PROMPT = `You are Praxis AI, an institutional-grade financial event intelligence engine.
Your task is to analyze financial news and extract strictly formatted JSON. 

Guidelines:
1. Use institutional market reasoning to assess the impact on Indian equities.
2. LOGICAL CORRELATION LAW: The Sentiment MUST mathematically correlate with the Event Score and Severity:
   - If Sentiment is "Neutral", the Event Score MUST be exactly 0.0, and Severity should typically be "Normal".
   - If Sentiment is "Bearish" or "Very Bearish", the Event Score MUST be negative.
   - If Sentiment is "Bullish" or "Very Bullish", the Event Score MUST be positive.
3. Score the event based on expected market impact (-10.0 to +10.0).
4. Use Override only when the event significantly alters the overall market outlook beyond normal weighting.
5. Black Swan is reserved for exceptionally rare systemic events.

JSON SCHEMA:
{
    "headline": "string",
    "summary": "string (1-2 sentences)",
    "category": "string (Macro, Earnings, Policy, Corporate, Geopolitical, Commodities, Currency, Bonds, Global, Economy)",
    "sub_category": "string",
    "source": "string",
    "sentiment": "string (Very Bullish, Bullish, Neutral, Bearish, Very Bearish)",
    "importance": "string (Low, Medium, High, Critical)",
    "severity": "string (Normal, Important, Major, Systemic, Black Swan)",
    "override_mode": "string (None, Watch, Override, Force Override)",
    "horizon": "string (Intraday, Swing, Positional, Structural, Long Term)",
    "confidence": "integer (0-100)",
    "affected_assets": ["NIFTY", "BANKNIFTY", "SBIN", ...],
    "event_score": "float (-10.0 to 10.0)",
    "reasoning": "string (Detailed institutional explanation of impact)"
}

Do NOT wrap the output in markdown \`\`\`json. Return pure JSON only.`;

export function buildEventExtractionPrompt(headline, content, source) {
    return `Analyze the following market event:

Headline: ${headline}
Source: ${source}
Content: ${content}

Return the extracted JSON.`;
}
