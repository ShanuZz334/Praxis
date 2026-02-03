/**
 * @file intelligence.js
 * @purpose Intelligence Engine for Fundamental Analysis.
 * @responsibilities
 * - Auto-generates market verdicts and natural language summaries.
 * - Extracts "Tailwinds" (positive drivers) and "Risks" (negative drivers).
 * - Calibrates confidence scores based on data completeness and freshness.
 * @key_exports
 * - generateIntelligence
 * - extractTopTailwinds
 * - extractTopRisks
 * @dependencies
 * - sentiment.js: For regime classification utils.
 * @lifecycle
 * - Consumed by dashboard UI to show insights.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import { classifyFundamentalScore } from './sentiment';

// =============================
// Constants
// =============================
const INVERSE_METRICS = [
    'npa',
    'cpi',
    'fiscal_deficit',
    'corp_debt',
    'crude',
    'vix',
    'sovereign_risk',
];

// =============================
// Helpers
// =============================
function isInverseMetric(cardId) {
    return INVERSE_METRICS.includes(cardId);
}

function getEffectiveScore(card) {
    // Flip score for inverse metrics (e.g., High NPA is negative)
    return isInverseMetric(card.id) ? -card.normalized : card.normalized;
}

function getIconForMetric(metricId) {
    const iconMap = {
        nifty_pe: '📊', nifty_pb: '📈', earnings_yield: '💰', mcap_gdp: '🏦',
        eps_yoy: '📈', forward_eps: '🔮', earnings_revision: '📝', sector_earnings: '🏭',
        gdp: '🇮🇳', cpi: '🌡️', repo: '🏛️', fiscal_deficit: '💵',
        fii: '🌍', dii: '🏠', system_liquidity: '💧', mf_flows: '👥',
        sector_valuation: '🎯', sector_growth: '🚀', cyc_def: '⚖️',
        corp_debt: '💳', credit_growth: '📊', policy_tailwinds: '🏛️',
        global_growth: '🌐', crude: '🛢️', usdinr: '💱', global_liq: '🌊',
        sovereign_risk: '⚠️', npa: '🏦', reform_momentum: '⚡',
    };
    return iconMap[metricId] || '📌';
}

// =============================
// Core Logic: Regime Calculation
// =============================
export function determineMarketRegime(cards) {
    if (!cards || cards.length === 0) return createNeutralRegime();

    // Key indicators focus
    const keyIndicators = ['fii', 'dii', 'system_liquidity', 'cyc_def', 'vix'];
    let regimeScore = 0;
    let factorCount = 0;

    cards.forEach(c => {
        if (keyIndicators.includes(c.id)) {
            // Invert VIX logic
            const val = c.id === 'vix' ? -c.normalized : c.normalized;
            regimeScore += val;
            factorCount++;
        }
    });

    const avg = factorCount > 0 ? regimeScore / factorCount : 0;

    if (avg > 0.3) return { regime: 'risk-on', label: 'Risk-On', color: '#22c55e', icon: '🚀', description: 'Strong bullish momentum - favorable for equities' };
    if (avg < -0.3) return { regime: 'risk-off', label: 'Risk-Off', color: '#ef4444', icon: '⚠️', description: 'Defensive positioning - caution advised' };
    return createNeutralRegime();
}

function createNeutralRegime() {
    return { regime: 'neutral', label: 'Neutral', color: '#fbbf24', icon: '⚖️', description: 'Mixed signals - stock-specific opportunities' };
}

// =============================
// Insight Extractors
// =============================
export function extractTopTailwinds(cards, count = 3) {
    if (!cards || cards.length === 0) return [];

    return cards
        .map(card => ({
            ...card,
            effectiveScore: getEffectiveScore(card),
            contributionPct: Math.abs(getEffectiveScore(card)) * (card.creditScore || 0.5) * 100
        }))
        .filter(c => c.effectiveScore > 0.1)
        .sort((a, b) => b.contributionPct - a.contributionPct)
        .slice(0, count)
        .map(formatInsightCard);
}

export function extractTopRisks(cards, count = 3) {
    if (!cards || cards.length === 0) return [];

    return cards
        .map(card => ({
            ...card,
            effectiveScore: getEffectiveScore(card),
            contributionPct: Math.abs(getEffectiveScore(card)) * (card.creditScore || 0.5) * 100
        }))
        .filter(c => c.effectiveScore < -0.1)
        .sort((a, b) => b.contributionPct - a.contributionPct)
        .slice(0, count)
        .map(c => ({ ...formatInsightCard(c), color: '#ef4444' }));
}

function formatInsightCard(card) {
    return {
        id: card.id,
        label: card.label,
        score: card.effectiveScore,
        creditPct: card.contributionPct,
        icon: getIconForMetric(card.id),
        color: '#22c55e',
    };
}

// =============================
// Confidence Scoring
// =============================
export function calculateConfidence(cards, dataTimestamp = Date.now()) {
    if (!cards || cards.length === 0) return 0;

    const totalCards = cards.length;
    const cardsWithData = cards.filter(c => c.raw !== null && c.raw !== undefined).length;
    const completeness = (cardsWithData / totalCards) * 100;

    const dataAge = Date.now() - dataTimestamp;
    const hoursOld = dataAge / (1000 * 60 * 60);
    const freshness = Math.max(0, 100 - (hoursOld / 24) * 50);

    const confidence = (completeness * 0.7 + freshness * 0.3);
    return Math.min(100, Math.max(0, confidence));
}

// =============================
// Main Export
// =============================
export function generateIntelligence(cards) {
    return {
        regime: determineMarketRegime(cards),
        tailwinds: extractTopTailwinds(cards),
        risks: extractTopRisks(cards),
        confidence: calculateConfidence(cards),
        timestamp: Date.now(),
    };
}
