/**
 * @file FundamentalCompositeEngine.js
 * @purpose Institutional-grade composite scoring engine for the Fundamental Dashboard.
 *
 * Section Aggregation Methods (by financial theory):
 *   COMPANY MODE (7 sections):
 *     Valuation        → Weighted Harmonic Mean   (penalizes extreme overvaluation)
 *     Market Health    → Weighted Geometric Mean  (all factors must align)
 *     Inst. Flow       → Direct score             (single source)
 *     Growth           → Trimmed Weighted Mean    (ignores outlier, rewards consistency)
 *     Macro            → Direct score             (single source)
 *     Profitability    → Threshold-Gated Mean     (poor ROE/ROCE triggers penalty gate)
 *     Financial Health → Min-Anchored Blend       (weakest link dominates)
 *
 *   INDEX MODE (7 sections):
 *     Index Valuation  → Weighted Harmonic Mean
 *     Mkt Breadth      → Direct score
 *     Inst. Flow       → Direct score
 *     Volatility/Risk  → Inverse Min-Anchored     (high VIX suppresses entire composite)
 *     Opt. Sentiment   → Direct score
 *     Momentum         → Weighted Geometric Mean
 *     Growth/Macro     → Weighted Mean
 *
 *   Composite = Convex-weighted sum of section scores with:
 *     - Distress penalties (4pts per section < 25)
 *     - Index VIX cap (if VIX section < 20, composite capped at 45)
 */

import { getCompositeColor, getIndicatorColor } from '../../../../shared/config/scoreColors.js';
import { getIndicatorConfig } from '../../../../shared/config/indicatorConfig.js';
import { CARD_REGISTRY } from '../../../../shared/config/cardRegistry.js';
import { getWeightsForMode } from '../../../../shared/weights/modeWeights.js';

// ─── Title → ID Map ──────────────────────────────────────────────────────────
export const TITLE_TO_ID = Object.values(CARD_REGISTRY).reduce((acc, card) => {
    acc[card.displayName] = card.id;
    return acc;
}, {});

export const ID_TO_TITLE = Object.values(CARD_REGISTRY).reduce((acc, card) => {
    acc[card.id] = card.displayName;
    return acc;
}, {});

export const INDEX_CARD_TO_SECTION_MAP = {
    [CARD_REGISTRY.nifty_pe.id]: 'Valuation', [CARD_REGISTRY.nifty_pb.id]: 'Valuation', 'mcap_gdp': 'Valuation', [CARD_REGISTRY.earnings_yield.id]: 'Valuation', [CARD_REGISTRY.dividend_yield.id]: 'Valuation',
    [CARD_REGISTRY.eps_yoy.id]: 'Earnings', [CARD_REGISTRY.forward_eps.id]: 'Earnings', [CARD_REGISTRY.profit_margin.id]: 'Earnings',
    [CARD_REGISTRY.gdp.id]: 'Macro', [CARD_REGISTRY.cpi.id]: 'Macro', [CARD_REGISTRY.repo.id]: 'Macro', [CARD_REGISTRY.fiscal_deficit.id]: 'Macro',
    [CARD_REGISTRY.fii.id]: 'Liquidity', [CARD_REGISTRY.dii.id]: 'Liquidity', [CARD_REGISTRY.fii_trend.id]: 'Liquidity', [CARD_REGISTRY.system_liquidity.id]: 'Liquidity', [CARD_REGISTRY.mf_flows.id]: 'Liquidity',
    [CARD_REGISTRY.advance_decline.id]: 'Sector', [CARD_REGISTRY.sector_dashboard.id]: 'Sector',
    [CARD_REGISTRY.credit_growth.id]: 'Corporate', [CARD_REGISTRY.corp_debt.id]: 'Corporate', [CARD_REGISTRY.policy_tailwinds.id]: 'Corporate',
    [CARD_REGISTRY.india_vix.id]: 'Global', [CARD_REGISTRY.crude.id]: 'Global', [CARD_REGISTRY.global_liq.id]: 'Global',
};

export const COMPANY_CARD_TO_SECTION_MAP = {
    [CARD_REGISTRY.pe_ratio.id]: 'Valuation', [CARD_REGISTRY.forward_pe.id]: 'Valuation', [CARD_REGISTRY.pb_ratio.id]: 'Valuation', [CARD_REGISTRY.ev_ebitda.id]: 'Valuation', [CARD_REGISTRY.earnings_yield.id]: 'Valuation', [CARD_REGISTRY.relative_valuation.id]: 'Valuation', [CARD_REGISTRY.analyst_consensus.id]: 'Valuation',
    [CARD_REGISTRY.eps_growth.id]: 'Growth', [CARD_REGISTRY.revenue_growth.id]: 'Growth', [CARD_REGISTRY.profit_growth.id]: 'Growth',
    [CARD_REGISTRY.gdp_growth.id]: 'Macro',
    [CARD_REGISTRY.fii_dii_flow.id]: 'Liquidity', [CARD_REGISTRY.dividend_yield.id]: 'Liquidity', [CARD_REGISTRY.earnings_trend.id]: 'Sector',
    [CARD_REGISTRY.promoter_holding.id]: 'Ownership', [CARD_REGISTRY.smart_money_flow.id]: 'Ownership', [CARD_REGISTRY.earnings_quality.id]: 'Ownership', [CARD_REGISTRY.corporate_actions.id]: 'Ownership',
    [CARD_REGISTRY.roe.id]: 'Profitability', [CARD_REGISTRY.roce.id]: 'Profitability', [CARD_REGISTRY.roa.id]: 'Profitability', [CARD_REGISTRY.net_margin.id]: 'Profitability', [CARD_REGISTRY.operating_margin.id]: 'Profitability', [CARD_REGISTRY.cash_conversion.id]: 'Profitability',
    [CARD_REGISTRY.debt_to_equity.id]: 'Financial Health', [CARD_REGISTRY.interest_coverage.id]: 'Financial Health', [CARD_REGISTRY.free_cash_flow.id]: 'Financial Health', [CARD_REGISTRY.current_ratio.id]: 'Financial Health'
};

// ─── Aggregation Utilities ────────────────────────────────────────────────────

function weightedHarmonicMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    const totalW = valid.reduce((s, { weight }) => s + weight, 0);
    if (!totalW) return 0;
    const denom = valid.reduce((s, { weight, score }) => s + weight / Math.max(1, score), 0);
    return denom === 0 ? 0 : totalW / denom;
}

function weightedGeometricMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    const totalW = valid.reduce((s, { weight }) => s + weight, 0);
    if (!totalW) return 0;
    const logSum = valid.reduce((s, { weight, score }) => s + weight * Math.log(Math.max(1, score)), 0);
    return Math.exp(logSum / totalW);
}

function weightedMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    const totalW = valid.reduce((s, { weight }) => s + weight, 0);
    if (!totalW) return 0;
    return valid.reduce((s, { weight, score }) => s + weight * score, 0) / totalW;
}

function trimmedWeightedMean(items) {
    const valid = items.filter(({ score }) => score !== null && !isNaN(score));
    if (!valid.length) return null;
    if (valid.length <= 2) return weightedMean(valid);
    const sorted = [...valid].sort((a, b) => a.score - b.score);
    return weightedMean(sorted.slice(1));
}

function clamp(val, lo = 0, hi = 100) {
    return Math.max(lo, Math.min(hi, val));
}

// ─── Score Labels & Colors ────────────────────────────────────────────────────

/**
 * getScoreLabel — used for COMPOSITE score coloring (Table 1: 7-tier palette).
 * Also used by buildResult for section sub-labels using indicator palette (Table 2).
 */
export function getScoreLabel(score) {
    // Composite palette (Table 1)
    const c = getCompositeColor(score);
    return { label: c.label, hexColor: c.hex, cssColor: `text-[${c.hex}]` };
}

/**
 * getSectionBarColor — used for SECTION TUBES & CARD indicators (Table 2: 5-tier palette).
 */
export function getSectionBarColor(score) {
    return getIndicatorColor(score).hex;
}

// ─── COMPANY MODE — 7 Sections ────────────────────────────────────────────────

function computeCompanySections(scores, W) {
    const g = (id) => {
        const s = scores[id];
        return (s !== undefined && s !== null && !isNaN(Number(s))) ? Number(s) : null;
    };

    const cs = W.company.sections;

    const valuation = weightedHarmonicMean([
        { score: g(CARD_REGISTRY.pe_ratio.id),           weight: cs.valuation.pe_ratio },
        { score: g(CARD_REGISTRY.forward_pe.id),         weight: cs.valuation.forward_pe },
        { score: g(CARD_REGISTRY.ev_ebitda.id),          weight: cs.valuation.ev_ebitda },
        { score: g(CARD_REGISTRY.pb_ratio.id),           weight: cs.valuation.pb_ratio },
        { score: g(CARD_REGISTRY.earnings_yield.id),     weight: cs.valuation.earnings_yield },
        { score: g(CARD_REGISTRY.relative_valuation.id), weight: cs.valuation.relative_valuation },
        { score: g(CARD_REGISTRY.analyst_consensus.id),  weight: cs.valuation.analyst_consensus },
    ]);

    const earnings = trimmedWeightedMean([
        { score: g(CARD_REGISTRY.eps_growth.id),     weight: cs.earnings.eps_growth },
        { score: g(CARD_REGISTRY.revenue_growth.id), weight: cs.earnings.revenue_growth },
        { score: g(CARD_REGISTRY.profit_growth.id),  weight: cs.earnings.profit_growth },
    ]);

    const macro = g(CARD_REGISTRY.gdp_growth.id);

    const liquidity = weightedMean([
        { score: g(CARD_REGISTRY.fii_dii_flow.id),   weight: cs.liquidity.fii_dii_flow },
        { score: g(CARD_REGISTRY.dividend_yield.id), weight: cs.liquidity.dividend_yield },
    ]);

    const ownership = weightedMean([
        { score: g(CARD_REGISTRY.promoter_holding.id), weight: cs.ownership.promoter_holding },
        { score: g(CARD_REGISTRY.smart_money_flow.id), weight: cs.ownership.smart_money_flow },
        { score: g(CARD_REGISTRY.earnings_quality.id), weight: cs.ownership.earnings_quality },
        { score: g(CARD_REGISTRY.corporate_actions.id),weight: cs.ownership.corporate_actions },
    ]);

    const sector = weightedGeometricMean([
        { score: g(CARD_REGISTRY.earnings_trend.id), weight: cs.sector.earnings_trend },
    ]);

    const roeS  = g(CARD_REGISTRY.roe.id);
    const roceS = g(CARD_REGISTRY.roce.id);
    const roaS  = g(CARD_REGISTRY.roa.id);
    let corporate = weightedMean([
        { score: roeS,                                      weight: cs.corporate.roe },
        { score: roceS,                                     weight: cs.corporate.roce },
        { score: roaS,                                      weight: cs.corporate.roa },
        { score: g(CARD_REGISTRY.net_margin.id),            weight: cs.corporate.net_margin },
        { score: g(CARD_REGISTRY.operating_margin.id),      weight: cs.corporate.operating_margin },
        { score: g(CARD_REGISTRY.cash_conversion.id),       weight: cs.corporate.cash_conversion },
    ]);
    if (corporate !== null) {
        const minQuality = Math.min(roeS ?? 100, roceS ?? 100);
        const gate = W.company.penalties.corporate_quality_gate.thresholds;
        if      (minQuality < gate[0].below) corporate *= gate[0].multiplier;
        else if (minQuality < gate[1].below) corporate *= gate[1].multiplier;
        else if (minQuality < gate[2].below) corporate *= gate[2].multiplier;
    }

    // Balance Sheet / Risk (Mapped to global section id for company)
    const fh = cs.financial_health;
    const deS  = g(CARD_REGISTRY.debt_to_equity.id);
    const icS  = g(CARD_REGISTRY.interest_coverage.id);
    const fcfS = g(CARD_REGISTRY.free_cash_flow.id);
    const crS  = g(CARD_REGISTRY.current_ratio.id);
    const healthItems = [
        { score: deS,  weight: fh.debt_to_equity },
        { score: icS,  weight: fh.interest_coverage },
        { score: fcfS, weight: fh.free_cash_flow },
        { score: crS,  weight: fh.current_ratio },
    ].filter(x => x.score !== null);

    let global = null;
    if (healthItems.length > 0) {
        const mean = weightedMean(healthItems);
        const minScore = Math.min(...healthItems.map(x => x.score));
        global = minScore * 0.40 + mean * 0.60;
    }

    return { valuation, earnings, macro, liquidity, sector, corporate, global, ownership };
}

// ─── INDEX MODE — 7 Sections ──────────────────────────────────────────────────

function computeIndexSections(scores, W) {
    const g = (id) => {
        const s = scores[id];
        return (s !== undefined && s !== null && !isNaN(Number(s))) ? Number(s) : null;
    };

    const is = W.index.sections;

    const valuation = weightedHarmonicMean([
        { score: g(CARD_REGISTRY.nifty_pe.id),       weight: is.valuation.nifty_pe },
        { score: g(CARD_REGISTRY.nifty_pb.id),       weight: is.valuation.nifty_pb },
        { score: g('mcap_gdp'),                      weight: is.valuation.mcap_gdp },
        { score: g(CARD_REGISTRY.earnings_yield.id), weight: is.valuation.earnings_yield },
        { score: g(CARD_REGISTRY.dividend_yield.id), weight: is.valuation.dividend_yield },
    ]);

    const earnings = weightedMean([
        { score: g(CARD_REGISTRY.eps_yoy.id),       weight: is.earnings.eps_yoy },
        { score: g(CARD_REGISTRY.forward_eps.id),   weight: is.earnings.forward_eps },
        { score: g(CARD_REGISTRY.profit_margin.id), weight: is.earnings.profit_margin },
    ]);

    const macro = weightedMean([
        { score: g(CARD_REGISTRY.gdp.id),            weight: is.macro.gdp },
        { score: g(CARD_REGISTRY.cpi.id),            weight: is.macro.cpi },
        { score: g(CARD_REGISTRY.repo.id),           weight: is.macro.repo },
        { score: g(CARD_REGISTRY.fiscal_deficit.id), weight: is.macro.fiscal_deficit },
    ]);

    const liquidity = weightedMean([
        { score: g(CARD_REGISTRY.fii.id),              weight: is.liquidity.fii },
        { score: g(CARD_REGISTRY.dii.id),              weight: is.liquidity.dii },
        { score: g(CARD_REGISTRY.fii_trend.id),        weight: is.liquidity.fii_trend },
        { score: g(CARD_REGISTRY.system_liquidity.id), weight: is.liquidity.system_liquidity },
        { score: g(CARD_REGISTRY.mf_flows.id),         weight: is.liquidity.mf_flows },
    ]);

    const sector = weightedMean([
        { score: g(CARD_REGISTRY.advance_decline.id), weight: is.sector.advance_decline },
        { score: g(CARD_REGISTRY.sector_dashboard.id),weight: is.sector.sector_dashboard },
    ]);

    const corporate = weightedGeometricMean([
        { score: g(CARD_REGISTRY.credit_growth.id),    weight: is.corporate.credit_growth },
        { score: g(CARD_REGISTRY.corp_debt.id),        weight: is.corporate.corp_debt },
        { score: g(CARD_REGISTRY.policy_tailwinds.id), weight: is.corporate.policy_tailwinds },
    ]);

    const global = weightedMean([
        { score: g(CARD_REGISTRY.india_vix.id),  weight: is.global.india_vix },
        { score: g(CARD_REGISTRY.crude.id),      weight: is.global.crude },
        { score: g(CARD_REGISTRY.global_liq.id), weight: is.global.global_liq },
    ]);

    return { valuation, earnings, macro, liquidity, sector, corporate, global };
}

// ─── Composite Score ──────────────────────────────────────────────────────────

function computeComposite(sections, isIndex, W) {
    const validSections = sections.filter(s => s.score !== null);
    if (!validSections.length) return 0;

    const totalW = validSections.reduce((s, x) => s + x.weight, 0);
    if (!totalW) return 0;

    let composite = validSections.reduce((s, x) => s + x.weight * x.score, 0) / totalW;

    const distressCount = validSections.filter(x => x.score < 25).length;
    composite = Math.max(0, composite - distressCount * 4);

    if (isIndex && W) {
        // High volatility (VIX spike) pulls down the entire index composite score
        const cap = W.index.caps.vix_distress;
        const globalSection = sections.find(s => s.id === cap.sectionId);
        if (globalSection && globalSection.score !== null && globalSection.score < cap.triggerBelow) {
            composite = Math.min(cap.maxComposite, composite);
        }
    }

    return clamp(composite, 0, 100);
}

// ─── Build Result ─────────────────────────────────────────────────────────────

function buildResult(sections, compositeScore, rawScores) {
    const roundedScore = Math.round(compositeScore);
    // Composite uses Table 1 (7-tier palette)
    const compositeColor = getCompositeColor(roundedScore);

    const dataSections = sections.filter(s => s.score !== null).length;
    const confidence = sections.length > 0 ? Math.round((dataSections / sections.length) * 100) : 0;

    const regime = {
        label: compositeColor.label,
        description: getRegimeDescription(roundedScore),
        confidence,
        color: `text-[${compositeColor.hex}]`,
        hexColor: compositeColor.hex,
    };

    // Institutional Tailwind/Risk Algorithm based on Sections (Macro Drivers)
    const validSections = sections.filter(s => s.score !== null);
    
    // Tailwind: Score >= 60 (Bullish threshold). 
    // Impact = (Deviation from 50) * Configured Impact Weight
    const tailwindImpact = (s) => (s.score - 50) * s.weight;
    const tailwinds = validSections
        .filter(s => s.score >= 60)
        .sort((a, b) => tailwindImpact(b) - tailwindImpact(a))
        .slice(0, 3)
        .map(s => ({
            id: s.id,
            label: s.label,
            value: Math.round(s.score),
            sub: `${Math.round(s.weight * 100)}% weight · ${getIndicatorColor(s.score).label}`,
        }));

    // Headwinds: Score <= 40 (Bearish threshold). 
    // Impact = (Deviation from 50) * Configured Impact Weight
    const headwindImpact = (s) => (50 - s.score) * s.weight;
    const headwinds = validSections
        .filter(s => s.score <= 40)
        .sort((a, b) => headwindImpact(b) - headwindImpact(a))
        .slice(0, 3)
        .map(s => ({
            id: s.id,
            label: s.label,
            shortLabel: s.shortLabel,
            value: Math.round(s.score),
            sub: `${Math.round(s.weight * 100)}% weight • ${getIndicatorColor(s.score).label}`,
        }));

    return {
        sections,
        compositeScore: roundedScore,
        regime,
        tailwinds,
        headwinds,
        rawScores,
    };
}

function buildFundamentalNestedPayload(result, scores, isIndex) {
    const mapToUse = isIndex ? INDEX_CARD_TO_SECTION_MAP : COMPANY_CARD_TO_SECTION_MAP;
    const sectionsMap = {};

    Object.entries(scores).forEach(([id, score]) => {
        if (score === null || score === undefined || isNaN(score)) return;
        const secName = mapToUse[id] || 'General';
        if (!sectionsMap[secName]) sectionsMap[secName] = { name: secName, score: 0, cards: [] };
        
        let normalized = 0;
        if (score > 70) normalized = 1;
        else if (score < 30) normalized = -1;
        
        const config = getIndicatorConfig(id);
        sectionsMap[secName].cards.push({
            name: ID_TO_TITLE[id] || id,
            score: normalized,
            value: Number(score),
            weight: config?.creditScore ?? 5
        });
    });
    
    Object.values(sectionsMap).forEach(sec => {
        const rSec = result.sections.find(r => r.label.toLowerCase() === sec.name.toLowerCase() || (r.shortLabel && r.shortLabel.toLowerCase() === sec.name.substring(0,3).toLowerCase()));
        if (rSec) {
            sec.score = rSec.score;
            sec.weight = rSec.weight;
        }
    });

    return {
        engines: [{
            name: isIndex ? "Fundamentals (Index)" : "Fundamentals (Company)",
            score: result.compositeScore,
            sections: Object.values(sectionsMap)
        }]
    };
}

function getRegimeDescription(score) {
    if (score >= 85) return 'Exceptional fundamental backdrop. Broad-based strength across all dimensions.';
    if (score >= 70) return 'Strong fundamentals confirmed. Risk-on environment with solid macro support.';
    if (score >= 60) return 'Constructive setup. Minor headwinds exist but underlying quality intact.';
    if (score >= 50) return 'Mixed signals. Stock-specific selection critical. No clear directional bias.';
    if (score >= 40) return 'Headwinds building. Capital preservation mode warranted on weaker names.';
    if (score >= 25) return 'Bearish fundamental backdrop. Deterioration across multiple dimensions.';
    return 'Deep risk-off signal. Fundamental crisis indicators active. Extreme caution advised.';
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

export function computeCompanyComposite(scores, mode = 'swing') {
    const W = getWeightsForMode(mode);
    const raw = computeCompanySections(scores, W);

    const cc = W.company.composite;
    const sections = [
        { id: 'valuation', label: 'Valuation',     shortLabel: 'VAL', score: (raw.valuation !== undefined && raw.valuation !== null) ? clamp(Math.round(raw.valuation)) : null, weight: cc.valuation },
        { id: 'earnings',  label: 'Earnings',       shortLabel: 'EAR', score: (raw.earnings  !== undefined && raw.earnings  !== null) ? clamp(Math.round(raw.earnings))  : null, weight: cc.earnings },
        { id: 'macro',     label: 'Macro',          shortLabel: 'MAC', score: (raw.macro     !== undefined && raw.macro     !== null) ? clamp(Math.round(raw.macro))     : null, weight: cc.macro },
        { id: 'liquidity', label: 'Liquidity',      shortLabel: 'LIQ', score: (raw.liquidity !== undefined && raw.liquidity !== null) ? clamp(Math.round(raw.liquidity)) : null, weight: cc.liquidity },
        { id: 'ownership', label: 'Ownership',      shortLabel: 'OWN', score: (raw.ownership !== undefined && raw.ownership !== null) ? clamp(Math.round(raw.ownership)) : null, weight: cc.ownership },
        { id: 'sector',    label: 'Sector',         shortLabel: 'SEC', score: (raw.sector    !== undefined && raw.sector    !== null) ? clamp(Math.round(raw.sector))    : null, weight: cc.sector },
        { id: 'corporate', label: 'Corporate',      shortLabel: 'COR', score: (raw.corporate !== undefined && raw.corporate !== null) ? clamp(Math.round(raw.corporate)) : null, weight: cc.corporate },
        { id: 'global',    label: 'Balance Sheet',  shortLabel: 'BAL', score: (raw.global    !== undefined && raw.global    !== null) ? clamp(Math.round(raw.global))    : null, weight: cc.global },
    ];

    const composite = computeComposite(sections, false, W);
    const result = buildResult(sections, composite, scores);
    result.nestedTreePayload = buildFundamentalNestedPayload(result, scores, false);
    return result;
}

export function computeIndexComposite(scores, mode = 'swing') {
    const W = getWeightsForMode(mode);
    const raw = computeIndexSections(scores, W);

    const ic = W.index.composite;
    const sections = [
        { id: 'valuation', label: 'Valuation', shortLabel: 'VAL', score: (raw.valuation !== undefined && raw.valuation !== null) ? clamp(Math.round(raw.valuation)) : null, weight: ic.valuation },
        { id: 'earnings',  label: 'Earnings',  shortLabel: 'ERN', score: (raw.earnings  !== undefined && raw.earnings  !== null) ? clamp(Math.round(raw.earnings))  : null, weight: ic.earnings },
        { id: 'macro',     label: 'Macro',     shortLabel: 'MAC', score: (raw.macro     !== undefined && raw.macro     !== null) ? clamp(Math.round(raw.macro))     : null, weight: ic.macro },
        { id: 'liquidity', label: 'Liquidity', shortLabel: 'LIQ', score: (raw.liquidity !== undefined && raw.liquidity !== null) ? clamp(Math.round(raw.liquidity)) : null, weight: ic.liquidity },
        { id: 'sector',    label: 'Sector',    shortLabel: 'SEC', score: (raw.sector    !== undefined && raw.sector    !== null) ? clamp(Math.round(raw.sector))    : null, weight: ic.sector },
        { id: 'corporate', label: 'Corporate', shortLabel: 'COR', score: (raw.corporate !== undefined && raw.corporate !== null) ? clamp(Math.round(raw.corporate)) : null, weight: ic.corporate },
        { id: 'global',    label: 'Global',    shortLabel: 'GLO', score: (raw.global    !== undefined && raw.global    !== null) ? clamp(Math.round(raw.global))    : null, weight: ic.global },
    ];

    const composite = computeComposite(sections, true, W);
    const result = buildResult(sections, composite, scores);
    result.nestedTreePayload = buildFundamentalNestedPayload(result, scores, true);
    return result;
}
