export function resolveOptions(cardDef, rawOptions) {
    if (!rawOptions) return { hasLiveData: false, status: 'missing', reason: 'No upstream data' };

    const extractVal = (obj) => {
        if (obj === null || obj === undefined) return null;
        if (obj.currentValue !== undefined) return obj.currentValue;
        if (obj.value !== undefined) return obj.value;
        if (obj.pcr !== undefined) return obj.pcr;
        if (obj.strike !== undefined) return obj.strike;
        return null;
    };

    const safeScore = (obj) =>
        (obj && obj.score !== undefined && obj.score !== null && !isNaN(obj.score))
            ? Math.round(obj.score) : null;

    let valObj = null;
    switch (cardDef.id) {
        case 'total_call_oi': valObj = rawOptions.totalCallOI; break;
        case 'total_put_oi': valObj = rawOptions.totalPutOI; break;
        case 'oi_change': valObj = rawOptions.oiChange; break;
        case 'pcr_oi': valObj = rawOptions.pcrOi; break;
        case 'pcr_volume': valObj = rawOptions.pcrVolume; break;
        case 'delta': valObj = rawOptions.atmGreeks?.delta; break;
        case 'gamma': valObj = rawOptions.atmGreeks?.gamma; break;
        case 'theta': valObj = rawOptions.atmGreeks?.theta; break;
        case 'vega': valObj = rawOptions.atmGreeks?.vega; break;
        case 'atm_iv': valObj = rawOptions.volatility?.atmIv; break;
        case 'iv_rank': valObj = rawOptions.volatility?.ivRank; break;
        case 'iv_percentile': valObj = rawOptions.volatility?.ivPercentile; break;
        case 'max_pain': valObj = rawOptions.maxPain; break;
    }

    const value = extractVal(valObj);
    const score = safeScore(valObj);

    if (value === null || value === undefined) {
        return {
            hasLiveData: false,
            reason: 'Missing from upstream API'
        };
    }

    return {
        hasLiveData: true,
        value,
        score
    };
}
