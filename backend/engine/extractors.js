/**
 * @file extractors.js
 * @purpose Extracts clean numerical values from raw Upstox fundamental data for the Scorers.
 */

export function extractFundamentalData(rawData, manualOverrides = {}) {
    const ratios = Array.isArray(rawData?.ratios) ? rawData.ratios : [];
    const incomeArray = Array.isArray(rawData?.income) ? rawData.income : (Array.isArray(rawData?.income?.full_statement) ? rawData.income.full_statement : []);
    const balanceArray = Array.isArray(rawData?.balanceSheet) ? rawData.balanceSheet : (Array.isArray(rawData?.balanceSheet?.full_statement) ? rawData.balanceSheet.full_statement : []);
    const cashArray = Array.isArray(rawData?.cashFlow) ? rawData.cashFlow : (Array.isArray(rawData?.cashFlow?.full_statement) ? rawData.cashFlow.full_statement : []);

    // Helper to find a ratio by name
    const findRatio = (names) => ratios.find(r => names.some(n => r.name?.toLowerCase().includes(n)));
    
    // --- Extraction Logic --- //
    
    // 1. P/E Ratio
    const peObj = findRatio(['p/e', 'pe ratio']);
    const currentPE = peObj?.company_value ? parseFloat(peObj.company_value) : null;
    const sectorPE = peObj?.sector_value ? parseFloat(peObj.sector_value) : null;

    // 2. P/B Ratio
    const pbObj = findRatio(['p/b', 'pb ratio']);
    const currentPB = pbObj?.company_value ? parseFloat(pbObj.company_value) : null;
    const sectorPB = pbObj?.sector_value ? parseFloat(pbObj.sector_value) : null;

    // 2b. EV/EBITDA
    const evObj = findRatio(['ev/ebitda', 'enterprise value to ebitda']);
    const currentEVEbitda = evObj?.company_value ? parseFloat(evObj.company_value) : (rawData?.ev_ebitda ? parseFloat(rawData.ev_ebitda) : null);
    const sectorEVEbitda = evObj?.sector_value ? parseFloat(evObj.sector_value) : null;

    // 3. Dividend Yield
    const divObj = findRatio(['dividend yield']);
    const currentDivYield = divObj?.company_value ? parseFloat(divObj.company_value) : (rawData?.dividendYield !== undefined ? parseFloat(rawData.dividendYield) : null);
    const bondYield = 7.1; // Hardcoded default for Bond yield as in frontend

    // 4. EPS Growth
    let epsCAGR = null;
    let latestYoY = null;
    let positiveYears = null;
    let totalPeriods = 0;
    let epsHistory = [];
    const epsRatio = findRatio(['eps growth']);
    if (epsRatio?.company_value && !isNaN(parseFloat(epsRatio.company_value))) {
        epsCAGR = parseFloat(epsRatio.company_value);
    }
    const epsObj = incomeArray.find(r => r.particular?.toLowerCase().includes('eps - basic') || r.particular?.toLowerCase().includes('eps'));
    if (epsObj && Array.isArray(epsObj.history) && epsObj.history.length > 0) {
        epsHistory = epsObj.history.map(h => ({ period: h.period, value: h.value }));
        if (epsCAGR === null && epsObj.history.length >= 2) {
            const chronological = [...epsObj.history].reverse();
            totalPeriods = chronological.length - 1;
            const first = chronological[0].value;
            const last = chronological[chronological.length - 1].value;
            const prev = chronological[chronological.length - 2].value;
            if (first > 0 && last > 0) epsCAGR = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
            if (prev !== 0) latestYoY = ((last - prev) / Math.abs(prev)) * 100;
            positiveYears = 0;
            for (let i = 1; i < chronological.length; i++) {
                if (chronological[i].value > chronological[i - 1].value) positiveYears++;
            }
        }
    }

    // 5. Debt to Equity
    const deObj = findRatio(['debt to equity', 'debt/equity', 'debt equity']);
    let currentDE = deObj?.company_value ? parseFloat(deObj.company_value) : (rawData?.debtToEquity !== undefined ? parseFloat(rawData.debtToEquity) : (rawData?.debt_to_equity !== undefined ? parseFloat(rawData.debt_to_equity) : null));
    const sectorDE = deObj?.sector_value ? parseFloat(deObj.sector_value) : null;
    if (currentDE === null && balanceArray.length > 0) {
        const equityObj = balanceArray.find(m => m.particular === 'Equity Capital');
        const nonCurrLiabObj = balanceArray.find(m => m.particular === 'Non-Current Liabilities');
        const currLiabObj = balanceArray.find(m => m.particular === 'Current Liabilities');
        if (equityObj?.history?.length > 0 && (nonCurrLiabObj || currLiabObj)) {
            const latestEquity = equityObj.history[0].value;
            const ncl = nonCurrLiabObj?.history?.[0]?.value || 0;
            const cl = currLiabObj?.history?.[0]?.value || 0;
            if (latestEquity > 0) currentDE = (ncl + cl) / latestEquity;
        }
    }

    // 6. ROE
    const roeObj = findRatio(['return on equity', 'roe']);
    const currentROE = roeObj?.company_value ? parseFloat(roeObj.company_value) : (rawData?.roe !== undefined ? parseFloat(rawData.roe) : null);
    const sectorROE = roeObj?.sector_value ? parseFloat(roeObj.sector_value) : null;

    // 7. ROCE
    const roceObj = findRatio(['return on capital employed', 'roce']);
    const currentROCE = roceObj?.company_value ? parseFloat(roceObj.company_value) : (rawData?.roce !== undefined ? parseFloat(rawData.roce) : null);
    const sectorROCE = roceObj?.sector_value ? parseFloat(roceObj.sector_value) : null;

    // 7b. ROA
    const roaObj = findRatio(['return on assets', 'roa']);
    const currentROA = roaObj?.company_value ? parseFloat(roaObj.company_value) : (rawData?.roa !== undefined ? parseFloat(rawData.roa) : null);
    const sectorROA = roaObj?.sector_value ? parseFloat(roaObj.sector_value) : null;

    // 8. FII/DII
    const extData = rawData?.externalData || {};
    const fiiFlow = extData?.fiiFlow ?? null; 
    const diiFlow = extData?.diiFlow ?? null;
    const analystConsensus = extData?.analystConsensus ?? rawData?.analystConsensus ?? null;

    // 8b. Institutional & Promoter Shareholding
    const holdingsArr = Array.isArray(rawData?.holdings) ? rawData.holdings : [];
    const promoterObj = holdingsArr.find(h => h.category === 'promoters');
    let currentPromoter = null;
    let prevPromoter = null;
    if (promoterObj && Array.isArray(promoterObj.history) && promoterObj.history.length > 0) {
        currentPromoter = promoterObj.history[0].value;
        prevPromoter = promoterObj.history.length > 1 ? promoterObj.history[1].value : null;
    } else if (rawData?.promoter_holding !== undefined && rawData?.promoter_holding !== null) {
        currentPromoter = parseFloat(rawData.promoter_holding);
    }

    const fiiObj = holdingsArr.find(h => h.category === 'fii');
    const diiObj = holdingsArr.find(h => h.category === 'other_dii');
    const mfObj  = holdingsArr.find(h => h.category === 'mutual_funds');
    const getLatestHoldings = (obj, idx = 0) => obj?.history?.[idx]?.value ?? null;
    const f0 = getLatestHoldings(fiiObj, 0), f1 = getLatestHoldings(fiiObj, 1);
    const d0 = getLatestHoldings(diiObj, 0), d1 = getLatestHoldings(diiObj, 1);
    const m0 = getLatestHoldings(mfObj, 0),  m1 = getLatestHoldings(mfObj, 1);
    let latestInstitutional = null;
    let prevInstitutional = null;
    if (f0 !== null || d0 !== null || m0 !== null) {
        latestInstitutional = (f0 || 0) + (d0 || 0) + (m0 || 0);
    }
    if (f1 !== null || d1 !== null || m1 !== null) {
        prevInstitutional = (f1 || 0) + (d1 || 0) + (m1 || 0);
    }

    // 9. GDP Growth
    let gdpGrowth = rawData?.externalData?.gdpGrowth ?? rawData?.gdpGrowth ?? 7.0; 

    // 10. Market Cap to GDP (Buffett Indicator)
    const marketCapGDP = 110; 

    // --- Additional Fundamentals ---
    
    // Net Margin
    const nmObj = findRatio(['net margin', 'net profit margin', 'profit margin']);
    let currentNetMargin = nmObj?.company_value ? parseFloat(nmObj.company_value) : null;
    const sectorNetMargin = nmObj?.sector_value ? parseFloat(nmObj.sector_value) : null;
    if (currentNetMargin === null && incomeArray.length > 0) {
        const profitObj = incomeArray.find(m => (m.particular === 'Profit After Tax' || m.particular === 'Profit Before Tax') && m.history?.length >= 1);
        const revObj = incomeArray.find(m => (m.particular === 'Total Revenue' || m.particular === 'Revenue') && m.history?.length >= 1);
        if (profitObj && revObj && revObj.history[0].value > 0) {
            currentNetMargin = (profitObj.history[0].value / revObj.history[0].value) * 100;
        }
    }

    // Operating Margin
    const omObj = findRatio(['operating margin']);
    let currentOpMargin = omObj?.company_value ? parseFloat(omObj.company_value) : null;
    const sectorOpMargin = omObj?.sector_value ? parseFloat(omObj.sector_value) : null;
    if (currentOpMargin === null) {
        const incStmt = Array.isArray(rawData?.income?.income_statement) ? rawData.income.income_statement : [];
        const opProfitObj = incStmt.find(m => m.category === 'operating_profit' && m.history?.length >= 1);
        const revObj = incomeArray.find(m => (m.particular === 'Total Revenue' || m.particular === 'Revenue') && m.history?.length >= 1);
        if (opProfitObj && revObj && revObj.history[0].value > 0) {
            currentOpMargin = (opProfitObj.history[0].value / revObj.history[0].value) * 100;
        }
    }

    // Current Ratio
    const crObj = findRatio(['current ratio']);
    let currentRatio = crObj?.company_value ? parseFloat(crObj.company_value) : (rawData?.currentRatio !== undefined ? parseFloat(rawData.currentRatio) : (rawData?.current_ratio !== undefined ? parseFloat(rawData.current_ratio) : null));
    const sectorCurrentRatio = crObj?.sector_value ? parseFloat(crObj.sector_value) : null;
    if (currentRatio === null && balanceArray.length > 0) {
        const caObj = balanceArray.find(m => m.particular?.toLowerCase() === 'current assets');
        const clObj = balanceArray.find(m => m.particular?.toLowerCase() === 'current liabilities');
        if (caObj?.history?.length > 0 && clObj?.history?.length > 0 && clObj.history[0].value > 0) {
            currentRatio = caObj.history[0].value / clObj.history[0].value;
        }
    }

    // Interest Coverage
    const icObj = findRatio(['interest coverage']);
    const interestCoverage = icObj?.company_value ? parseFloat(icObj.company_value) : (rawData?.interestCoverage !== undefined ? parseFloat(rawData.interestCoverage) : (rawData?.interest_coverage !== undefined ? parseFloat(rawData.interest_coverage) : null));
    const sectorCoverage = icObj?.sector_value ? parseFloat(icObj.sector_value) : null;

    // Forward PE
    const fpeObj = findRatio(['forward p/e', 'forward pe']);
    let forwardPE = rawData?.externalData?.forwardPE ?? rawData?.forward_pe ?? (fpeObj?.company_value ? parseFloat(fpeObj.company_value) : null);
    
    // VIX
    const indiaVix = rawData?.externalData?.vix ?? rawData?.india_vix ?? null;

    // Earnings Yield (EPS / Price - computed from P/E or ratio)
    const eyObj = findRatio(['earnings yield']);
    let currentEarningsYield = eyObj?.company_value ? parseFloat(eyObj.company_value) : null;
    if (currentEarningsYield === null && currentPE !== null && currentPE > 0) {
        currentEarningsYield = (1 / currentPE) * 100;
    }

    // Free Cash Flow
    let currentFCF = rawData?.free_cash_flow ? parseFloat(rawData.free_cash_flow) : null;
    let currentRevenue = rawData?.revenue ? parseFloat(rawData.revenue) : null;
    if (currentFCF === null) {
        const cashFlowArr = Array.isArray(rawData?.cashFlow?.cash_flow) ? rawData.cashFlow.cash_flow : [];
        const opCashObj = cashFlowArr.find(m => m.category === 'operating');
        const invCashObj = cashFlowArr.find(m => m.category === 'investing');
        if (opCashObj?.history?.length > 0 && invCashObj?.history?.length > 0) {
            currentFCF = opCashObj.history[0].value + invCashObj.history[0].value;
        } else if (cashArray.length > 0) {
            const fcfObj = cashArray.find(r => r.particular?.toLowerCase().includes('free cash flow'));
            if (fcfObj && fcfObj.history && fcfObj.history.length > 0) {
                currentFCF = fcfObj.history[0].value;
            }
        }
    }
    if (incomeArray.length > 0) {
        const revObj = incomeArray.find(r => r.particular?.toLowerCase().includes('total revenue') || r.particular?.toLowerCase().includes('revenue from operations'));
        if (revObj && revObj.history && revObj.history.length > 0) {
            currentRevenue = revObj.history[0].value;
        }
    }

    // Revenue Growth
    let revCAGR = null, revYoY = null, revPos = 0, revTot = 0;
    const revObj = incomeArray.find(r => r.particular?.toLowerCase().includes('total revenue') || r.particular?.toLowerCase().includes('revenue from operations'));
    if (revObj && Array.isArray(revObj.history) && revObj.history.length >= 2) {
        const chronological = [...revObj.history].reverse();
        revTot = chronological.length - 1;
        const first = chronological[0].value;
        const last = chronological[chronological.length - 1].value;
        const prev = chronological[chronological.length - 2].value;
        if (first > 0 && last > 0) revCAGR = (Math.pow(last / first, 1 / revTot) - 1) * 100;
        if (prev !== 0) revYoY = ((last - prev) / Math.abs(prev)) * 100;
        for (let i = 1; i < chronological.length; i++) {
            if (chronological[i].value > chronological[i - 1].value) revPos++;
        }
    }

    // Profit Growth
    let patCAGR = null, patYoY = null, patPos = 0, patTot = 0;
    const patObj = incomeArray.find(r => r.particular?.toLowerCase().includes('profit for the period') || r.particular?.toLowerCase().includes('net income'));
    if (patObj && Array.isArray(patObj.history) && patObj.history.length >= 2) {
        const chronological = [...patObj.history].reverse();
        patTot = chronological.length - 1;
        const first = chronological[0].value;
        const last = chronological[chronological.length - 1].value;
        const prev = chronological[chronological.length - 2].value;
        if (first > 0 && last > 0) patCAGR = (Math.pow(last / first, 1 / patTot) - 1) * 100;
        if (prev !== 0) patYoY = ((last - prev) / Math.abs(prev)) * 100;
        for (let i = 1; i < chronological.length; i++) {
            if (chronological[i].value > chronological[i - 1].value) patPos++;
        }
    }

    // Relative Valuation (Blended premium/discount vs sector: 40% P/E, 35% P/B, 25% EV/EBITDA)
    let pePrem = (currentPE !== null && sectorPE) ? ((currentPE - sectorPE) / sectorPE) * 100 : null;
    let pbPrem = (currentPB !== null && sectorPB) ? ((currentPB - sectorPB) / sectorPB) * 100 : null;
    let evebPrem = (currentEVEbitda !== null && sectorEVEbitda) ? ((currentEVEbitda - sectorEVEbitda) / sectorEVEbitda) * 100 : null;
    let blendedPremium = null;
    let premW = 0;
    if (pePrem !== null) { blendedPremium = (blendedPremium || 0) + pePrem * 0.40; premW += 0.40; }
    if (pbPrem !== null) { blendedPremium = (blendedPremium || 0) + pbPrem * 0.35; premW += 0.35; }
    if (evebPrem !== null) { blendedPremium = (blendedPremium || 0) + evebPrem * 0.25; premW += 0.25; }
    if (premW > 0 && blendedPremium !== null) blendedPremium = blendedPremium / premW;

    // Earnings Quality (Operating Cash Flow / Net Profit)
    const cashFlowArr = Array.isArray(rawData?.cashFlow?.cash_flow) ? rawData.cashFlow.cash_flow : [];
    const opCf = cashFlowArr.find(c => c.category === 'operating')?.history?.[0]?.value ?? cashArray.find(m => m.particular?.toLowerCase().includes('operating'))?.history?.[0]?.value ?? null;
    let netProf = null;
    const incStmt = Array.isArray(rawData?.income?.income_statement) ? rawData.income.income_statement : [];
    const netProfObj = incStmt.find(i => i.category === 'net_profit');
    if (netProfObj?.history?.length > 0) {
        netProf = netProfObj.history[0].value;
    } else if (incomeArray.length > 0) {
        const patObj = incomeArray.find(m => m.particular === 'Profit After Tax' || m.particular === 'Profit Before Tax');
        if (patObj?.history?.length > 0) netProf = patObj.history[0].value;
    }
    const cfoToNetProfit = (opCf !== null && netProf !== null && netProf !== 0) ? (opCf / netProf) : null;

    // Corporate Actions
    const corpActionsArr = Array.isArray(rawData?.corporate_actions) ? rawData.corporate_actions : [];
    const hasCorporateActions = corpActionsArr.length > 0;

    // --- Working Capital Turnover Ratios ---
    const cccObj = rawData?.cashConversionCycle || {};
    const invTOObj = findRatio(['inventory turnover']);
    const inventoryTurnover = invTOObj?.company_value ? parseFloat(invTOObj.company_value) : (cccObj.inventoryDays ? (365 / cccObj.inventoryDays) : null);
    
    const recTOObj = findRatio(['receivables turnover', 'debtors turnover']);
    const receivablesTurnover = recTOObj?.company_value ? parseFloat(recTOObj.company_value) : (cccObj.receivableDays ? (365 / cccObj.receivableDays) : null);
    
    const payTOObj = findRatio(['payables turnover', 'creditors turnover']);
    const payablesTurnover = payTOObj?.company_value ? parseFloat(payTOObj.company_value) : (cccObj.payableDays ? (365 / cccObj.payableDays) : null);

    // Apply manual overrides if provided
    if (manualOverrides.debt_to_equity !== undefined && manualOverrides.debt_to_equity !== null && manualOverrides.debt_to_equity !== '') currentDE = parseFloat(manualOverrides.debt_to_equity);
    if (manualOverrides.current_ratio !== undefined && manualOverrides.current_ratio !== null && manualOverrides.current_ratio !== '') currentRatio = parseFloat(manualOverrides.current_ratio);
    if (manualOverrides.net_margin !== undefined && manualOverrides.net_margin !== null && manualOverrides.net_margin !== '') currentNetMargin = parseFloat(manualOverrides.net_margin);
    if (manualOverrides.operating_margin !== undefined && manualOverrides.operating_margin !== null && manualOverrides.operating_margin !== '') currentOpMargin = parseFloat(manualOverrides.operating_margin);
    if (manualOverrides.free_cash_flow !== undefined && manualOverrides.free_cash_flow !== null && manualOverrides.free_cash_flow !== '') currentFCF = parseFloat(manualOverrides.free_cash_flow);
    if (manualOverrides.earnings_yield !== undefined && manualOverrides.earnings_yield !== null && manualOverrides.earnings_yield !== '') currentEarningsYield = parseFloat(manualOverrides.earnings_yield);
    if (manualOverrides.relative_valuation !== undefined && manualOverrides.relative_valuation !== null && manualOverrides.relative_valuation !== '') blendedPremium = parseFloat(manualOverrides.relative_valuation);
    if (manualOverrides.pe_ratio !== undefined && manualOverrides.pe_ratio !== null && manualOverrides.pe_ratio !== '') currentPE = parseFloat(manualOverrides.pe_ratio);
    if (manualOverrides.forward_pe !== undefined && manualOverrides.forward_pe !== null && manualOverrides.forward_pe !== '') forwardPE = parseFloat(manualOverrides.forward_pe);
    if (manualOverrides.pb_ratio !== undefined && manualOverrides.pb_ratio !== null && manualOverrides.pb_ratio !== '') currentPB = parseFloat(manualOverrides.pb_ratio);
    if (manualOverrides.ev_ebitda !== undefined && manualOverrides.ev_ebitda !== null && manualOverrides.ev_ebitda !== '') currentEVEbitda = parseFloat(manualOverrides.ev_ebitda);
    if (manualOverrides.gdp_growth !== undefined && manualOverrides.gdp_growth !== null && manualOverrides.gdp_growth !== '') gdpGrowth = parseFloat(manualOverrides.gdp_growth);
    if (manualOverrides.dividend_yield !== undefined && manualOverrides.dividend_yield !== null && manualOverrides.dividend_yield !== '') currentDivYield = parseFloat(manualOverrides.dividend_yield);
    if (manualOverrides.promoter_holding !== undefined && manualOverrides.promoter_holding !== null && manualOverrides.promoter_holding !== '') currentPromoter = parseFloat(manualOverrides.promoter_holding);

    // Return structured extracted variables
    return {
        currentPE, sectorPE,
        currentPB, sectorPB,
        currentEVEbitda, sectorEVEbitda,
        currentDivYield, bondYield,
        epsCAGR, latestYoY, positiveYears, totalPeriods, epsHistory,
        currentDE, sectorDE,
        currentROE, sectorROE,
        currentROCE, sectorROCE,
        currentROA, sectorROA,
        currentPromoter, prevPromoter,
        latestInstitutional, prevInstitutional,
        fiiFlow, diiFlow,
        gdpGrowth, marketCapGDP,
        currentNetMargin, sectorNetMargin,
        currentOpMargin, sectorOpMargin,
        currentRatio, sectorCurrentRatio,
        interestCoverage, sectorCoverage,
        forwardPE, currentEarningsYield,
        currentFCF, currentRevenue,
        revCAGR, revYoY, revPos, revTot,
        patCAGR, patYoY, patPos, patTot,
        blendedPremium, cfoToNetProfit, hasCorporateActions,
        inventoryTurnover, receivablesTurnover, payablesTurnover,
        indiaVix, analystConsensus,
        sector: rawData?.company_profile?.sector ?? rawData?.sector ?? ''
    };
}
