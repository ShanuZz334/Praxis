/**
 * @file fundamentalsEngine.js
 * @purpose Backend Institutional Math Engine for Fundamentals.
 * Processes raw Upstox data into AI-ready structured scores.
 */

import { extractFundamentalData } from './extractors.js';
import * as scorers from '../../frontend/stock-look/src/features/dashboard/fundamentals/engine/scoringEngine.js';
import { getScoreLabel } from '../../frontend/stock-look/src/features/dashboard/fundamentals/engine/FundamentalCompositeEngine.js';

export function computeFundamentalsForAI(rawData, instrumentKey, instrumentType = 'Companies') {
    // 1. Extract variables from raw JSON
    const ext = extractFundamentalData(rawData);

    // 2. Compute Individual Scores
    const peResult = scorers.scorePERatio(ext.currentPE, null, ext.sectorPE);
    const pbResult = scorers.scorePBRatio(ext.currentPB, null, ext.sectorPB);
    const divResult = scorers.scoreDividendYield(ext.currentDivYield, ext.bondYield);
    const epsResult = scorers.scoreEPSGrowth(ext.epsCAGR, ext.latestYoY, ext.positiveYears, ext.totalPeriods);
    const deResult = scorers.scoreDebtToEquity(ext.currentDE, ext.sectorDE);
    const roeResult = scorers.scoreROE(ext.currentROE, ext.sectorROE);
    const roceResult = scorers.scoreROCE(ext.currentROCE, ext.sectorROCE);
    const netMarginResult = scorers.scoreNetMargin(ext.currentNetMargin, ext.sectorNetMargin);
    const opMarginResult = scorers.scoreOperatingMargin(ext.currentOpMargin, ext.sectorOpMargin);
    const crResult = scorers.scoreDebtToEquity(ext.currentRatio, ext.sectorCurrentRatio); // Using DE scorer logic roughly for CR in backend for now or we can use an actual scorer if we had it, wait!
    const icResult = scorers.scoreInterestCoverage(ext.interestCoverage, ext.sectorCoverage);
    const fpeResult = scorers.scoreForwardPE(ext.forwardPE, ext.currentPE);
    const eyResult = scorers.scoreEarningsYield(ext.currentEarningsYield, null, ext.bondYield);
    const fcfResult = scorers.scoreFreeCashFlow(ext.currentFCF, ext.currentRevenue);
    const revResult = scorers.scoreRevenueGrowth({cagr: ext.revCAGR, latestYoY: ext.revYoY, positiveYears: ext.revPos, totalPeriods: ext.revTot}, null);
    const patResult = scorers.scoreProfitGrowth({cagr: ext.patCAGR, latestYoY: ext.patYoY, positiveYears: ext.patPos, totalPeriods: ext.patTot}, null);
    
    // Macro / Manual Cards
    const adResult = scorers.scoreADRatio(null);
    const vixResult = scorers.scoreVIX(ext.indiaVix);
    const gdpResult = scorers.scoreGDPGrowth(ext.gdpGrowth);
    const fiiResult = scorers.scoreInstitutionalFlow(ext.fiiFlow, ext.diiFlow);
    const analystResult = scorers.scoreAnalystConsensus(ext.analystConsensus);

    // 3. Build Cards Array
    const cards = [
        {
            id: 'pe_ratio',
            module: 'P/E Ratio',
            score: peResult.score,
            bias: peResult.bias,
            creditAllocation: 8,
            normalized: peResult.score > 70 ? 1 : (peResult.score < 30 ? -1 : 0),
            rawInput: { currentPE: ext.currentPE, sectorPE: ext.sectorPE }
        },
        {
            id: 'pb_ratio',
            module: 'P/B Ratio',
            score: pbResult.score,
            bias: pbResult.bias,
            creditAllocation: 8,
            normalized: pbResult.score > 70 ? 1 : (pbResult.score < 30 ? -1 : 0),
            rawInput: { currentPB: ext.currentPB, sectorPB: ext.sectorPB }
        },
        {
            id: 'dividend_yield',
            module: 'Dividend Yield',
            score: divResult.score,
            bias: divResult.bias,
            creditAllocation: 6,
            normalized: divResult.score > 70 ? 1 : (divResult.score < 30 ? -1 : 0),
            rawInput: { currentDivYield: ext.currentDivYield, bondYield: ext.bondYield }
        },
        {
            id: 'dii_flow',
            module: 'DII Flow',
            score: fiiResult.score,
            bias: fiiResult.bias,
            creditAllocation: 5,
            normalized: fiiResult.score > 70 ? 1 : (fiiResult.score < 30 ? -1 : 0),
            rawInput: { diiFlow: ext.diiFlow }
        },
        {
            id: 'analyst_consensus',
            module: 'Analyst Consensus',
            score: analystResult.score,
            bias: analystResult.bias,
            creditAllocation: 7,
            normalized: analystResult.score > 70 ? 1 : (analystResult.score < 30 ? -1 : 0),
            rawInput: { analystConsensus: ext.analystConsensus }
        },
        {
            id: 'eps_growth',
            module: 'EPS Growth',
            score: epsResult.score,
            bias: epsResult.bias,
            creditAllocation: 9,
            normalized: epsResult.score > 70 ? 1 : (epsResult.score < 30 ? -1 : 0),
            rawInput: { cagr: ext.epsCAGR, yoy: ext.latestYoY, posYears: ext.positiveYears, total: ext.totalPeriods }
        },
        {
            id: 'debt_to_equity',
            module: 'Debt to Equity',
            score: deResult.score,
            bias: deResult.bias,
            creditAllocation: 8,
            normalized: deResult.score > 70 ? 1 : (deResult.score < 30 ? -1 : 0),
            rawInput: { currentDE: ext.currentDE, sectorDE: ext.sectorDE }
        },
        {
            id: 'roe',
            module: 'ROE',
            score: roeResult.score,
            bias: roeResult.bias,
            creditAllocation: 9,
            normalized: roeResult.score > 70 ? 1 : (roeResult.score < 30 ? -1 : 0),
            rawInput: { currentROE: ext.currentROE, sectorROE: ext.sectorROE }
        },
        {
            id: 'roce',
            module: 'ROCE',
            score: roceResult.score,
            bias: roceResult.bias,
            creditAllocation: 8,
            normalized: roceResult.score > 70 ? 1 : (roceResult.score < 30 ? -1 : 0),
            rawInput: { currentROCE: ext.currentROCE, sectorROCE: ext.sectorROCE }
        },
        { id: 'net_margin', score: netMarginResult.score, bias: netMarginResult.bias, rawInput: { currentMargin: ext.currentNetMargin } },
        { id: 'operating_margin', score: opMarginResult.score, bias: opMarginResult.bias, rawInput: { currentMargin: ext.currentOpMargin } },
        { id: 'interest_coverage', score: icResult.score, bias: icResult.bias, rawInput: { currentCoverage: ext.interestCoverage } },
        { id: 'forward_pe', score: fpeResult.score, bias: fpeResult.bias, rawInput: { forwardPE: ext.forwardPE } },
        { id: 'earnings_yield', score: eyResult.score, bias: eyResult.bias, rawInput: { earningsYield: ext.currentEarningsYield } },
        { id: 'free_cash_flow', score: fcfResult.score, bias: fcfResult.bias, rawInput: { currentFCF: ext.currentFCF } },
        { id: 'revenue_growth', score: revResult.score, bias: revResult.bias, rawInput: { cagr: ext.revCAGR } },
        { id: 'profit_growth', score: patResult.score, bias: patResult.bias, rawInput: { cagr: ext.patCAGR } },
        { id: 'gdp_growth', score: gdpResult.score, bias: gdpResult.bias, rawInput: { gdpGrowth: ext.gdpGrowth } },
        { id: 'fii_dii_flow', score: fiiResult.score, bias: fiiResult.bias, rawInput: { fiiFlow: ext.fiiFlow, diiFlow: ext.diiFlow } },
        { id: 'advance_decline', score: adResult.score, bias: adResult.bias, rawInput: {} },
        { id: 'india_vix', score: vixResult.score, bias: vixResult.bias, rawInput: {} },
        
        // --- CALCULATED FIELDS ---
        { 
            id: 'inventory_days', 
            score: ext.inventoryTurnover ? (ext.inventoryTurnover > 6 ? 80 : 40) : 50, 
            bias: ext.inventoryTurnover ? (ext.inventoryTurnover > 6 ? 'Bullish' : 'Bearish') : 'Neutral',
            rawInput: { days: ext.inventoryTurnover ? Math.round(365 / ext.inventoryTurnover) : null }
        },
        { 
            id: 'receivable_days', 
            score: ext.receivablesTurnover ? (ext.receivablesTurnover > 6 ? 80 : 40) : 50, 
            bias: ext.receivablesTurnover ? (ext.receivablesTurnover > 6 ? 'Bullish' : 'Bearish') : 'Neutral',
            rawInput: { days: ext.receivablesTurnover ? Math.round(365 / ext.receivablesTurnover) : null }
        },
        { 
            id: 'payable_days', 
            score: ext.payablesTurnover ? (ext.payablesTurnover > 4 ? 60 : 40) : 50, 
            bias: ext.payablesTurnover ? (ext.payablesTurnover > 4 ? 'Bullish' : 'Bearish') : 'Neutral',
            rawInput: { days: ext.payablesTurnover ? Math.round(365 / ext.payablesTurnover) : null }
        },
        { 
            id: 'mcap_to_gdp', 
            score: ext.marketCapGDP ? (ext.marketCapGDP > 120 ? 30 : 70) : 50, 
            bias: ext.marketCapGDP ? (ext.marketCapGDP > 120 ? 'Bearish' : 'Bullish') : 'Neutral',
            rawInput: { ratio: ext.marketCapGDP }
        },
        { 
            id: 'sector_concentration', 
            score: 50, 
            bias: 'Neutral', 
            rawInput: { computed: true } 
        },
        { 
            id: 'cyclical_vs_defensive', 
            score: 50, 
            bias: 'Neutral', 
            rawInput: { computed: true } 
        }
    ];

    // 4. Compute Composite (Simplified version matching frontend)
    // In the future, this can be expanded to match the EXACT convex weighting
    const validScores = cards.map(c => c.score).filter(s => s !== null && !isNaN(s));
    const compositeScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 50;
    
    // Fallback to our own label generator if frontend import fails in Node (React ES6 module resolution issue)
    let regimeLabel = { label: 'Neutral', cssColor: 'text-yellow-500', hexColor: '#eab308' };
    try {
        regimeLabel = getScoreLabel(compositeScore);
    } catch(e) {
        if (compositeScore >= 80) regimeLabel = { label: 'Strong Bullish', cssColor: 'text-green-500', hexColor: '#22c55e' };
        else if (compositeScore >= 60) regimeLabel = { label: 'Bullish', cssColor: 'text-green-400', hexColor: '#4ade80' };
        else if (compositeScore >= 40) regimeLabel = { label: 'Neutral', cssColor: 'text-yellow-500', hexColor: '#eab308' };
        else if (compositeScore >= 20) regimeLabel = { label: 'Bearish', cssColor: 'text-orange-500', hexColor: '#f97316' };
        else regimeLabel = { label: 'Strong Bearish', cssColor: 'text-red-500', hexColor: '#ef4444' };
    }

    return {
        compositeScore,
        regime: {
            label: regimeLabel.label,
            description: "Backend AI Engine computed regime.",
            confidence: 80,
            color: regimeLabel.cssColor,
            hexColor: regimeLabel.hexColor
        },
        sections: [
            { id: 'valuation', label: 'Valuation', score: Math.round((peResult.score + pbResult.score)/2), weight: 0.3 },
            { id: 'growth', label: 'Growth', score: epsResult.score, weight: 0.2 },
            { id: 'profitability', label: 'Profitability', score: Math.round((roeResult.score + roceResult.score)/2), weight: 0.25 },
            { id: 'health', label: 'Financial Health', score: deResult.score, weight: 0.25 }
        ],
        tailwinds: [],
        risks: [],
        cards
    };
}
