import axiosInstance from '../../../../shared/utils/axiosInstance';
import { API_PATHS } from '../../../../shared/utils/apiPaths';

import { 
    scorePERatio, 
    scorePBRatio,
    scoreEVEbitda,
    scoreROE,
    scoreROA,
    scoreROCE,
    scoreOperatingMargin,
    scoreInstitutionalFlow,
    scoreNetMargin,
    scoreDebtToEquity,
    scoreCurrentRatio,
    scoreInterestCoverage,
    scoreDividendYield,
    scoreSystemLiquidity,
    scoreForwardPE,
    scoreEarningsYield,
    scoreRelativeValuation,
    scoreAnalystConsensus,
    scoreEPSGrowth,
    scoreRevenueGrowth,
    scoreProfitGrowth,
    scoreEarningsTrend,
    scoreGDPGrowth,
    scorePromoterHolding,
    scoreSmartMoneyFlow,
    scoreEarningsQuality,
    scoreCorporateActions,
    scoreFreeCashFlow
} from './scoringEngine';

import {
    scoreNiftyPE,
    scoreNiftyPB,
    scoreMarketCapGDP,
    scoreVIX,
    scoreADRatio
} from './scoringEngine';
import { CARD_REGISTRY } from '../../../../shared/config/cardRegistry';

function parseHeadlessFundamentals(rawFundamentals, manualOverrides = {}) {
    const scores = {};
    const cards = [];
    
    const ratios = rawFundamentals && Array.isArray(rawFundamentals.ratios) ? rawFundamentals.ratios : [];
    
    // Helper to find ratio by name
    const getRatio = (...names) => {
        const item = ratios.find(r => names.some(n => r.name?.toLowerCase().includes(n) || r.name?.toLowerCase() === n));
        if (!item) return { value: null, sector: null };
        const cv = parseFloat(item.company_value);
        const sv = parseFloat(item.sector_value);
        return {
            value: isNaN(cv) ? null : cv,
            sector: isNaN(sv) ? null : sv
        };
    };

    const attemptComputation = (id) => {
        let overrideVal = manualOverrides[id];
        let useOverride = overrideVal !== undefined && overrideVal !== null && overrideVal !== '';

        if (!rawFundamentals && !useOverride) return { success: false, reason: "No upstream data" };
        
        switch (id) {
            case 'pe_ratio': {
                if (useOverride) return { success: true, value: overrideVal, score: scorePERatio(overrideVal, null, null).score };
                const r = getRatio('p/e', 'price to earnings');
                if (r.value !== null) return { success: true, value: r.value, score: scorePERatio(r.value, null, r.sector).score };
                break;
            }
            case 'pb_ratio': {
                if (useOverride) return { success: true, value: overrideVal, score: scorePBRatio(overrideVal, null, null).score };
                const r = getRatio('p/b', 'price to book');
                if (r.value !== null) return { success: true, value: r.value, score: scorePBRatio(r.value, null, r.sector).score };
                break;
            }
            case 'ev_ebitda': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreEVEbitda(overrideVal, null).score };
                const r = getRatio('ev/ebitda', 'enterprise value to ebitda');
                if (r.value !== null) return { success: true, value: r.value, score: scoreEVEbitda(r.value, r.sector).score };
                break;
            }
            case 'forward_pe': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreForwardPE(parseFloat(overrideVal), null).score };
                const fpe = rawFundamentals?.externalData?.forwardPE ?? rawFundamentals?.forward_pe ?? getRatio('forward p/e', 'forward pe').value;
                if (fpe != null && !isNaN(parseFloat(fpe))) {
                    const peVal = getRatio('p/e', 'price to earnings').value;
                    return { success: true, value: parseFloat(fpe), score: scoreForwardPE(parseFloat(fpe), peVal).score };
                }
                break;
            }
            case 'earnings_yield': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreEarningsYield(parseFloat(overrideVal), null, 7.1).score };
                const r = getRatio('earnings yield');
                if (r.value !== null) return { success: true, value: r.value, score: scoreEarningsYield(r.value, null, 7.1).score };
                const peVal = getRatio('p/e', 'price to earnings').value;
                if (peVal && peVal > 0) {
                    const ey = (1 / peVal) * 100;
                    return { success: true, value: parseFloat(ey.toFixed(2)), score: scoreEarningsYield(ey, null, 7.1).score };
                }
                break;
            }
            case 'relative_valuation': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreRelativeValuation(parseFloat(overrideVal)).score };
                const pe = getRatio('p/e', 'price to earnings');
                const pb = getRatio('p/b', 'price to book');
                const eveb = getRatio('ev/ebitda', 'enterprise value to ebitda');
                let pePrem = (pe.value !== null && pe.sector) ? ((pe.value - pe.sector) / pe.sector) * 100 : null;
                let pbPrem = (pb.value !== null && pb.sector) ? ((pb.value - pb.sector) / pb.sector) * 100 : null;
                let evebPrem = (eveb.value !== null && eveb.sector) ? ((eveb.value - eveb.sector) / eveb.sector) * 100 : null;
                let blended = null, w = 0;
                if (pePrem !== null) { blended = (blended || 0) + pePrem * 0.40; w += 0.40; }
                if (pbPrem !== null) { blended = (blended || 0) + pbPrem * 0.35; w += 0.35; }
                if (evebPrem !== null) { blended = (blended || 0) + evebPrem * 0.25; w += 0.25; }
                if (w > 0 && blended !== null) {
                    blended /= w;
                    return { success: true, value: parseFloat(blended.toFixed(2)), score: scoreRelativeValuation(blended).score };
                }
                break;
            }
            case 'analyst_consensus': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreAnalystConsensus(overrideVal).score };
                const ac = rawFundamentals?.externalData?.analystConsensus ?? rawFundamentals?.analystConsensus ?? rawFundamentals?.analyst_consensus;
                if (ac) return { success: true, value: ac, score: scoreAnalystConsensus(ac).score };
                break;
            }
            case 'eps_growth': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreEPSGrowth(parseFloat(overrideVal), null, null, null).score };
                const r = getRatio('eps growth');
                if (r.value !== null) return { success: true, value: r.value, score: scoreEPSGrowth(r.value, null, null, null).score };
                const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
                const epsObj = incomeArray.find(m => m.particular?.toLowerCase().includes('eps - basic') || m.particular?.toLowerCase().includes('eps'));
                if (epsObj?.history?.length >= 2) {
                    const chronological = [...epsObj.history].reverse();
                    const totalPeriods = chronological.length - 1;
                    const first = chronological[0].value;
                    const last = chronological[chronological.length - 1].value;
                    const prev = chronological[chronological.length - 2].value;
                    let cagr = null, yoy = null, posYears = 0;
                    if (first > 0 && last > 0) cagr = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
                    if (prev !== 0) yoy = ((last - prev) / Math.abs(prev)) * 100;
                    for (let i = 1; i < chronological.length; i++) {
                        if (chronological[i].value > chronological[i - 1].value) posYears++;
                    }
                    if (cagr !== null) return { success: true, value: parseFloat(cagr.toFixed(2)), score: scoreEPSGrowth(cagr, yoy, posYears, totalPeriods).score };
                }
                break;
            }
            case 'revenue_growth': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreRevenueGrowth({ cagr: parseFloat(overrideVal) }, null).score };
                const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
                const revObj = incomeArray.find(m => m.particular?.toLowerCase().includes('total revenue') || m.particular?.toLowerCase().includes('revenue from operations') || m.particular?.toLowerCase() === 'revenue');
                if (revObj?.history?.length >= 2) {
                    const chronological = [...revObj.history].reverse();
                    const totalPeriods = chronological.length - 1;
                    const first = chronological[0].value;
                    const last = chronological[chronological.length - 1].value;
                    const prev = chronological[chronological.length - 2].value;
                    let cagr = null, yoy = null, posYears = 0;
                    if (first > 0 && last > 0) cagr = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
                    if (prev !== 0) yoy = ((last - prev) / Math.abs(prev)) * 100;
                    for (let i = 1; i < chronological.length; i++) {
                        if (chronological[i].value > chronological[i - 1].value) posYears++;
                    }
                    if (cagr !== null) return { success: true, value: parseFloat(cagr.toFixed(2)), score: scoreRevenueGrowth({ cagr, latestYoY: yoy, positiveYears: posYears, totalPeriods }, null).score };
                }
                break;
            }
            case 'profit_growth': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreProfitGrowth({ cagr: parseFloat(overrideVal) }, null).score };
                const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
                const patObj = incomeArray.find(m => m.particular?.toLowerCase().includes('profit for the period') || m.particular?.toLowerCase().includes('net income') || m.particular === 'Profit After Tax');
                if (patObj?.history?.length >= 2) {
                    const chronological = [...patObj.history].reverse();
                    const totalPeriods = chronological.length - 1;
                    const first = chronological[0].value;
                    const last = chronological[chronological.length - 1].value;
                    const prev = chronological[chronological.length - 2].value;
                    let cagr = null, yoy = null, posYears = 0;
                    if (first > 0 && last > 0) cagr = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
                    if (prev !== 0) yoy = ((last - prev) / Math.abs(prev)) * 100;
                    for (let i = 1; i < chronological.length; i++) {
                        if (chronological[i].value > chronological[i - 1].value) posYears++;
                    }
                    if (cagr !== null) return { success: true, value: parseFloat(cagr.toFixed(2)), score: scoreProfitGrowth({ cagr, latestYoY: yoy, positiveYears: posYears, totalPeriods }, null).score };
                }
                break;
            }
            case 'earnings_trend': {
                const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
                const epsObj = incomeArray.find(m => m.particular?.toLowerCase().includes('eps - basic') || m.particular?.toLowerCase().includes('eps'));
                if (epsObj?.history?.length > 0) {
                    const res = scoreEarningsTrend(epsObj.history, null);
                    if (res.score != null) return { success: true, value: res.trendLabel, score: res.score };
                }
                break;
            }
            case 'gdp_growth': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreGDPGrowth(parseFloat(overrideVal)).score };
                const gdp = rawFundamentals?.externalData?.gdpGrowth ?? rawFundamentals?.gdpGrowth ?? rawFundamentals?.gdp_growth ?? 7.0;
                return { success: true, value: gdp, score: scoreGDPGrowth(gdp).score };
            }
            case 'fii_dii_flow': {
                const fiiDii = rawFundamentals?.fii_dii_flow;
                if (fiiDii && Array.isArray(fiiDii)) {
                    const sorted = [...fiiDii].sort((a, b) => new Date(b.date) - new Date(a.date));
                    if (sorted.length > 0) {
                        const latest = sorted[0];
                        return { success: true, value: null, score: scoreInstitutionalFlow(parseFloat(latest.fii_net) || 0, parseFloat(latest.dii_net) || 0).score };
                    }
                }
                break;
            }
            case 'dividend_yield': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreDividendYield(overrideVal, null).score };
                const r = getRatio('dividend yield');
                if (r.value !== null) return { success: true, value: r.value, score: scoreDividendYield(r.value, null).score };
                if (rawFundamentals?.dividendYield != null) return { success: true, value: rawFundamentals.dividendYield, score: scoreDividendYield(rawFundamentals.dividendYield, null).score };
                break;
            }
            case 'promoter_holding': {
                if (useOverride) return { success: true, value: overrideVal, score: scorePromoterHolding(parseFloat(overrideVal), null).score };
                const holdings = Array.isArray(rawFundamentals?.holdings) ? rawFundamentals.holdings : [];
                const prom = holdings.find(h => h.category === 'promoters');
                if (prom?.history?.length > 0) {
                    const cur = prom.history[0].value;
                    const prev = prom.history.length > 1 ? prom.history[1].value : null;
                    return { success: true, value: cur, score: scorePromoterHolding(cur, prev).score };
                }
                if (rawFundamentals?.promoter_holding != null) {
                    const val = parseFloat(rawFundamentals.promoter_holding);
                    return { success: true, value: val, score: scorePromoterHolding(val, null).score };
                }
                break;
            }
            case 'smart_money_flow': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreSmartMoneyFlow(parseFloat(overrideVal), null).score };
                const holdings = Array.isArray(rawFundamentals?.holdings) ? rawFundamentals.holdings : [];
                const fii = holdings.find(h => h.category === 'fii');
                const dii = holdings.find(h => h.category === 'other_dii');
                const mf = holdings.find(h => h.category === 'mutual_funds');
                const f0 = fii?.history?.[0]?.value ?? null, f1 = fii?.history?.[1]?.value ?? null;
                const d0 = dii?.history?.[0]?.value ?? null, d1 = dii?.history?.[1]?.value ?? null;
                const m0 = mf?.history?.[0]?.value ?? null,  m1 = mf?.history?.[1]?.value ?? null;
                if (f0 !== null || d0 !== null || m0 !== null) {
                    const cur = (f0 || 0) + (d0 || 0) + (m0 || 0);
                    const prev = (f1 !== null || d1 !== null || m1 !== null) ? ((f1 || 0) + (d1 || 0) + (m1 || 0)) : null;
                    return { success: true, value: cur, score: scoreSmartMoneyFlow(cur, prev).score };
                }
                break;
            }
            case 'earnings_quality': {
                const cashFlowArr = Array.isArray(rawFundamentals?.cashFlow?.cash_flow) ? rawFundamentals.cashFlow.cash_flow : [];
                const fullCash = Array.isArray(rawFundamentals?.cashFlow?.full_statement) ? rawFundamentals.cashFlow.full_statement : [];
                const opCf = cashFlowArr.find(c => c.category === 'operating')?.history?.[0]?.value ?? fullCash.find(m => m.particular?.toLowerCase().includes('operating'))?.history?.[0]?.value ?? null;
                let netProf = null;
                const incStmt = Array.isArray(rawFundamentals?.income?.income_statement) ? rawFundamentals.income.income_statement : [];
                const netProfObj = incStmt.find(i => i.category === 'net_profit');
                if (netProfObj?.history?.length > 0) {
                    netProf = netProfObj.history[0].value;
                } else {
                    const fullInc = Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : [];
                    const patObj = fullInc.find(m => m.particular === 'Profit After Tax');
                    if (patObj?.history?.length > 0) netProf = patObj.history[0].value;
                }
                if (opCf !== null && netProf !== null && netProf !== 0) {
                    const ratio = opCf / netProf;
                    return { success: true, value: parseFloat(ratio.toFixed(2)), score: scoreEarningsQuality(ratio).score };
                }
                break;
            }
            case 'corporate_actions': {
                const actions = Array.isArray(rawFundamentals?.corporate_actions) ? rawFundamentals.corporate_actions : [];
                if (actions.length > 0) {
                    return { success: true, value: actions.length, score: 50 };
                }
                break;
            }
            case 'roe': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreROE(overrideVal, null).score };
                const r = getRatio('return on equity', 'roe');
                if (r.value !== null) return { success: true, value: r.value, score: scoreROE(r.value, r.sector).score };
                break;
            }
            case 'roa': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreROA(overrideVal, null).score };
                const r = getRatio('return on assets', 'roa');
                if (r.value !== null) return { success: true, value: r.value, score: scoreROA(r.value, r.sector).score };
                break;
            }
            case 'roce': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreROCE(overrideVal, null).score };
                const r = getRatio('return on capital employed', 'roce');
                if (r.value !== null) return { success: true, value: r.value, score: scoreROCE(r.value, r.sector).score };
                break;
            }
            case 'operating_margin': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreOperatingMargin(overrideVal, null).score };
                const r = getRatio('operating margin');
                if (r.value !== null) return { success: true, value: r.value, score: scoreOperatingMargin(r.value, r.sector).score };
                const incStmt = Array.isArray(rawFundamentals?.income?.income_statement) ? rawFundamentals.income.income_statement : [];
                const opProfitObj = incStmt.find(m => m.category === 'operating_profit' && m.history?.length >= 1);
                const incomeArray = Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : [];
                const revObj = incomeArray.find(m => (m.particular === 'Total Revenue' || m.particular === 'Revenue') && m.history?.length >= 1);
                if (opProfitObj && revObj && revObj.history[0].value > 0) {
                    const om = (opProfitObj.history[0].value / revObj.history[0].value) * 100;
                    return { success: true, value: parseFloat(om.toFixed(2)), score: scoreOperatingMargin(om, null).score };
                }
                break;
            }
            case 'net_margin': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreNetMargin(overrideVal, null).score };
                const r = getRatio('net margin', 'net profit margin', 'profit margin');
                if (r.value !== null) return { success: true, value: r.value, score: scoreNetMargin(r.value, r.sector).score };
                const incomeArray = Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : [];
                const profitObj = incomeArray.find(m => (m.particular === 'Profit After Tax' || m.particular === 'Profit Before Tax') && m.history?.length >= 1);
                const revObj = incomeArray.find(m => (m.particular === 'Total Revenue' || m.particular === 'Revenue') && m.history?.length >= 1);
                if (profitObj && revObj && revObj.history[0].value > 0) {
                    const nm = (profitObj.history[0].value / revObj.history[0].value) * 100;
                    return { success: true, value: parseFloat(nm.toFixed(2)), score: scoreNetMargin(nm, null).score };
                }
                break;
            }
            case 'cash_conversion': {
                const ccc = rawFundamentals?.cashConversionCycle || {};
                const inv = getRatio('inventory turnover').value ? (365 / getRatio('inventory turnover').value) : (ccc.inventoryDays || null);
                const rec = getRatio('receivables turnover', 'debtors turnover').value ? (365 / getRatio('receivables turnover', 'debtors turnover').value) : (ccc.receivableDays || null);
                const pay = getRatio('payables turnover', 'creditors turnover').value ? (365 / getRatio('payables turnover', 'creditors turnover').value) : (ccc.payableDays || null);
                if (inv !== null && rec !== null && pay !== null) {
                    const cccDays = Math.round(inv + rec - pay);
                    let cccScore = 50;
                    if (cccDays < 0) cccScore = 90;
                    else if (cccDays < 30) cccScore = 75;
                    else if (cccDays < 90) cccScore = 50;
                    else cccScore = 20;
                    return { success: true, value: cccDays, score: cccScore };
                }
                break;
            }
            case 'debt_to_equity': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreDebtToEquity(overrideVal, null).score };
                const r = getRatio('debt to equity', 'debt/equity', 'debt equity');
                if (r.value !== null) return { success: true, value: r.value, score: scoreDebtToEquity(r.value, r.sector).score };
                const balanceArray = Array.isArray(rawFundamentals?.balanceSheet?.full_statement) ? rawFundamentals.balanceSheet.full_statement : [];
                const equityObj = balanceArray.find(m => m.particular === 'Equity Capital');
                const nonCurrLiabObj = balanceArray.find(m => m.particular === 'Non-Current Liabilities');
                const currLiabObj = balanceArray.find(m => m.particular === 'Current Liabilities');
                if (equityObj?.history?.length > 0 && (nonCurrLiabObj || currLiabObj)) {
                    const latestEquity = equityObj.history[0].value;
                    const ncl = nonCurrLiabObj?.history?.[0]?.value || 0;
                    const cl = currLiabObj?.history?.[0]?.value || 0;
                    if (latestEquity > 0) {
                        const de = (ncl + cl) / latestEquity;
                        return { success: true, value: parseFloat(de.toFixed(2)), score: scoreDebtToEquity(de, null).score };
                    }
                }
                break;
            }
            case 'interest_coverage': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreInterestCoverage(overrideVal, null).score };
                const r = getRatio('interest coverage', 'interest coverage ratio');
                if (r.value !== null) return { success: true, value: r.value, score: scoreInterestCoverage(r.value, r.sector).score };
                if (rawFundamentals?.interestCoverage != null) return { success: true, value: rawFundamentals.interestCoverage, score: scoreInterestCoverage(rawFundamentals.interestCoverage, null).score };
                break;
            }
            case 'free_cash_flow': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreFreeCashFlow(parseFloat(overrideVal), null).score };
                let fcf = rawFundamentals?.free_cash_flow != null ? parseFloat(rawFundamentals.free_cash_flow) : null;
                if (fcf === null) {
                    const cashFlowArr = Array.isArray(rawFundamentals?.cashFlow?.cash_flow) ? rawFundamentals.cashFlow.cash_flow : [];
                    const opCash = cashFlowArr.find(m => m.category === 'operating')?.history?.[0]?.value ?? null;
                    const invCash = cashFlowArr.find(m => m.category === 'investing')?.history?.[0]?.value ?? null;
                    if (opCash !== null && invCash !== null) {
                        fcf = opCash + invCash;
                    }
                }
                if (fcf !== null) {
                    const fullInc = Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : [];
                    const rev = fullInc.find(m => m.particular === 'Total Revenue' || m.particular === 'Revenue')?.history?.[0]?.value ?? null;
                    return { success: true, value: fcf, score: scoreFreeCashFlow(fcf, rev).score };
                }
                break;
            }
            case 'current_ratio': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreCurrentRatio(overrideVal).score };
                const r = getRatio('current ratio');
                if (r.value !== null) return { success: true, value: r.value, score: scoreCurrentRatio(r.value, r.sector).score };
                const balanceArray = Array.isArray(rawFundamentals?.balanceSheet?.full_statement) ? rawFundamentals.balanceSheet.full_statement : [];
                const caObj = balanceArray.find(m => m.particular?.toLowerCase() === 'current assets');
                const clObj = balanceArray.find(m => m.particular?.toLowerCase() === 'current liabilities');
                if (caObj?.history?.length > 0 && clObj?.history?.length > 0 && clObj.history[0].value > 0) {
                    const cr = caObj.history[0].value / clObj.history[0].value;
                    return { success: true, value: parseFloat(cr.toFixed(2)), score: scoreCurrentRatio(cr).score };
                }
                break;
            }
            case 'nifty_pe': {
                if (useOverride) return { success: true, score: scoreNiftyPE(parseFloat(overrideVal)).score, value: overrideVal };
                const r = getRatio('p/e', 'pe ratio');
                if (r.value !== null) return { success: true, score: scoreNiftyPE(r.value).score, value: r.value };
                break;
            }
            case 'nifty_pb': {
                if (useOverride) return { success: true, score: scoreNiftyPB(parseFloat(overrideVal)).score, value: overrideVal };
                const r = getRatio('p/b', 'pb ratio');
                if (r.value !== null) return { success: true, score: scoreNiftyPB(r.value).score, value: r.value };
                break;
            }
            case 'mcap_gdp': {
                if (useOverride) return { success: true, score: scoreMarketCapGDP(parseFloat(overrideVal)).score, value: overrideVal };
                break;
            }
            case 'india_vix': {
                if (useOverride) return { success: true, score: scoreVIX(parseFloat(overrideVal)).score, value: overrideVal };
                if (rawFundamentals?.india_vix != null) return { success: true, score: scoreVIX(rawFundamentals.india_vix).score, value: rawFundamentals.india_vix };
                break;
            }
            case 'advance_decline': {
                if (useOverride) return { success: true, score: scoreADRatio(parseFloat(overrideVal)).score, value: overrideVal };
                if (rawFundamentals?.advance_decline?.advances != null && rawFundamentals?.advance_decline?.declines != null) {
                    const ratio = rawFundamentals.advance_decline.declines > 0 
                        ? rawFundamentals.advance_decline.advances / rawFundamentals.advance_decline.declines 
                        : 1;
                    return { success: true, score: scoreADRatio(ratio).score, value: ratio };
                }
                break;
            }
            case 'system_liquidity': {
                if (useOverride) return { success: true, score: scoreSystemLiquidity(parseFloat(overrideVal)).score, value: overrideVal };
                if (rawFundamentals?.global_liq != null) return { success: true, score: scoreSystemLiquidity(rawFundamentals.global_liq).score, value: rawFundamentals.global_liq };
                break;
            }
        }
        return { success: false, reason: "Data missing in Upstox response or calculation failed" };
    };

    Object.values(CARD_REGISTRY).forEach(cardConfig => {
        if (cardConfig.page?.toLowerCase() !== 'fundamentals') return;
        if (cardConfig.type === 'widget') return;

        const result = attemptComputation(cardConfig.id);
        
        if (result.success) {
            scores[cardConfig.id] = result.score;
            cards.push({
                id: cardConfig.id,
                displayName: cardConfig.displayName,
                value: result.value,
                score: result.score,
                hasLiveData: true
            });
        } else {
            cards.push({
                id: cardConfig.id,
                displayName: cardConfig.displayName,
                value: null,
                score: null,
                hasLiveData: false,
                status: "missing",
                reason: result.reason,
                source: "Upstox API",
                lastAttempt: Date.now(),
                retryAfter: 10000,
                supportsRealtime: true,
                appliesTo: cardConfig.appliesTo || 'both',
                severity: "low"
            });
        }
    });

    return { scores, cards };
}


export class FundamentalEngine {
    constructor() {
        this.intervalId = null;
        this.instrument = null;
        this.callbacks = {};
        this.cache = { scores: {}, cards: [] };
        this.previousSnapshot = null;
    }

    start(instrument, callbacks = {}) {
        this.instrument = instrument;
        this.callbacks = callbacks;
        this.manualOverrides = callbacks.initialOverrides || {};
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.poll();
        this.intervalId = setInterval(() => this.poll(), 10000);
    }

    setOverrides(overrides) {
        this.manualOverrides = overrides || {};
        if (this.lastRawData) {
            this.parse(this.lastRawData, this.manualOverrides);
            this.register();
            this.publish();
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async poll() {
        if (!this.instrument) return;
        
        try {
            const res = await axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(this.instrument));
            if (res.data?.success && res.data?.data) {
                this.lastRawData = res.data.data;
                this.parse(this.lastRawData, this.manualOverrides);
                this.register();
                this.publish();
                // Headless parser is an in-memory evaluator for Master Dashboard;
                // it must not overwrite the authoritative header_data persisted by FundamentalPage or cron.
            }
        } catch (e) {
            console.error("FundamentalEngine poll failed", e);
        }
    }

    parse(rawData, manualOverrides = {}) {
        this.previousSnapshot = this.cache;
        this.cache = parseHeadlessFundamentals(rawData, manualOverrides);
    }

    register() {
        if (this.callbacks.registerBulk && this.cache.cards) {
            const registryPayload = this.cache.cards.map(c => {
                const payload = {
                    id: c.id,
                    value: c.value,
                    score: c.score,
                    hasLiveData: c.hasLiveData
                };
                if (!c.hasLiveData) {
                    payload.status = c.status;
                    payload.reason = c.reason;
                    payload.source = c.source;
                    payload.lastAttempt = c.lastAttempt;
                    payload.retryAfter = c.retryAfter;
                    payload.supportsRealtime = c.supportsRealtime;
                    payload.appliesTo = c.appliesTo;
                    payload.severity = c.severity;
                }
                return payload;
            });
            this.callbacks.registerBulk('fundamental', registryPayload);
        }
    }

    publish() {
        if (this.callbacks.onUpdate) {
            this.callbacks.onUpdate(this.state());
        }
    }

    dispose() {
        this.stop();
        this.cache = { scores: {}, cards: [] };
        this.previousSnapshot = null;
        this.callbacks = {};
    }

    state() {
        return this.cache;
    }
}

