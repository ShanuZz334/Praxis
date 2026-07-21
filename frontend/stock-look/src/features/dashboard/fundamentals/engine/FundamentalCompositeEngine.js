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

// ─── Title → ID Map ──────────────────────────────────────────────────────────
export const TITLE_TO_ID = {
    // Valuation
    'P/E Ratio':            'pe_ratio',
    'Forward P/E':          'forward_pe',
    'P/B Ratio':            'pb_ratio',
    'EV/EBITDA':            'ev_ebitda',
    'Earnings Yield':       'earnings_yield',
    // Market Health
    'Market Cap to GDP':    'market_cap_gdp',
    'Dividend Yield':       'dividend_yield',
    'Earnings Trend':       'earnings_trend',
    'FII / DII Flow':       'fii_dii_flow',
    // Growth
    'EPS Growth':           'eps_growth',
    'Revenue Growth':       'revenue_growth',
    'Profit Growth':        'profit_growth',
    'GDP Growth':           'gdp_growth',
    // Profitability
    'ROE':                  'roe',
    'ROCE':                 'roce',
    'ROA':                  'roa',
    'Net Margin':           'net_margin',
    'Operating Margin':     'operating_margin',
    // Financial Health
    'Debt to Equity':       'debt_to_equity',
    'Interest Coverage':    'interest_coverage',
    'Free Cash Flow':       'free_cash_flow',
    'Current Ratio':        'current_ratio',
    // Ownership & Flow (Mapped to Liquidity section)
    'Promoter Holding':     'promoter_holding',
    'Smart Money Flow':     'smart_money_flow',
    'Earnings Quality':     'earnings_quality',
    'Corporate Actions':    'corporate_actions',
    'Relative Valuation':   'relative_valuation',
    // Peer / Analyst
    'Analyst Consensus':    'analyst_consensus',
    'Peer Comparison':      'peer_comparison',
    // Risk
    'Credit Rating':        'credit_rating',
    // Corporate
    'Cash Conv. Cycle':     'cash_conversion',
    // Index-specific
    'Advance / Decline':    'advance_decline',
    'Sector Dashboard':     'sector_dashboard',
    'India VIX':            'india_vix',
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

function computeCompanySections(scores) {
    const g = (id) => {
        const s = scores[id];
        return (s !== undefined && s !== null && !isNaN(Number(s))) ? Number(s) : null;
    };

    const valuation = weightedHarmonicMean([
        { score: g('pe_ratio'),           weight: 0.20 },
        { score: g('forward_pe'),         weight: 0.20 },
        { score: g('ev_ebitda'),          weight: 0.15 },
        { score: g('pb_ratio'),           weight: 0.10 },
        { score: g('earnings_yield'),     weight: 0.10 },
        { score: g('relative_valuation'), weight: 0.10 },
        { score: g('analyst_consensus'),  weight: 0.15 },
    ]);

    const earnings = trimmedWeightedMean([
        { score: g('eps_growth'),     weight: 0.40 },
        { score: g('revenue_growth'), weight: 0.35 },
        { score: g('profit_growth'),  weight: 0.25 },
    ]);

    const macro = g('gdp_growth');

    const liquidity = weightedMean([
        { score: g('fii_dii_flow'),   weight: 0.50 },
        { score: g('dividend_yield'), weight: 0.50 },
    ]);

    const ownership = weightedMean([
        { score: g('promoter_holding'), weight: 0.35 },
        { score: g('smart_money_flow'), weight: 0.35 },
        { score: g('earnings_quality'), weight: 0.15 },
        { score: g('corporate_actions'),weight: 0.15 }
    ]);

    const sector = weightedGeometricMean([
        { score: g('earnings_trend'), weight: 1.0 },
    ]);

    const roeS  = g('roe');
    const roceS = g('roce');
    const roaS  = g('roa');
    let corporate = weightedMean([
        { score: roeS,             weight: 0.20 },
        { score: roceS,            weight: 0.20 },
        { score: roaS,             weight: 0.10 },
        { score: g('net_margin'),  weight: 0.15 },
        { score: g('operating_margin'), weight: 0.15 },
        { score: g('cash_conversion'),  weight: 0.20 },
    ]);
    if (corporate !== null) {
        const minQuality = Math.min(roeS ?? 100, roceS ?? 100);
        if (minQuality < 15) corporate *= 0.50;
        else if (minQuality < 25) corporate *= 0.72;
        else if (minQuality < 35) corporate *= 0.88;
    }

    // Balance Sheet / Risk (Mapped to global for company)
    const deS  = g('debt_to_equity');
    const icS  = g('interest_coverage');
    const fcfS = g('free_cash_flow');
    const crS  = g('current_ratio');
    const healthItems = [
        { score: deS,  weight: 0.25 },
        { score: icS,  weight: 0.25 },
        { score: fcfS, weight: 0.20 },
        { score: crS,  weight: 0.10 },
        { score: g('credit_rating'), weight: 0.20 },
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

function computeIndexSections(scores) {
    const g = (id) => {
        const s = scores[id];
        return (s !== undefined && s !== null && !isNaN(Number(s))) ? Number(s) : null;
    };

    const valuation = weightedHarmonicMean([
        { score: g('nifty_pe'),       weight: 0.30 },
        { score: g('nifty_pb'),       weight: 0.20 },
        { score: g('mcap_gdp'),       weight: 0.20 },
        { score: g('earnings_yield'), weight: 0.20 },
        { score: g('dividend_yield'), weight: 0.10 },
    ]);

    const earnings = weightedMean([
        { score: g('eps_yoy'),           weight: 0.40 },
        { score: g('forward_eps'),       weight: 0.40 },
        { score: g('profit_margin'),     weight: 0.20 },
    ]);

    const macro = weightedMean([
        { score: g('gdp'),             weight: 0.35 },
        { score: g('cpi'),             weight: 0.35 },
        { score: g('repo'),            weight: 0.15 },
        { score: g('fiscal_deficit'),  weight: 0.15 },
    ]);

    const liquidity = weightedMean([
        { score: g('fii'),              weight: 0.25 },
        { score: g('dii'),              weight: 0.20 },
        { score: g('fii_trend'),        weight: 0.25 },
        { score: g('system_liquidity'), weight: 0.15 },
        { score: g('mf_flows'),         weight: 0.15 },
    ]);

    const sector = weightedMean([
        { score: g('advance_decline'),      weight: 0.30 },
        { score: g('sector_dashboard'),     weight: 0.70 },
    ]);

    const corporate = weightedGeometricMean([
        { score: g('credit_growth'),    weight: 0.50 },
        { score: g('corp_debt'),        weight: 0.25 },
        { score: g('policy_tailwinds'), weight: 0.25 },
    ]);

    const global = weightedMean([
        { score: g('india_vix'),  weight: 0.50 },
        { score: g('crude'),      weight: 0.25 },
        { score: g('global_liq'), weight: 0.25 },
    ]);

    const risk = weightedHarmonicMean([
        { score: g('sovereign_risk'),  weight: 0.40 },
        { score: g('npa'),             weight: 0.40 },
        { score: g('reform_momentum'), weight: 0.20 },
    ]);

    return { valuation, earnings, macro, liquidity, sector, corporate, global, risk };
}

// ─── Composite Score ──────────────────────────────────────────────────────────

function computeComposite(sections, isIndex) {
    const validSections = sections.filter(s => s.score !== null);
    if (!validSections.length) return 0;

    const totalW = validSections.reduce((s, x) => s + x.weight, 0);
    if (!totalW) return 0;

    let composite = validSections.reduce((s, x) => s + x.weight * x.score, 0) / totalW;

    const distressCount = validSections.filter(x => x.score < 25).length;
    composite = Math.max(0, composite - distressCount * 4);

    if (isIndex) {
        // High volatility (VIX spike) pulls down the entire index composite score
        const globalSection = sections.find(s => s.id === 'global');
        if (globalSection && globalSection.score !== null && globalSection.score < 20) {
            composite = Math.min(45, composite);
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

    // Risk: Score <= 40 (Bearish threshold). 
    // Impact = (Deviation from 50) * Configured Impact Weight
    const riskImpact = (s) => (50 - s.score) * s.weight;
    const risks = validSections
        .filter(s => s.score <= 40)
        .sort((a, b) => riskImpact(b) - riskImpact(a))
        .slice(0, 3)
        .map(s => ({
            id: s.id,
            label: s.label,
            value: Math.round(s.score),
            sub: `${Math.round(s.weight * 100)}% weight · ${getIndicatorColor(s.score).label}`,
        }));

    return {
        sections,
        compositeScore: roundedScore,
        regime,
        tailwinds,
        risks,
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

export function computeCompanyComposite(scores) {
    const raw = computeCompanySections(scores);

    const sections = [
        { id: 'valuation', label: 'Valuation', shortLabel: 'VAL', score: raw.valuation !== null ? clamp(Math.round(raw.valuation)) : null, weight: 0.20 },
        { id: 'earnings',  label: 'Earnings',  shortLabel: 'EAR', score: raw.earnings  !== null ? clamp(Math.round(raw.earnings))  : null, weight: 0.22 },
        { id: 'macro',     label: 'Macro',     shortLabel: 'MAC', score: raw.macro     !== null ? clamp(Math.round(raw.macro))     : null, weight: 0.05 },
        { id: 'liquidity', label: 'Liquidity', shortLabel: 'LIQ', score: raw.liquidity !== null ? clamp(Math.round(raw.liquidity)) : null, weight: 0.07 },
        { id: 'ownership', label: 'Ownership', shortLabel: 'OWN', score: raw.ownership !== null ? clamp(Math.round(raw.ownership)) : null, weight: 0.10 },
        { id: 'sector',    label: 'Sector',    shortLabel: 'SEC', score: raw.sector    !== null ? clamp(Math.round(raw.sector))    : null, weight: 0.08 },
        { id: 'corporate', label: 'Corporate', shortLabel: 'COR', score: raw.corporate !== null ? clamp(Math.round(raw.corporate)) : null, weight: 0.18 },
        { id: 'global',    label: 'Balance Sheet', shortLabel: 'BAL', score: raw.global!== null ? clamp(Math.round(raw.global))    : null, weight: 0.10 },
    ];

    const composite = computeComposite(sections, false);
    return buildResult(sections, composite, scores);
}

export function computeIndexComposite(scores) {
    const raw = computeIndexSections(scores);

    const sections = [
        { id: 'valuation', label: 'Valuation', shortLabel: 'VAL', score: raw.valuation !== null ? clamp(Math.round(raw.valuation)) : null, weight: 0.15 },
        { id: 'earnings',  label: 'Earnings',  shortLabel: 'EAR', score: raw.earnings  !== null ? clamp(Math.round(raw.earnings))  : null, weight: 0.20 },
        { id: 'macro',     label: 'Macro',     shortLabel: 'MAC', score: raw.macro     !== null ? clamp(Math.round(raw.macro))     : null, weight: 0.20 },
        { id: 'liquidity', label: 'Liquidity', shortLabel: 'LIQ', score: raw.liquidity !== null ? clamp(Math.round(raw.liquidity)) : null, weight: 0.20 },
        { id: 'sector',    label: 'Sector',    shortLabel: 'SEC', score: raw.sector    !== null ? clamp(Math.round(raw.sector))    : null, weight: 0.10 },
        { id: 'corporate', label: 'Corporate', shortLabel: 'COR', score: raw.corporate !== null ? clamp(Math.round(raw.corporate)) : null, weight: 0.05 },
        { id: 'global',    label: 'Global',    shortLabel: 'GLO', score: raw.global    !== null ? clamp(Math.round(raw.global))    : null, weight: 0.05 },
        { id: 'risk',      label: 'Risk',      shortLabel: 'RSK', score: raw.risk      !== null ? clamp(Math.round(raw.risk))      : null, weight: 0.05 },
    ];

    const composite = computeComposite(sections, true);
    return buildResult(sections, composite, scores);
}
