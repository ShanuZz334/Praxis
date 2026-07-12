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

    // 3. Dividend Yield
    const divObj = findRatio(['dividend yield']);
    const currentDivYield = divObj?.company_value ? parseFloat(divObj.company_value) : null;
    const bondYield = 7.1; // Hardcoded default for Bond yield as in frontend

    // 4. EPS Growth
    let epsCAGR = null;
    let latestYoY = null;
    let positiveYears = null;
    let totalPeriods = 0;
    const epsRatio = findRatio(['eps growth']);
    if (epsRatio?.company_value && !isNaN(parseFloat(epsRatio.company_value))) {
        epsCAGR = parseFloat(epsRatio.company_value);
    } else {
        const epsObj = incomeArray.find(r => r.particular?.toLowerCase().includes('eps - basic') || r.particular?.toLowerCase().includes('eps'));
        if (epsObj && Array.isArray(epsObj.history) && epsObj.history.length >= 2) {
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
    const currentDE = deObj?.company_value ? parseFloat(deObj.company_value) : null;
    const sectorDE = deObj?.sector_value ? parseFloat(deObj.sector_value) : null;

    // 6. ROE
    const roeObj = findRatio(['return on equity', 'roe']);
    const currentROE = roeObj?.company_value ? parseFloat(roeObj.company_value) : null;
    const sectorROE = roeObj?.sector_value ? parseFloat(roeObj.sector_value) : null;

    // 7. ROCE
    const roceObj = findRatio(['return on capital employed', 'roce']);
    const currentROCE = roceObj?.company_value ? parseFloat(roceObj.company_value) : null;
    const sectorROCE = roceObj?.sector_value ? parseFloat(roceObj.sector_value) : null;

    // 8. FII/DII (Manual from DB or placeholder)
    const fiiFlow = null; 
    const diiFlow = null;

    // 9. GDP Growth (Manual macro)
    const gdpGrowth = 7.0; 

    // 10. Market Cap to GDP (Buffett Indicator)
    const marketCapGDP = 110; 

    // Return structured extracted variables
    return {
        currentPE, sectorPE,
        currentPB, sectorPB,
        currentDivYield, bondYield,
        epsCAGR, latestYoY, positiveYears, totalPeriods,
        currentDE, sectorDE,
        currentROE, sectorROE,
        currentROCE, sectorROCE,
        fiiFlow, diiFlow,
        gdpGrowth, marketCapGDP
    };
}
