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
    scoreDividendYield
} from '../../../fundamentals/engine/scoringEngine';

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
        case 'pe_ratio': {
            const r = getRatio('p/e', 'price to earnings');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scorePERatio(r.value, null, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
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
        case 'roe': {
            const r = getRatio('return on equity', 'roe');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreROE(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'roa': {
            const r = getRatio('return on assets', 'roa');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreROA(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'roce': {
            const r = getRatio('return on capital employed', 'roce');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreROCE(r.value, r.sector).score };
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
        case 'debt_to_equity': {
            const r = getRatio('debt to equity');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreDebtToEquity(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'current_ratio': {
            const r = getRatio('current ratio');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreCurrentRatio(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'interest_coverage': {
            const r = getRatio('interest coverage');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreInterestCoverage(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'dividend_yield': {
            const r = getRatio('dividend yield');
            if (r.value !== null) result = { hasLiveData: true, value: r.value, score: scoreDividendYield(r.value, r.sector).score };
            else result = { hasLiveData: false, reason: 'Missing from upstream API' };
            break;
        }
        case 'fii_dii_flow':
        case 'fii_dii_flow_master':
            if (rawFundamentals.fiiDiiFlow) {
                result = { hasLiveData: true, value: JSON.stringify(rawFundamentals.fiiDiiFlow), score: 50 };
            } else {
                result = { hasLiveData: false, reason: 'FII/DII data missing' };
            }
            break;
        default:
            result = { hasLiveData: false, reason: 'Algorithm unavailable for ' + cardDef.id };
            break;
    }

    return result;
}
