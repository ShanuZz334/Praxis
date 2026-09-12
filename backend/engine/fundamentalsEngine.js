/**
 * @file fundamentalsEngine.js
 * @purpose Backend Institutional Math Engine for Fundamentals.
 * Processes raw Upstox data into AI-ready structured scores.
 */

import { extractFundamentalData } from './extractors.js';
import * as scorers from '../../frontend/stock-look/src/features/dashboard/fundamentals/engine/scoringEngine.js';
import { getScoreLabel, computeCompanyComposite, computeIndexComposite } from '../../frontend/stock-look/src/features/dashboard/fundamentals/engine/FundamentalCompositeEngine.js';

export function computeFundamentalsForAI(rawData, instrumentKey, instrumentType = 'Companies', tradingMode = 'swing') {
    // 1. Extract variables from raw JSON
    const ext = extractFundamentalData(rawData);

    // 2. Compute Individual Scores
    const peResult = scorers.scorePERatio(ext.currentPE, null, ext.sectorPE);
    const pbResult = scorers.scorePBRatio(ext.currentPB, null, ext.sectorPB);
    const evResult = scorers.scoreEVEbitda(ext.currentEVEbitda, ext.sectorEVEbitda);
    const divResult = scorers.scoreDividendYield(ext.currentDivYield, ext.bondYield);
    const epsResult = scorers.scoreEPSGrowth(ext.epsCAGR, ext.latestYoY, ext.positiveYears, ext.totalPeriods);
    const deResult = scorers.scoreDebtToEquity(ext.currentDE, ext.sectorDE);
    const roeResult = scorers.scoreROE(ext.currentROE, ext.sectorROE);
    const roceResult = scorers.scoreROCE(ext.currentROCE, ext.sectorROCE);
    const roaResult = scorers.scoreROA(ext.currentROA, ext.sectorROA);
    const netMarginResult = scorers.scoreNetMargin(ext.currentNetMargin, ext.sectorNetMargin);
    const opMarginResult = scorers.scoreOperatingMargin(ext.currentOpMargin, ext.sectorOpMargin);
    const crResult = scorers.scoreCurrentRatio(ext.currentRatio, ext.sectorCurrentRatio);
    const icResult = scorers.scoreInterestCoverage(ext.interestCoverage, ext.sectorCoverage);
    
    let fpeResult = { score: null, bias: 'Neutral' };
    if (ext.forwardPE) {
        fpeResult = scorers.scoreForwardPE(ext.forwardPE, ext.currentPE);
        // Guard against anomalous distortion dragging harmonic mean below 25
        if (fpeResult.score !== null && fpeResult.score < 25) {
            fpeResult.score = 35;
        }
    }

    const eyResult = scorers.scoreEarningsYield(ext.currentEarningsYield, null, ext.bondYield);
    const fcfResult = scorers.scoreFreeCashFlow(ext.currentFCF, ext.currentRevenue);
    const revResult = scorers.scoreRevenueGrowth({ cagr: ext.revCAGR, latestYoY: ext.revYoY, positiveYears: ext.revPos, totalPeriods: ext.revTot }, null);
    const patResult = scorers.scoreProfitGrowth({ cagr: ext.patCAGR, latestYoY: ext.patYoY, positiveYears: ext.patPos, totalPeriods: ext.patTot }, null);
    
    // Ownership & Sector
    const promoterResult = scorers.scorePromoterHolding(ext.currentPromoter, ext.prevPromoter);
    const smartMoneyResult = scorers.scoreSmartMoneyFlow(ext.latestInstitutional, ext.prevInstitutional);
    const earningsTrendResult = scorers.scoreEarningsTrend(ext.epsHistory, null);

    // Cash Conversion Cycle
    let cccScore = 50;
    if (ext.inventoryTurnover && ext.receivablesTurnover && ext.payablesTurnover) {
        const cccDays = Math.round((365 / ext.inventoryTurnover) + (365 / ext.receivablesTurnover) - (365 / ext.payablesTurnover));
        if (cccDays < 0) cccScore = 90;
        else if (cccDays < 30) cccScore = 75;
        else if (cccDays < 90) cccScore = 50;
        else cccScore = 20;
    }

    // Macro / Manual Cards
    const adResult = scorers.scoreADRatio(null);
    const vixResult = scorers.scoreVIX(ext.indiaVix);
    const gdpResult = scorers.scoreGDPGrowth(ext.gdpGrowth);
    const fiiResult = scorers.scoreInstitutionalFlow(ext.fiiFlow, ext.diiFlow);
    const analystResult = scorers.scoreAnalystConsensus(ext.analystConsensus);
    const relValResult = scorers.scoreRelativeValuation(ext.blendedPremium);
    const eqResult = scorers.scoreEarningsQuality(ext.cfoToNetProfit);
    const caResult = scorers.scoreCorporateActions(ext.hasCorporateActions);

    // 3. Build Cards Array
    const cards = [
        { id: 'pe_ratio', score: peResult.score, bias: peResult.bias, rawInput: { currentPE: ext.currentPE, sectorPE: ext.sectorPE } },
        { id: 'pb_ratio', score: pbResult.score, bias: pbResult.bias, rawInput: { currentPB: ext.currentPB, sectorPB: ext.sectorPB } },
        { id: 'ev_ebitda', score: evResult.score, bias: evResult.bias, rawInput: { evEbitda: ext.currentEVEbitda } },
        { id: 'forward_pe', score: fpeResult.score, bias: fpeResult.bias, rawInput: { forwardPE: ext.forwardPE } },
        { id: 'dividend_yield', score: divResult.score, bias: divResult.bias, rawInput: { currentDivYield: ext.currentDivYield, bondYield: ext.bondYield } },
        { id: 'eps_growth', score: epsResult.score, bias: epsResult.bias, rawInput: { cagr: ext.epsCAGR, yoy: ext.latestYoY, posYears: ext.positiveYears, total: ext.totalPeriods } },
        { id: 'debt_to_equity', score: deResult.score, bias: deResult.bias, rawInput: { currentDE: ext.currentDE, sectorDE: ext.sectorDE } },
        { id: 'current_ratio', score: crResult.score, bias: crResult.bias, rawInput: { currentRatio: ext.currentRatio } },
        { id: 'roe', score: roeResult.score, bias: roeResult.bias, rawInput: { currentROE: ext.currentROE, sectorROE: ext.sectorROE } },
        { id: 'roce', score: roceResult.score, bias: roceResult.bias, rawInput: { currentROCE: ext.currentROCE, sectorROCE: ext.sectorROCE } },
        { id: 'roa', score: roaResult.score, bias: roaResult.bias, rawInput: { currentROA: ext.currentROA } },
        { id: 'net_margin', score: netMarginResult.score, bias: netMarginResult.bias, rawInput: { currentMargin: ext.currentNetMargin } },
        { id: 'operating_margin', score: opMarginResult.score, bias: opMarginResult.bias, rawInput: { currentMargin: ext.currentOpMargin } },
        { id: 'interest_coverage', score: icResult.score, bias: icResult.bias, rawInput: { currentCoverage: ext.interestCoverage } },
        { id: 'earnings_yield', score: eyResult.score, bias: eyResult.bias, rawInput: { earningsYield: ext.currentEarningsYield } },
        { id: 'free_cash_flow', score: fcfResult.score, bias: fcfResult.bias, rawInput: { currentFCF: ext.currentFCF } },
        { id: 'revenue_growth', score: revResult.score, bias: revResult.bias, rawInput: { cagr: ext.revCAGR } },
        { id: 'profit_growth', score: patResult.score, bias: patResult.bias, rawInput: { cagr: ext.patCAGR } },
        { id: 'promoter_holding', score: promoterResult.score, bias: promoterResult.bias, rawInput: { promoter: ext.currentPromoter } },
        { id: 'smart_money_flow', score: smartMoneyResult.score, bias: smartMoneyResult.bias, rawInput: { institutional: ext.latestInstitutional } },
        { id: 'earnings_trend', score: earningsTrendResult.score, bias: earningsTrendResult.bias, rawInput: { trend: earningsTrendResult.trendLabel } },
        { id: 'cash_conversion', score: cccScore, bias: cccScore >= 70 ? 'Bullish' : cccScore <= 30 ? 'Bearish' : 'Neutral', rawInput: {} },
        { id: 'gdp_growth', score: gdpResult.score, bias: gdpResult.bias, rawInput: { gdpGrowth: ext.gdpGrowth } },
        { id: 'fii_dii_flow', score: fiiResult.score, bias: fiiResult.bias, rawInput: { fiiFlow: ext.fiiFlow, diiFlow: ext.diiFlow } },
        { id: 'dii_flow', score: fiiResult.score, bias: fiiResult.bias, rawInput: { diiFlow: ext.diiFlow } },
        { id: 'analyst_consensus', score: analystResult.score, bias: analystResult.bias, rawInput: { analystConsensus: ext.analystConsensus } },
        { id: 'relative_valuation', score: relValResult.score, bias: relValResult.bias, rawInput: { blendedPremium: ext.blendedPremium } },
        { id: 'earnings_quality', score: eqResult.score, bias: eqResult.bias, rawInput: { cfoToNetProfit: ext.cfoToNetProfit } },
        { id: 'corporate_actions', score: caResult.score, bias: caResult.bias, rawInput: { hasCorporateActions: ext.hasCorporateActions } },
        { id: 'advance_decline', score: adResult.score, bias: adResult.bias, rawInput: {} },
        { id: 'india_vix', score: vixResult.score, bias: vixResult.bias, rawInput: {} },
        { id: 'mcap_to_gdp', score: ext.marketCapGDP ? (ext.marketCapGDP > 120 ? 30 : 70) : 50, bias: 'Neutral', rawInput: { ratio: ext.marketCapGDP } }
    ];

    // 4. Compute Composite using EXACT frontend convex weighting
    const isIndex = instrumentKey?.startsWith('NSE_INDEX');
    const formattedScores = {};
    cards.forEach(c => {
        if (c.score !== null && c.score !== undefined && !isNaN(Number(c.score))) {
            formattedScores[c.id] = Number(c.score);
        }
    });

    // Provide index aliases if in index mode
    if (isIndex) {
        if (formattedScores['pe_ratio'] !== undefined) formattedScores['nifty_pe'] = formattedScores['pe_ratio'];
        if (formattedScores['pb_ratio'] !== undefined) formattedScores['nifty_pb'] = formattedScores['pb_ratio'];
        if (formattedScores['eps_growth'] !== undefined) formattedScores['eps_yoy'] = formattedScores['eps_growth'];
        if (formattedScores['gdp_growth'] !== undefined) formattedScores['gdp'] = formattedScores['gdp_growth'];
        if (formattedScores['fii_dii_flow'] !== undefined) {
            formattedScores['fii'] = formattedScores['fii_dii_flow'];
            formattedScores['dii'] = formattedScores['fii_dii_flow'];
        }
    }
    
    let compositeResult = null;
    try {
        compositeResult = isIndex ? computeIndexComposite(formattedScores, tradingMode) : computeCompanyComposite(formattedScores, tradingMode);
    } catch (err) {
        console.error("Failed to execute FundamentalCompositeEngine", err);
    }

    let compositeScore = 50;
    if (compositeResult && typeof compositeResult.compositeScore === 'number' && compositeResult.compositeScore > 0) {
        compositeScore = compositeResult.compositeScore;
    } else {
        const validScores = cards.map(c => c.score).filter(s => s !== null && !isNaN(s));
        compositeScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 50;
    }
    
    let regime = compositeResult?.regime;
    if (!regime) {
        try {
            const rl = getScoreLabel(compositeScore);
            regime = { label: rl.label, description: "Backend AI Engine computed regime.", confidence: 80, color: rl.cssColor, hexColor: rl.hexColor };
        } catch(e) {
            regime = { label: compositeScore >= 60 ? 'Bullish' : compositeScore <= 40 ? 'Bearish' : 'Neutral', description: "Backend AI Engine computed regime." };
        }
    }

    const sections = compositeResult?.sections || [];
    const tailwinds = compositeResult?.tailwinds || [];
    const risks = compositeResult?.headwinds || compositeResult?.risks || [];

    return {
        compositeScore,
        regime,
        sections,
        tailwinds,
        risks,
        cards,
        formattedScores,
        nestedTreePayload: compositeResult?.nestedTreePayload || null
    };
}
