import { CONFIDENCE_CONFIG } from '../config/confidenceConfig';

/**
 * Deterministic Confidence Engine
 * Computes institutional-grade confidence scores for individual cards and modular headers.
 */

/**
 * Computes card-level confidence.
 * C_card = DC * (w1*FR + w2*SR + w3*SS + w4*CV)
 * 
 * @param {Object} cardMeta - Metadata containing raw data points to evaluate.
 *   - hasLiveData (boolean): True if the core value exists.
 *   - isManual (boolean): True if the core value is a user override.
 *   - lastUpdated (number): Timestamp of the data in ms.
 *   - cvValue (number): Cross-Validation score (0.0 to 1.0) if applicable, default 1.0.
 *   - recentTrendCv (number): Coefficient of Variation of recent history. Default 0.
 *   - sourcePipeline (string): 'upstox', 'headless', 'fallback', 'manual'
 * @param {string} module - e.g., 'fundamentals', 'technical', 'options', 'foreign'
 * @returns {number} Confidence score from 0 to 100.
 */
export function computeCardConfidence(cardMeta, module) {
    const config = CONFIDENCE_CONFIG[module] || CONFIDENCE_CONFIG['fundamentals'];
    
    // 1. Data Completeness (DC) - Multiplicative Ceiling
    let dc = 1.0;
    if (!cardMeta.hasLiveData && !cardMeta.isManual) {
        dc = 0.0; // Missing entirely
    } else if (cardMeta.isManual) {
        dc = 0.6; // Ceiling for manual overrides
    } else if (cardMeta.sourcePipeline === 'fallback') {
        dc = 0.8;
    }

    // Short-circuit if completely missing
    if (dc === 0.0) return 0;

    // 2. Freshness (FR)
    let ageSeconds = 0;
    if (typeof cardMeta.lastUpdated === 'number' && !isNaN(cardMeta.lastUpdated)) {
        ageSeconds = (Date.now() - cardMeta.lastUpdated) / 1000;
    }
    const fr = Math.max(0, Math.exp(-config.lambda * Math.max(0, ageSeconds)));

    // 3. Source Reliability (SR)
    let sr = 1.0;
    switch (cardMeta.sourcePipeline) {
        case 'upstox': sr = 1.0; break;
        case 'headless': sr = 0.9; break;
        case 'fallback': sr = 0.8; break;
        case 'unofficial_scrape': sr = 0.7; break;
        case 'manual': sr = 0.5; break;
        default: sr = cardMeta.isManual ? 0.5 : 0.9; 
    }

    // 4. Signal Stability (SS)
    const recentCv = cardMeta.recentTrendCv || 0;
    const ss = 1.0 - Math.min(1.0, recentCv / config.cv_threshold);

    // 5. Cross Validation (CV)
    const cv = cardMeta.cvValue !== undefined ? cardMeta.cvValue : 1.0;

    // Weighted Score
    const weightedSum = 
        (config.w1_FR * fr) + 
        (config.w2_SR * sr) + 
        (config.w3_SS * ss) + 
        (config.w4_CV * cv);

    const totalWeight = config.w1_FR + config.w2_SR + config.w3_SS + config.w4_CV;
    const normalizedSum = totalWeight > 0 ? (weightedSum / totalWeight) : 0;

    const cCard = dc * normalizedSum;
    return Math.round(cCard * 100);
}

/**
 * Computes header-level composite confidence.
 * C_header = PR_gate * [ Sum(creditAllocation_i * C_card_i) / Sum(creditAllocation_i) ] * (1 - k*dispersion)
 * 
 * @param {Array} cards - Array of card objects included in the header.
 *   - cCard (number): The 0-100 confidence score computed for the card.
 *   - creditAllocation (number): The weight/credit assigned to the card.
 *   - normalized (number): -1, 0, 1 for Bearish, Neutral, Bullish (used for dispersion).
 * @param {number} expectedCardCount - Total number of cards expected for the module (for PR_gate).
 * @param {string} module - e.g., 'fundamentals', 'technical'
 * @returns {number} Header confidence score from 0 to 100.
 */
export function computeHeaderConfidence(cards, expectedCardCount, module) {
    if (!cards || cards.length === 0) return 0;
    
    const config = CONFIDENCE_CONFIG[module] || CONFIDENCE_CONFIG['fundamentals'];

    // 1. Participation Ratio (PR_gate)
    const activeCards = cards.filter(c => c.cCard > 0);
    const prGate = expectedCardCount > 0 ? Math.min(1.0, activeCards.length / expectedCardCount) : 1.0;

    if (activeCards.length === 0) return 0;

    // 2. Weighted Average of C_card
    let totalScoreWeighted = 0;
    let totalCredits = 0;

    activeCards.forEach(c => {
        const credit = c.creditAllocation || 1;
        totalScoreWeighted += (c.cCard * credit);
        totalCredits += credit;
    });

    const weightedAvg = totalCredits > 0 ? (totalScoreWeighted / totalCredits) : 0;

    // 3. Dispersion Penalty
    // Calculate standard deviation of the normalized biases (-1, 0, 1)
    let meanBias = 0;
    activeCards.forEach(c => { meanBias += (c.normalized || 0); });
    meanBias /= activeCards.length;

    let variance = 0;
    activeCards.forEach(c => {
        variance += Math.pow((c.normalized || 0) - meanBias, 2);
    });
    variance /= activeCards.length;
    
    // Normalized dispersion (std deviation of a bounded [-1, 1] set is max ~1.0)
    const dispersion = Math.sqrt(variance);
    const penaltyFactor = Math.max(0, 1.0 - (config.k_dispersion * dispersion));

    const cHeader = prGate * weightedAvg * penaltyFactor;
    return Math.round(cHeader);
}
