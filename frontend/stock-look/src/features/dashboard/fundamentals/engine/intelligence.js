/**
 * Intelligence Engine
 * Auto-generates market verdicts, regime detection, and confidence scoring
 */

import { classifyFundamentalScore } from './sentiment';

/**
 * Inverse metrics (higher value = worse for markets)
 */
const INVERSE_METRICS = [
    'npa',
    'cpi',
    'fiscal_deficit',
    'corp_debt',
    'crude',
    'vix',
    'sovereign_risk',
];

/**
 * Check if metric is inverse (higher = bad)
 */
function isInverseMetric(cardId) {
    return INVERSE_METRICS.includes(cardId);
}

/**
 * Get effective score (accounting for inverse metrics)
 */
function getEffectiveScore(card) {
    // For inverse metrics, flip the normalized score
    // High NPA (normalized > 0) is actually bad, so we want it negative
    return isInverseMetric(card.id) ? -card.normalized : card.normalized;
}

/**
 * Calculate overall fundamental score from all cards
 */
export function calculateOverallScore(cards) {
    if (!cards || cards.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    cards.forEach(card => {
        // New logic: score is already card.normalized * card.creditScore
        // We want to aggregate the raw scores
        // But wait, the engine/index.js does the aggregation now.
        // This function might be vestigial or used for the dashboard summary if engine didn't do it.
        // Let's make it consistent with the engine.

        // Actually, we should rely on the engine's score passed down if possible.
        // But for safe-keeping here:
        const weight = card.creditScore || 0.5;
        const normalized = card.normalized || 0;

        // [-1 to 1] range score
        totalWeightedScore += normalized * weight;
        totalWeight += weight;
    });

    const avgScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    // Map [-1, 1] to [0, 100]
    return Math.round(((avgScore + 1) / 2) * 100);
}

// ... (existing determineMarketRegime)

/**
 * Determine market regime based on key indicators
 */
export function determineMarketRegime(cards) {
    if (!cards || cards.length === 0) {
        return {
            regime: 'neutral',
            label: 'Neutral',
            color: '#fbbf24',
            icon: '⚖️',
            description: 'Balanced market conditions',
        };
    }

    // Key indicators for regime detection
    const fiiCard = cards.find(c => c.id === 'fii');
    const diiCard = cards.find(c => c.id === 'dii');
    const vixCard = cards.find(c => c.id === 'vix');
    const cycDefCard = cards.find(c => c.id === 'cyc_def');
    const liquidityCard = cards.find(c => c.id === 'system_liquidity');

    // Calculate regime score (-1 to 1)
    let regimeScore = 0;
    let factorCount = 0;

    if (fiiCard) {
        regimeScore += fiiCard.normalized;
        factorCount++;
    }

    if (diiCard) {
        regimeScore += diiCard.normalized;
        factorCount++;
    }

    if (liquidityCard) {
        regimeScore += liquidityCard.normalized;
        factorCount++;
    }

    if (cycDefCard) {
        regimeScore += cycDefCard.normalized;
        factorCount++;
    }

    if (vixCard) {
        regimeScore -= vixCard.normalized; // Inverted (high VIX = risk-off)
        factorCount++;
    }

    const avgRegimeScore = factorCount > 0 ? regimeScore / factorCount : 0;

    // Determine regime
    if (avgRegimeScore > 0.3) {
        return {
            regime: 'risk-on',
            label: 'Risk-On',
            color: '#22c55e',
            icon: '🚀',
            description: 'Strong bullish momentum - favorable for equities',
        };
    } else if (avgRegimeScore < -0.3) {
        return {
            regime: 'risk-off',
            label: 'Risk-Off',
            color: '#ef4444',
            icon: '⚠️',
            description: 'Defensive positioning - caution advised',
        };
    } else {
        return {
            regime: 'neutral',
            label: 'Neutral',
            color: '#fbbf24',
            icon: '⚖️',
            description: 'Mixed signals - stock-specific opportunities',
        };
    }
}

/**
 * Extract top tailwinds (positive factors)
 */
export function extractTopTailwinds(cards, count = 3) {
    if (!cards || cards.length === 0) return [];

    // Get cards with positive effective scores
    const tailwindCards = cards
        .map(card => ({
            ...card,
            effectiveScore: getEffectiveScore(card), // Already handles inverse flipping
            // New pct: use the contribution score or normalized score?
            // User likely wants to see how 'strong' the signal is. 
            // Let's use |normalized| * creditScore as percentage contribution
            // Or just normalized mapped to 0-100.
            // Let's use the explicit 'score' property which is normalized * creditScore.
            // Actually, let's just show the normalized strength scaled by reliability.
            contributionPct: Math.abs(getEffectiveScore(card)) * (card.creditScore || 0.5) * 100
        }))
        .filter(c => c.effectiveScore > 0.1) // Positive threshold
        .sort((a, b) => b.contributionPct - a.contributionPct)
        .slice(0, count);

    return tailwindCards.map(card => ({
        id: card.id,
        label: card.label,
        score: card.effectiveScore,
        creditPct: card.contributionPct, // Display this
        icon: getIconForMetric(card.id),
        color: '#22c55e',
    }));
}

/**
 * Extract top risks (negative factors)
 */
export function extractTopRisks(cards, count = 3) {
    if (!cards || cards.length === 0) return [];

    // Get cards with negative effective scores
    const riskCards = cards
        .map(card => ({
            ...card,
            effectiveScore: getEffectiveScore(card),
            contributionPct: Math.abs(getEffectiveScore(card)) * (card.creditScore || 0.5) * 100
        }))
        .filter(c => c.effectiveScore < -0.1) // Negative threshold
        .sort((a, b) => b.contributionPct - a.contributionPct) // Sort by magnitude
        .slice(0, count);

    return riskCards.map(card => ({
        id: card.id,
        label: card.label,
        score: card.effectiveScore,
        creditPct: card.contributionPct, // Display this
        icon: getIconForMetric(card.id),
        color: '#ef4444',
    }));
}

/**
 * Calculate confidence score based on data freshness & completeness
 */
export function calculateConfidence(cards, dataTimestamp = Date.now()) {
    if (!cards || cards.length === 0) return 0;

    // Factors affecting confidence:
    // 1. Data completeness (% of cards with data)
    // 2. Data freshness (how recent is the data)
    // 3. Data quality (variance in scores)

    const totalCards = cards.length;
    const cardsWithData = cards.filter(c => c.raw !== null && c.raw !== undefined).length;
    const completeness = (cardsWithData / totalCards) * 100;

    // Assume data is fresh if within last 24 hours
    const dataAge = Date.now() - dataTimestamp;
    const hoursOld = dataAge / (1000 * 60 * 60);
    const freshness = Math.max(0, 100 - (hoursOld / 24) * 50); // Decay over 48 hours

    // Overall confidence
    const confidence = (completeness * 0.7 + freshness * 0.3);

    return Math.min(100, Math.max(0, confidence));
}

/**
 * Get icon for metric
 */
function getIconForMetric(metricId) {
    const iconMap = {
        // Valuation
        nifty_pe: '📊',
        nifty_pb: '📈',
        earnings_yield: '💰',
        mcap_gdp: '🏦',

        // Earnings
        eps_yoy: '📈',
        forward_eps: '🔮',
        earnings_revision: '📝',
        sector_earnings: '🏭',

        // Macro
        gdp: '🇮🇳',
        cpi: '🌡️',
        repo: '🏛️',
        fiscal_deficit: '💵',

        // Liquidity
        fii: '🌍',
        dii: '🏠',
        system_liquidity: '💧',
        mf_flows: '👥',

        // Sector
        sector_valuation: '🎯',
        sector_growth: '🚀',
        cyc_def: '⚖️',

        // Corporate
        corp_debt: '💳',
        credit_growth: '📊',
        policy_tailwinds: '🏛️',

        // Global
        global_growth: '🌐',
        crude: '🛢️',
        usdinr: '💱',
        global_liq: '🌊',

        // Risk
        sovereign_risk: '⚠️',
        npa: '🏦',
        reform_momentum: '⚡',
    };

    return iconMap[metricId] || '📌';
}

/**
 * Generate market intelligence summary
 */
export function generateIntelligence(cards) {
    const overallScore = calculateOverallScore(cards);
    const regime = determineMarketRegime(cards);
    const tailwinds = extractTopTailwinds(cards);
    const risks = extractTopRisks(cards);
    const confidence = calculateConfidence(cards);

    return {
        overallScore,
        regime,
        tailwinds,
        risks,
        confidence,
        timestamp: Date.now(),
    };
}
