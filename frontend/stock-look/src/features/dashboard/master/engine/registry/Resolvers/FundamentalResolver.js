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
    scoreFreeCashFlow,
    calculateRobustCAGR,
    scoreNiftyPE,
    scoreNiftyPB,
    scoreMarketCapGDP,
    scoreVIX,
    scoreADRatio,
    scoreNiftyEPSGrowth,
    scoreNiftyForwardEPS,
    scoreAggregateProfitMargin,
    scoreBankCreditGrowth,
    scoreAggregateCorporateDebt,
    scoreCPIInflation,
    scoreRepoRate,
    scoreFiscalDeficit,
    scoreFiiFlowTrend,
    scoreMFFlows,
    scorePolicyTailwinds,
    scoreGlobalLiquidity
} from '../../../../fundamentals/engine/scoringEngine.js';

export function resolveFundamental(cardDef, rawFundamentals) {
    if (!rawFundamentals) return { hasLiveData: false, status: 'missing', reason: 'No upstream data' };

    const ratios = Array.isArray(rawFundamentals.ratios) ? rawFundamentals.ratios : [];
    
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

    let result = { hasLiveData: false, reason: 'Algorithm unavailable' };

    switch (cardDef.id) {
        // --- Valuation & Multiples ---
        case 'pe_ratio': {
            const r = getRatio('p/e', 'price to earnings');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scorePERatio(r.value, null, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'forward_pe': {
            const fpe = rawFundamentals?.externalData?.forwardPE ?? rawFundamentals?.forward_pe ?? getRatio('forward p/e', 'forward pe').value;
            if (fpe != null && !isNaN(parseFloat(fpe))) {
                const peVal = getRatio('p/e', 'price to earnings').value;
                result = { hasLiveData: true, value: parseFloat(fpe), score: scoreForwardPE(parseFloat(fpe), peVal).score };
            } else {
                result = { hasLiveData: false, reason: 'Forward P/E unavailable' };
            }
            break;
        }
        case 'pb_ratio': {
            const r = getRatio('p/b', 'price to book');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scorePBRatio(r.value, null, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'ev_ebitda': {
            const r = getRatio('ev/ebitda', 'enterprise value to ebitda');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreEVEbitda(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'earnings_yield': {
            const r = getRatio('earnings yield');
            if (r.value !== null) {
                result = { hasLiveData: true, value: r.value, score: scoreEarningsYield(r.value, null, 7.1).score };
            } else {
                const peVal = getRatio('p/e', 'price to earnings').value;
                if (peVal && peVal > 0) {
                    const ey = parseFloat(((1 / peVal) * 100).toFixed(2));
                    result = { hasLiveData: true, value: ey, score: scoreEarningsYield(ey, null, 7.1).score };
                } else {
                    result = { hasLiveData: false, reason: 'Earnings Yield unavailable' };
                }
            }
            break;
        }
        case 'relative_valuation': {
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
                blended = parseFloat((blended / w).toFixed(2));
                result = { hasLiveData: true, value: blended, score: scoreRelativeValuation(blended).score };
            } else {
                result = { hasLiveData: false, reason: 'Sector comparison data unavailable' };
            }
            break;
        }
        case 'dividend_yield': {
            const r = getRatio('dividend yield');
            if (r.value !== null) {
                result = { hasLiveData: true, value: r.value, score: scoreDividendYield(r.value, r.sector).score };
            } else if (rawFundamentals?.dividendYield != null) {
                result = { hasLiveData: true, value: rawFundamentals.dividendYield, score: scoreDividendYield(rawFundamentals.dividendYield, null).score };
            } else {
                result = { hasLiveData: false, reason: 'Missing from upstream API' };
            }
            break;
        }

        // --- Growth Metrics ---
        case 'eps_growth': {
            const r = getRatio('eps growth');
            if (r.value !== null) {
                result = { hasLiveData: true, value: r.value, score: scoreEPSGrowth(r.value, null, null, null).score };
            } else {
                const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
                const epsObj = incomeArray.find(m => m.particular?.toLowerCase().includes('eps - basic') || m.particular?.toLowerCase().includes('eps'));
                if (epsObj?.history?.length >= 2) {
                    const chronological = [...epsObj.history].reverse();
                    const totalPeriods = chronological.length - 1;
                    const cagr = calculateRobustCAGR(chronological[0].value, chronological[chronological.length - 1].value, totalPeriods);
                    if (cagr !== null) {
                        result = { hasLiveData: true, value: parseFloat(cagr.toFixed(2)), score: scoreEPSGrowth(cagr, null, null, totalPeriods).score };
                    }
                }
            }
            if (!result.hasLiveData) result = { hasLiveData: false, reason: 'EPS Growth history unavailable' };
            break;
        }
        case 'revenue_growth': {
            const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
            const revObj = incomeArray.find(m => m.particular?.toLowerCase().includes('total revenue') || m.particular?.toLowerCase().includes('revenue from operations') || m.particular?.toLowerCase() === 'revenue');
            if (revObj?.history?.length >= 2) {
                const chronological = [...revObj.history].reverse();
                const totalPeriods = chronological.length - 1;
                const cagr = calculateRobustCAGR(chronological[0].value, chronological[chronological.length - 1].value, totalPeriods);
                if (cagr !== null) {
                    result = { hasLiveData: true, value: parseFloat(cagr.toFixed(2)), score: scoreRevenueGrowth({ cagr, totalPeriods }, null).score };
                }
            }
            if (!result.hasLiveData) result = { hasLiveData: false, reason: 'Revenue Growth history unavailable' };
            break;
        }
        case 'profit_growth': {
            const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
            const patObj = incomeArray.find(m => m.particular?.toLowerCase().includes('profit for the period') || m.particular?.toLowerCase().includes('net income') || m.particular === 'Profit After Tax');
            if (patObj?.history?.length >= 2) {
                const chronological = [...patObj.history].reverse();
                const totalPeriods = chronological.length - 1;
                const cagr = calculateRobustCAGR(chronological[0].value, chronological[chronological.length - 1].value, totalPeriods);
                if (cagr !== null) {
                    result = { hasLiveData: true, value: parseFloat(cagr.toFixed(2)), score: scoreProfitGrowth({ cagr, totalPeriods }, null).score };
                }
            }
            if (!result.hasLiveData) result = { hasLiveData: false, reason: 'Profit Growth history unavailable' };
            break;
        }
        case 'earnings_trend': {
            const incomeArray = Array.isArray(rawFundamentals?.income) ? rawFundamentals.income : (Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : []);
            const epsObj = incomeArray.find(m => m.particular?.toLowerCase().includes('eps - basic') || m.particular?.toLowerCase().includes('eps'));
            if (epsObj?.history?.length > 0) {
                const res = scoreEarningsTrend(epsObj.history, null);
                if (res.score != null) result = { hasLiveData: true, value: res.trendLabel, score: res.score };
            }
            if (!result.hasLiveData) result = { hasLiveData: false, reason: 'Earnings trend history unavailable' };
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
                const ratio = parseFloat((opCf / netProf).toFixed(2));
                result = { hasLiveData: true, value: ratio, score: scoreEarningsQuality(ratio).score };
            } else {
                result = { hasLiveData: false, reason: 'Operating cash flow or net profit unavailable' };
            }
            break;
        }

        // --- Profitability & Return Ratios ---
        case 'roe': {
            const r = getRatio('return on equity', 'roe');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreROE(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'roce': {
            const r = getRatio('return on capital employed', 'roce');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreROCE(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'roa': {
            const r = getRatio('return on assets', 'roa');
            const companySector = rawFundamentals?.company_profile?.sector ?? rawFundamentals?.sector ?? '';
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreROA(r.value, r.sector, companySector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'operating_margin': {
            const r = getRatio('operating margin');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreOperatingMargin(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'net_margin': {
            const r = getRatio('net margin', 'net profit margin');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreNetMargin(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'free_cash_flow': {
            let fcf = rawFundamentals?.free_cash_flow != null ? parseFloat(rawFundamentals.free_cash_flow) : null;
            if (fcf === null) {
                const cashFlowArr = Array.isArray(rawFundamentals?.cashFlow?.cash_flow) ? rawFundamentals.cashFlow.cash_flow : [];
                const opCash = cashFlowArr.find(m => m.category === 'operating')?.history?.[0]?.value ?? null;
                const invCash = cashFlowArr.find(m => m.category === 'investing')?.history?.[0]?.value ?? null;
                if (opCash !== null && invCash !== null) fcf = opCash + invCash;
            }
            if (fcf !== null) {
                const fullInc = Array.isArray(rawFundamentals?.income?.full_statement) ? rawFundamentals.income.full_statement : [];
                const rev = fullInc.find(m => m.particular === 'Total Revenue' || m.particular === 'Revenue')?.history?.[0]?.value ?? null;
                result = { hasLiveData: true, value: fcf, score: scoreFreeCashFlow(fcf, rev).score };
            } else {
                result = { hasLiveData: false, reason: 'Free Cash Flow data unavailable' };
            }
            break;
        }

        // --- Balance Sheet & Solvency ---
        case 'debt_to_equity': {
            const r = getRatio('debt to equity', 'debt/equity', 'debt equity');
            const companySector = rawFundamentals?.company_profile?.sector ?? rawFundamentals?.sector ?? '';
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreDebtToEquity(r.value, r.sector, companySector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'interest_coverage': {
            const r = getRatio('interest coverage', 'interest coverage ratio');
            if (r.value !== null) {
                result = { hasLiveData: true, value: r.value, score: scoreInterestCoverage(r.value, r.sector).score };
            } else if (rawFundamentals?.interestCoverage != null) {
                result = { hasLiveData: true, value: rawFundamentals.interestCoverage, score: scoreInterestCoverage(rawFundamentals.interestCoverage, null).score };
            } else {
                result = { hasLiveData: false, reason: 'Missing from upstream API' };
            }
            break;
        }
        case 'current_ratio': {
            const r = getRatio('current ratio');
            const companySector = rawFundamentals?.company_profile?.sector ?? rawFundamentals?.sector ?? '';
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreCurrentRatio(r.value, companySector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
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
                result = { hasLiveData: true, value: cccDays, score: cccScore };
            } else {
                result = { hasLiveData: false, reason: 'Cash conversion cycle days unavailable' };
            }
            break;
        }

        // --- Institutional & Ownership Flow ---
        case 'promoter_holding': {
            const holdings = Array.isArray(rawFundamentals?.holdings) ? rawFundamentals.holdings : [];
            const prom = holdings.find(h => h.category === 'promoters');
            if (prom?.history?.length > 0) {
                const cur = prom.history[0].value;
                const prev = prom.history.length > 1 ? prom.history[1].value : null;
                result = { hasLiveData: true, value: cur, score: scorePromoterHolding(cur, prev).score };
            } else if (rawFundamentals?.promoter_holding != null) {
                const val = parseFloat(rawFundamentals.promoter_holding);
                result = { hasLiveData: true, value: val, score: scorePromoterHolding(val, null).score };
            } else {
                result = { hasLiveData: false, reason: 'Promoter holding data missing' };
            }
            break;
        }
        case 'smart_money_flow': {
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
                result = { hasLiveData: true, value: cur, score: scoreSmartMoneyFlow(cur, prev).score };
            } else {
                result = { hasLiveData: false, reason: 'Smart money institutional holdings missing' };
            }
            break;
        }
        case 'fii_dii_flow':
        case 'fii_dii_flow_master': {
            if (rawFundamentals.fiiDiiFlow) {
                result = { hasLiveData: true, value: JSON.stringify(rawFundamentals.fiiDiiFlow), score: 50 };
            } else {
                const fiiDii = rawFundamentals?.fii_dii_flow;
                if (fiiDii && Array.isArray(fiiDii) && fiiDii.length > 0) {
                    const latest = fiiDii[0];
                    result = { hasLiveData: true, value: JSON.stringify(latest), score: scoreInstitutionalFlow(parseFloat(latest.fii_net) || 0, parseFloat(latest.dii_net) || 0).score };
                } else {
                    result = { hasLiveData: false, reason: 'FII/DII flow data missing' };
                }
            }
            break;
        }
        case 'fii': {
            const val = rawFundamentals?.fiiFlow ?? (Array.isArray(rawFundamentals?.fii_dii_flow) ? rawFundamentals.fii_dii_flow[0]?.fii_net : null);
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreInstitutionalFlow(parseFloat(val), 0).score };
            else result = { hasLiveData: false, reason: 'FII flow data missing' };
            break;
        }
        case 'dii': {
            const val = rawFundamentals?.diiFlow ?? (Array.isArray(rawFundamentals?.fii_dii_flow) ? rawFundamentals.fii_dii_flow[0]?.dii_net : null);
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreInstitutionalFlow(0, parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'DII flow data missing' };
            break;
        }
        case 'fii_trend': {
            const val = rawFundamentals?.fiiTrend ?? rawFundamentals?.externalData?.fiiTrend;
            if (val != null) result = { hasLiveData: true, value: val, score: scoreFiiFlowTrend(val).score };
            else result = { hasLiveData: false, reason: 'FII flow trend data missing' };
            break;
        }
        case 'mf_flows': {
            const val = rawFundamentals?.mfFlows ?? rawFundamentals?.externalData?.mfFlows;
            if (val != null) result = { hasLiveData: true, value: val, score: scoreMFFlows(val).score };
            else result = { hasLiveData: false, reason: 'Mutual fund flows data missing' };
            break;
        }

        // --- Macro & Index Fundamentals ---
        case 'nifty_pe': {
            const r = getRatio('p/e', 'pe ratio');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreNiftyPE(r.value).score };
            else result = { hasLiveData: false, reason: 'Index P/E unavailable' };
            break;
        }
        case 'nifty_pb': {
            const r = getRatio('p/b', 'pb ratio');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreNiftyPB(r.value).score };
            else result = { hasLiveData: false, reason: 'Index P/B unavailable' };
            break;
        }
        case 'mcap_gdp': {
            const val = rawFundamentals?.mcapGdp ?? rawFundamentals?.externalData?.mcapGdp;
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreMarketCapGDP(parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'Market Cap to GDP ratio unavailable' };
            break;
        }
        case 'gdp_growth':
        case 'gdp': {
            const gdp = rawFundamentals?.externalData?.gdpGrowth ?? rawFundamentals?.gdpGrowth ?? rawFundamentals?.gdp_growth ?? rawFundamentals?.gdp;
            if (gdp != null) result = { hasLiveData: true, value: parseFloat(gdp), score: scoreGDPGrowth(parseFloat(gdp)).score };
            else result = { hasLiveData: false, reason: 'GDP growth data unavailable' };
            break;
        }
        case 'cpi': {
            const val = rawFundamentals?.cpiInflation ?? rawFundamentals?.cpi ?? rawFundamentals?.externalData?.cpiInflation;
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreCPIInflation(parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'CPI inflation data unavailable' };
            break;
        }
        case 'repo': {
            const val = rawFundamentals?.repoRate ?? rawFundamentals?.repo ?? rawFundamentals?.externalData?.repoRate;
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreRepoRate(parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'Repo rate data unavailable' };
            break;
        }
        case 'fiscal_deficit': {
            const val = rawFundamentals?.fiscalDeficit ?? rawFundamentals?.externalData?.fiscalDeficit;
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreFiscalDeficit(parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'Fiscal deficit data unavailable' };
            break;
        }
        case 'system_liquidity': {
            const sysLiq = rawFundamentals?.systemLiquidity ?? rawFundamentals?.global_liq ?? rawFundamentals?.externalData?.global_liq;
            if (sysLiq != null) result = { hasLiveData: true, value: sysLiq, score: scoreSystemLiquidity(sysLiq).score };
            else result = { hasLiveData: false, reason: 'System liquidity data unavailable' };
            break;
        }
        case 'advance_decline': {
            if (rawFundamentals?.advance_decline?.advances != null && rawFundamentals?.advance_decline?.declines != null) {
                const ratio = rawFundamentals.advance_decline.declines > 0 
                    ? rawFundamentals.advance_decline.advances / rawFundamentals.advance_decline.declines 
                    : 1;
                result = { hasLiveData: true, value: parseFloat(ratio.toFixed(2)), score: scoreADRatio(ratio).score };
            } else {
                result = { hasLiveData: false, reason: 'Advance/Decline data unavailable' };
            }
            break;
        }
        case 'policy_tailwinds': {
            const val = rawFundamentals?.policyTailwinds ?? rawFundamentals?.externalData?.policyTailwinds;
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scorePolicyTailwinds(parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'Policy tailwinds data unavailable' };
            break;
        }
        case 'india_vix': {
            const vix = rawFundamentals?.india_vix ?? rawFundamentals?.externalData?.india_vix;
            if (vix != null) result = { hasLiveData: true, value: parseFloat(vix), score: scoreVIX(parseFloat(vix)).score };
            else result = { hasLiveData: false, reason: 'India VIX unavailable' };
            break;
        }
        case 'global_liq': {
            const val = rawFundamentals?.global_liq ?? rawFundamentals?.externalData?.global_liq;
            if (val != null) result = { hasLiveData: true, value: val, score: scoreGlobalLiquidity(val).score };
            else result = { hasLiveData: false, reason: 'Global liquidity data unavailable' };
            break;
        }
        case 'eps_yoy': {
            const epsGrowthVal = rawFundamentals?.externalData?.epsGrowth ?? rawFundamentals?.epsGrowth;
            if (epsGrowthVal != null) result = { hasLiveData: true, value: parseFloat(epsGrowthVal), score: scoreNiftyEPSGrowth(parseFloat(epsGrowthVal)).score };
            else result = { hasLiveData: false, reason: 'EPS YoY growth data unavailable' };
            break;
        }
        case 'forward_eps': {
            const fwdEpsVal = rawFundamentals?.analystConsensus?.forwardEps ?? rawFundamentals?.externalData?.forwardEps ?? rawFundamentals?.forwardEps;
            if (fwdEpsVal != null && !isNaN(parseFloat(fwdEpsVal))) {
                result = { hasLiveData: true, value: parseFloat(fwdEpsVal), score: scoreNiftyForwardEPS(parseFloat(fwdEpsVal)).score };
            } else {
                result = { hasLiveData: false, reason: 'Forward EPS projection unavailable' };
            }
            break;
        }
        case 'profit_margin': {
            const r = getRatio('net margin', 'net profit margin', 'profit margin');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreAggregateProfitMargin(r.value).score };
            else {
                const marginVal = rawFundamentals?.externalData?.profitMargin ?? rawFundamentals?.profitMargin;
                if (marginVal != null) result = { hasLiveData: true, value: parseFloat(marginVal), score: scoreAggregateProfitMargin(parseFloat(marginVal)).score };
                else result = { hasLiveData: false, reason: 'Aggregate profit margin unavailable' };
            }
            break;
        }
        case 'credit_growth': {
            const val = rawFundamentals?.creditGrowth ?? rawFundamentals?.externalData?.creditGrowth;
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreBankCreditGrowth(parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'Bank credit growth unavailable' };
            break;
        }
        case 'corp_debt': {
            const val = rawFundamentals?.corpDebt ?? rawFundamentals?.externalData?.corpDebt;
            if (val != null) result = { hasLiveData: true, value: parseFloat(val), score: scoreAggregateCorporateDebt(parseFloat(val)).score };
            else result = { hasLiveData: false, reason: 'Corporate debt data unavailable' };
            break;
        }

        // --- Contextual / Research Cards ---
        case 'analyst_consensus': {
            const ac = rawFundamentals?.externalData?.analystConsensus ?? rawFundamentals?.analystConsensus ?? rawFundamentals?.analyst_consensus;
            if (ac) result = { hasLiveData: true, value: ac, score: scoreAnalystConsensus(ac).score };
            else result = { hasLiveData: false, reason: 'Analyst consensus data missing' };
            break;
        }
        case 'corporate_actions': {
            const actions = Array.isArray(rawFundamentals?.corporate_actions) ? rawFundamentals.corporate_actions : [];
            if (actions.length > 0) result = { hasLiveData: true, value: actions.length, score: scoreCorporateActions(actions).score };
            else result = { hasLiveData: true, value: 0, score: 50 };
            break;
        }
        case 'peer_comparison': {
            result = { hasLiveData: true, value: 'Neutral', score: 50 };
            break;
        }
        case 'sector_dashboard': {
            result = { hasLiveData: true, value: 'Sector Parity', score: 65 };
            break;
        }
        case 'shareholding_trend': {
            const holdings = Array.isArray(rawFundamentals?.holdings) ? rawFundamentals.holdings : [];
            if (holdings.length > 0) result = { hasLiveData: true, value: `${holdings.length} Quarters`, score: 65 };
            else result = { hasLiveData: false, reason: 'Shareholding trend data missing' };
            break;
        }
        case 'peer_multiples': {
            const peers = rawFundamentals?.peers || rawFundamentals?.peerComparison;
            if (peers) result = { hasLiveData: true, value: 'Peer Comparison', score: 60 };
            else result = { hasLiveData: false, reason: 'Peer valuation multiples missing' };
            break;
        }

        default:
            result = { hasLiveData: false, reason: 'Algorithm unavailable for ' + cardDef.id };
            break;
    }

    return result;
}
