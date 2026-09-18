/**
 * @file eventsReliability.js
 * @purpose Institutional source reliability scoring and credibility tiering for the Praxis Event Intelligence Engine.
 *
 * Tier Hierarchy:
 * - Tier 1 (1.00): Statutory / Regulatory / Official Filings (RBI, SEBI, NSE, BSE, Government Gazette, Exchange Filings)
 * - Tier 2 (0.90): Primary Institutional Financial Wires (Bloomberg, Reuters, WSJ, Financial Times)
 * - Tier 3 (0.78): Established National Financial Media (Economic Times, CNBC, CNBC TV18, Mint, Business Standard, Financial Express)
 * - Tier 4 (0.65): Digital Financial Portals & Automated Aggregators (Moneycontrol, NDTV Profit, Zee Business, Yahoo Finance, Upstox, Market News)
 * - Tier 5 (0.50): Corporate PR / Speculative / Anonymous / Default Fallbacks
 */

export const SOURCE_RELIABILITY_WEIGHTS = {
    // Tier 1: Statutory / Regulatory / Direct Exchange Filings
    "RBI": 1.00,
    "SEBI": 1.00,
    "NSE": 1.00,
    "BSE": 1.00,
    "Exchange Filing": 1.00,
    "Government": 1.00,

    // Tier 2: Global Financial Institutional Wires
    "Bloomberg": 0.90,
    "Reuters": 0.90,
    "WSJ": 0.90,
    "Financial Times": 0.90,

    // Tier 3: National Financial Daily Press
    "Economic Times": 0.78,
    "Mint": 0.78,
    "Business Standard": 0.78,
    "Financial Express": 0.78,
    "CNBC": 0.78,
    "CNBC TV18": 0.78,

    // Tier 4: Digital Portals & Broadcast News
    "Moneycontrol": 0.65,
    "NDTV Profit": 0.65,
    "Zee Business": 0.65,
    "Yahoo Finance": 0.65,
    "Upstox": 0.65,
    "Market News (Auto)": 0.65,

    // Tier 5: Corporate PR / Unverified
    "Company PR": 0.50,
    "Default": 0.50
};

/**
 * Resolves the institutional credibility multiplier for an event source.
 * @param {string} sourceName
 * @returns {number} Reliability coefficient in range [0.50, 1.00]
 */
export function getSourceReliability(sourceName) {
    if (!sourceName || typeof sourceName !== "string") return 0.50;
    const clean = sourceName.trim();
    if (SOURCE_RELIABILITY_WEIGHTS[clean] !== undefined) {
        return SOURCE_RELIABILITY_WEIGHTS[clean];
    }
    
    // Substring / fuzzy match
    const lower = clean.toLowerCase();
    if (/rbi|reserve bank|sebi|nse|bse|filing|exchange|govt|ministry/i.test(lower)) return 1.00;
    if (/bloomberg|reuters|wsj|wall street|financial times/i.test(lower)) return 0.90;
    if (/economic times|et\b|mint|business standard|cnbc|financial express/i.test(lower)) return 0.78;
    if (/moneycontrol|ndtv|zee|yahoo|upstox|auto/i.test(lower)) return 0.65;
    
    return 0.50;
}

// Backwards-compatible legacy map
export const EVENTS_RELIABILITY = SOURCE_RELIABILITY_WEIGHTS;

export default SOURCE_RELIABILITY_WEIGHTS;
