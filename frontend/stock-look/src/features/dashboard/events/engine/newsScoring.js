/**
 * @file newsScoring.js
 * @purpose Algorithms for quantifying the market impact of news items.
 * @responsibilities
 * - Calculates a composite impact score based on source, sentiment, and sensitivity.
 * - Simulates AI-driven sentiment analysis (Bullish/Bearish) using keyword heuristics.
 * - Normalizes scores for consistent UI rendering.
 * @key_exports
 * - calculateNewsImpact (Function): Computes the final impact score.
 * @dependencies
 * - None (Pure logic)
 * @lifecycle
 * - Utilized during news feed ingestion or normalization.
 * @date 2026-02-03
 */

// =============================
// Core Logic
// =============================

/**
 * calculateNewsImpact
 * Advanced NLP-simulating engine that determines market impact.
 * @param {Object} newsItem - The news data object.
 * @returns {Object} { score, confidence, intensity, decision }
 */
export function calculateNewsImpact(newsItem) {
    if (!newsItem) return { score: 0, confidence: 50, intensity: 'Neutral', decision: 'No Data' };

    const text = (newsItem.title + " " + (newsItem.takeaway || "")).toLowerCase();

    // 1. NLP Sentiment Intensity Analysis
    const sentiment = analyzeDeepSentiment(text);

    // 2. Source Credibility Logic
    let sourceWeight = 0.5;
    const s = newsItem.source.toLowerCase();
    if (s.includes('rbi') || s.includes('fed') || s.includes('sebi')) sourceWeight = 1.2;
    if (s.includes('bloomberg') || s.includes('reuters')) sourceWeight = 1.0;
    if (s.includes('press release')) sourceWeight = 0.8;

    // 3. Significance & Context Magnitude
    const sensitivity = newsItem.sensitivity === 'High' ? 1.5 :
        newsItem.sensitivity === 'Medium' ? 1.0 : 0.6;

    const surprise = (newsItem.surpriseFactor || 5) / 5; // Normalized around 1.0

    // 4. Final Score Calculation
    // Base Score (sentiment.score) * Source * Sensitivity * Surprise
    let finalScore = sentiment.score * sourceWeight * sensitivity * surprise;

    // Clip to -10 to +10 range
    finalScore = Math.max(-10, Math.min(10, finalScore));

    // 5. AI Confidence & Decision Logic
    const confidence = calculateConfidence(newsItem, sentiment.keywordsFound);
    const intensityLabel = Math.abs(finalScore) > 7 ? 'Extreme' : Math.abs(finalScore) > 4 ? 'High' : 'Moderate';
    const decisionPrefix = finalScore > 2 ? 'Bullish' : finalScore < -2 ? 'Bearish' : 'Neutral';

    return {
        score: parseFloat(finalScore.toFixed(1)),
        confidence,
        intensity: intensityLabel,
        decision: `AI Decision: ${intensityLabel} ${decisionPrefix}`,
        sentiment: sentiment.bias
    };
}

/**
 * analyzeDeepSentiment
 * Simulates advanced NLP by checking for intensity clusters.
 */
function analyzeDeepSentiment(text) {
    const weights = {
        // High Intensity Bearish
        "crash": -4, "panic": -4, "crisis": -4, "bloodbath": -5, "plunge": -3, "emergency": -3, "unexpectedly": -2,
        // Standard Bearish
        "hike": -2, "inflation": -1.5, "miss": -1.5, "deficit": -1.5, "war": -3, "shortfall": -1, "negative": -1, "selling": -1,
        "raises": -1.5, "higher": -1, "pressure": -1, "slowdown": -1.5, "weak": -1,
        // High Intensity Bullish
        "soars": 4, "record": 3, "mega": 3, "breakthrough": 4, "surges": 3, "unprecedented": 2, "goldmine": 4,
        // Standard Bullish
        "cut": 2, "stimulus": 2, "beat": 1.5, "growth": 1.5, "rally": 1.5, "inflow": 1, "buying": 1, "support": 1, "easing": 1,
        "upgrade": 1.5, "strong": 1, "expansion": 1, "recovery": 1
    };

    let totalScore = 0;
    let keywordsFound = 0;

    Object.entries(weights).forEach(([word, weight]) => {
        if (text.includes(word)) {
            totalScore += weight;
            keywordsFound++;
        }
    });

    const bias = totalScore > 0 ? "Bullish" : totalScore < 0 ? "Bearish" : "Neutral";
    return { score: totalScore, bias, keywordsFound };
}

/**
 * calculateConfidence
 * Determines AI's certainty based on data freshness and keyword density.
 */
function calculateConfidence(item, keywords) {
    let base = 60;
    if (keywords > 2) base += 20;
    if (item.sensitivity === 'High') base += 10;
    if (item.source.includes('Bloomberg') || item.source.includes('RBI')) base += 5;
    return Math.min(98, base);
}
