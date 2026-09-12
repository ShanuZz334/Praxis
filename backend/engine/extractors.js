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
    const deObj = findRatio(['debt to equity', 'debt/equity']);
    const currentDE = deObj?.company_value ? parseFloat(deObj.company_value) : (rawData?.debtToEquity !== undefined ? parseFloat(rawData.debtToEquity) : (rawData?.debt_to_equity !== undefined ? parseFloat(rawData.debt_to_equity) : null));
    const sectorDE = deObj?.sector_value ? parseFloat(deObj.sector_value) : null;

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
    const gdpGrowth = rawData?.externalData?.gdpGrowth ?? rawData?.gdpGrowth ?? 7.0; 

    // 10. Market Cap to GDP (Buffett Indicator)
    const marketCapGDP = 110; 

    // --- Additional Fundamentals ---
    
    // Net Margin
    const nmObj = findRatio(['net margin', 'net profit margin']);
    const currentNetMargin = nmObj?.company_value ? parseFloat(nmObj.company_value) : null;
    const sectorNetMargin = nmObj?.sector_value ? parseFloat(nmObj.sector_value) : null;

    // Operating Margin
    const omObj = findRatio(['operating margin']);
    const currentOpMargin = omObj?.company_value ? parseFloat(omObj.company_value) : null;
    const sectorOpMargin = omObj?.sector_value ? parseFloat(omObj.sector_value) : null;

    // Current Ratio
    const crObj = findRatio(['current ratio']);
    const currentRatio = crObj?.company_value ? parseFloat(crObj.company_value) : (rawData?.currentRatio !== undefined ? parseFloat(rawData.currentRatio) : (rawData?.current_ratio !== undefined ? parseFloat(rawData.current_ratio) : null));
    const sectorCurrentRatio = crObj?.sector_value ? parseFloat(crObj.sector_value) : null;

    // Interest Coverage
    const icObj = findRatio(['interest coverage']);
    const interestCoverage = icObj?.company_value ? parseFloat(icObj.company_value) : (rawData?.interestCoverage !== undefined ? parseFloat(rawData.interestCoverage) : (rawData?.interest_coverage !== undefined ? parseFloat(rawData.interest_coverage) : null));
    const sectorCoverage = icObj?.sector_value ? parseFloat(icObj.sector_value) : null;

    // Forward PE
    const fpeObj = findRatio(['forward p/e', 'forward pe']);
    const forwardPE = rawData?.externalData?.forwardPE ?? rawData?.forward_pe ?? (fpeObj?.company_value ? parseFloat(fpeObj.company_value) : null);
    
    // VIX
    const indiaVix = rawData?.externalData?.vix ?? rawData?.india_vix ?? null;

    // Earnings Yield (EPS / Price - computed later or from ratio)
    const eyObj = findRatio(['earnings yield']);
    const currentEarningsYield = eyObj?.company_value ? parseFloat(eyObj.company_value) : null;

    // Free Cash Flow
    let currentFCF = rawData?.free_cash_flow ? parseFloat(rawData.free_cash_flow) : null;
    let currentRevenue = rawData?.revenue ? parseFloat(rawData.revenue) : null;
    if (cashArray.length > 0) {
        const fcfObj = cashArray.find(r => r.particular?.toLowerCase().includes('free cash flow'));
        if (fcfObj && fcfObj.history && fcfObj.history.length > 0) {
            currentFCF = fcfObj.history[0].value; // most recent
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

    // --- Working Capital Turnover Ratios ---
    const cccObj = rawData?.cashConversionCycle || {};
    const invTOObj = findRatio(['inventory turnover']);
    const inventoryTurnover = invTOObj?.company_value ? parseFloat(invTOObj.company_value) : (cccObj.inventoryDays ? (365 / cccObj.inventoryDays) : null);
    
    const recTOObj = findRatio(['receivables turnover', 'debtors turnover']);
    const receivablesTurnover = recTOObj?.company_value ? parseFloat(recTOObj.company_value) : (cccObj.receivableDays ? (365 / cccObj.receivableDays) : null);
    
    const payTOObj = findRatio(['payables turnover', 'creditors turnover']);
    const payablesTurnover = payTOObj?.company_value ? parseFloat(payTOObj.company_value) : (cccObj.payableDays ? (365 / cccObj.payableDays) : null);

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
        inventoryTurnover, receivablesTurnover, payablesTurnover,
        indiaVix, analystConsensus
    };
}
