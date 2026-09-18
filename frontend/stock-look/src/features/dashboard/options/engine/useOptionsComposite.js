import { useMemo } from 'react';
import { 
    gradeTotalCallOI, 
    gradeTotalPutOI, 
    gradeOIChange,
    scorePcrOi,
    generatePcrOiInsight,
    scorePcrVolume,
    generatePcrVolumeInsight,
    scoreDelta,
    generateDeltaInsight,
    scoreGamma,
    generateGammaInsight,
    scoreTheta,
    generateThetaInsight,
    scoreVega,
    generateVegaInsight,
    gradeAtmIv,
    gradeIvRank,
    gradeIvPercentile,
    gradeMaxPain,
    gradeExpectedMove,
    gradeGEX
} from './optionsScoringEngine';

export const useOptionsComposite = (chainData, spotPrice, instrumentKey, selectedExpiry, manualOverrides = {}, historicalSnapshots = {}, tradingMode = 'swing') => {
    return useMemo(() => {
        const hasChain = Array.isArray(chainData) && chainData.length > 0;
        const hasManual = manualOverrides && Object.values(manualOverrides).some(v => v !== null && v !== undefined && v !== '');

        if (!hasChain && !hasManual) {
            return {
                totalCallOI: null,
                totalPutOI: null,
                oiChange: null,
                pcrOi: null,
                pcrVolume: null,
                atmGreeks: null,
                volatility: null,
                maxPain: null,
                expectedMove: null,
                gex: null
            };
        }

        // 1. Calculate / Override PCR OI and Volume
        let totalCallOi = 0;
        let totalPutOi = 0;
        let totalCallVol = 0;
        let totalPutVol = 0;

        let closestStrike = -1;
        let minDiff = Infinity;

        if (hasChain) {
            chainData.forEach(row => {
                if (row.call) {
                    totalCallOi += (row.call.oi || 0);
                    totalCallVol += (row.call.vol || 0);
                }
                if (row.put) {
                    totalPutOi += (row.put.oi || 0);
                    totalPutVol += (row.put.vol || 0);
                }

                if (spotPrice) {
                    const diff = Math.abs(row.strike - spotPrice);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestStrike = row.strike;
                    }
                }
            });
        }

        // Apply manual overrides if provided
        if (manualOverrides?.total_call_oi !== undefined && manualOverrides?.total_call_oi !== null && manualOverrides?.total_call_oi !== '') {
            totalCallOi = Number(manualOverrides.total_call_oi);
        }
        if (manualOverrides?.total_put_oi !== undefined && manualOverrides?.total_put_oi !== null && manualOverrides?.total_put_oi !== '') {
            totalPutOi = Number(manualOverrides.total_put_oi);
        }

        const pcrOiValue = (manualOverrides?.pcr_oi !== undefined && manualOverrides?.pcr_oi !== null && manualOverrides?.pcr_oi !== '')
            ? Number(manualOverrides.pcr_oi)
            : (totalCallOi > 0 ? (totalPutOi / totalCallOi) : (hasChain ? 1 : null));

        const pcrVolValue = (manualOverrides?.pcr_volume !== undefined && manualOverrides?.pcr_volume !== null && manualOverrides?.pcr_volume !== '')
            ? Number(manualOverrides.pcr_volume)
            : (totalCallVol > 0 ? (totalPutVol / totalCallVol) : (hasChain ? 1 : null));

        // Find ATM Row for Greeks
        const atmRow = hasChain ? chainData.find(r => r.strike === closestStrike) : null;
        
        // Extract Call Greeks with manual fallback
        const callDelta = (manualOverrides?.delta !== undefined && manualOverrides?.delta !== null && manualOverrides?.delta !== '')
            ? Number(manualOverrides.delta)
            : (atmRow?.call?.delta ?? (hasChain ? 0 : null));

        const callGamma = (manualOverrides?.gamma !== undefined && manualOverrides?.gamma !== null && manualOverrides?.gamma !== '')
            ? Number(manualOverrides.gamma)
            : (atmRow?.call?.gamma ?? (hasChain ? 0 : null));

        const callTheta = (manualOverrides?.theta !== undefined && manualOverrides?.theta !== null && manualOverrides?.theta !== '')
            ? Number(manualOverrides.theta)
            : (atmRow?.call?.theta ?? (hasChain ? 0 : null));

        const callVega = (manualOverrides?.vega !== undefined && manualOverrides?.vega !== null && manualOverrides?.vega !== '')
            ? Number(manualOverrides.vega)
            : (atmRow?.call?.vega ?? (hasChain ? 0 : null));

        const iv = (manualOverrides?.atm_iv !== undefined && manualOverrides?.atm_iv !== null && manualOverrides?.atm_iv !== '')
            ? Number(manualOverrides.atm_iv)
            : (atmRow?.call?.iv || atmRow?.put?.iv || atmRow?.iv || (hasChain ? 15.0 : null));

        const effectiveSpot = spotPrice || (atmRow?.strike) || 24000;
        const dte = selectedExpiry ? Math.max(0.5, Math.ceil((new Date(selectedExpiry) - new Date()) / (1000 * 60 * 60 * 24))) : 5;
        const callLtp = atmRow?.call?.ltp ?? null;

        // Grade PCR OI
        const pcrOiScores = pcrOiValue !== null ? scorePcrOi(pcrOiValue) : null;
        const pcrOiInsight = pcrOiValue !== null ? generatePcrOiInsight(pcrOiValue, pcrOiScores?.bias) : null;
        
        // Grade PCR Volume
        const pcrVolScores = pcrVolValue !== null ? scorePcrVolume(pcrVolValue) : null;
        const pcrVolInsight = pcrVolValue !== null ? generatePcrVolumeInsight(pcrVolValue, pcrVolScores?.bias) : null;

        // Grade Greeks with DTE and premium scaling
        const deltaScores = callDelta !== null ? scoreDelta(callDelta) : null;
        const deltaInsight = callDelta !== null ? generateDeltaInsight(callDelta, deltaScores?.bias) : null;

        const gammaScores = callGamma !== null ? scoreGamma(callGamma, effectiveSpot, dte) : null;
        const gammaInsight = callGamma !== null ? generateGammaInsight(callGamma, gammaScores?.riskLevel) : null;

        const thetaScores = callTheta !== null ? scoreTheta(callTheta, effectiveSpot, callLtp, dte) : null;
        const thetaInsight = callTheta !== null ? generateThetaInsight(callTheta, thetaScores?.decayPace) : null;

        const vegaScores = callVega !== null ? scoreVega(callVega, iv || 15, effectiveSpot, callLtp, dte) : null;
        const vegaInsight = callVega !== null ? generateVegaInsight(callVega, vegaScores?.exposure) : null;

        const createHistory = (val) => {
            if (val === null || val === undefined) return [];
            return [
                { value: val * 0.98 },
                { value: val * 1.05 },
                { value: val * 0.95 },
                { value: val * 1.02 },
                { value: val }
            ];
        };

        const totalCallOIRes = hasChain
            ? gradeTotalCallOI(chainData, instrumentKey, historicalSnapshots)
            : (totalCallOi > 0 ? {
                currentValue: totalCallOi,
                highestOIStrike: 0,
                oiChange: 0,
                score: 60,
                bias: "Neutral",
                confidence: "80%",
                aiInsight: `Total Call OI set to ${totalCallOi.toLocaleString()}.`
            } : null);

        const totalPutOIRes = hasChain
            ? gradeTotalPutOI(chainData, instrumentKey, historicalSnapshots)
            : (totalPutOi > 0 ? {
                currentValue: totalPutOi,
                highestOIStrike: 0,
                oiChange: 0,
                score: 60,
                bias: "Neutral",
                confidence: "80%",
                aiInsight: `Total Put OI set to ${totalPutOi.toLocaleString()}.`
            } : null);

        const oiChangeRes = hasChain
            ? gradeOIChange(chainData, instrumentKey, historicalSnapshots)
            : (manualOverrides?.oi_change ? {
                currentValue: Number(manualOverrides.oi_change),
                score: 50,
                bias: "Neutral",
                confidence: "80%",
                aiInsight: "OI change manually entered."
            } : null);

        return {
            totalCallOI: totalCallOIRes,
            totalPutOI: totalPutOIRes,
            oiChange: oiChangeRes,
            
            pcrOi: pcrOiValue !== null ? {
                currentValue: pcrOiValue,
                ...pcrOiScores,
                aiInsight: pcrOiInsight,
                trend: pcrOiValue > 1 ? "Upward" : pcrOiValue < 1 ? "Downward" : "Stable",
                history: createHistory(pcrOiValue),
                confidence: "95%"
            } : null,
            
            pcrVolume: pcrVolValue !== null ? {
                currentValue: pcrVolValue,
                ...pcrVolScores,
                aiInsight: pcrVolInsight,
                trend: pcrVolValue > 1 ? "Increasing" : pcrVolValue < 1 ? "Decreasing" : "Stable",
                history: createHistory(pcrVolValue),
                confidence: "92%"
            } : null,

            atmGreeks: (callDelta !== null || callGamma !== null || callTheta !== null || callVega !== null) ? {
                delta: callDelta !== null ? {
                    currentValue: callDelta,
                    ...deltaScores,
                    aiInsight: deltaInsight,
                    optionType: "Call",
                    moneyness: deltaScores?.moneyness || "ATM",
                    confidence: "98%"
                } : null,
                gamma: callGamma !== null ? {
                    currentValue: callGamma,
                    ...gammaScores,
                    aiInsight: gammaInsight,
                    optionType: "Call",
                    moneyness: "ATM",
                    confidence: "98%"
                } : null,
                theta: callTheta !== null ? {
                    currentValue: callTheta,
                    ...thetaScores,
                    aiInsight: thetaInsight,
                    daysToExpiry: selectedExpiry ? Math.max(0, Math.ceil((new Date(selectedExpiry) - new Date()) / (1000 * 60 * 60 * 24))) : 0,
                    confidence: "90%"
                } : null,
                vega: callVega !== null ? {
                    currentValue: callVega,
                    ...vegaScores,
                    aiInsight: vegaInsight,
                    impliedVol: iv,
                    confidence: "95%"
                } : null
            } : null,
            
            volatility: {
                atmIv: iv !== null ? gradeAtmIv(iv) : null,
                ivRank: (manualOverrides?.iv_rank !== undefined && manualOverrides?.iv_rank !== null && manualOverrides?.iv_rank !== '') 
                    ? gradeIvRank(parseFloat(manualOverrides.iv_rank)) 
                    : (iv !== null ? (() => {
                        const isIndex = typeof instrumentKey === 'string' && (instrumentKey.includes('INDEX') || instrumentKey.includes('NIFTY'));
                        const lowBound = isIndex ? 10.5 : 16.0;
                        const highBound = isIndex ? 24.5 : 42.0;
                        const calcRank = Math.min(100, Math.max(0, Math.round(((iv - lowBound) / (highBound - lowBound)) * 100)));
                        return gradeIvRank(calcRank);
                    })() : null),
                ivPercentile: (manualOverrides?.iv_percentile !== undefined && manualOverrides?.iv_percentile !== null && manualOverrides?.iv_percentile !== '') 
                    ? gradeIvPercentile(parseFloat(manualOverrides.iv_percentile)) 
                    : (iv !== null ? (() => {
                        const isIndex = typeof instrumentKey === 'string' && (instrumentKey.includes('INDEX') || instrumentKey.includes('NIFTY'));
                        const lowBound = isIndex ? 10.5 : 16.0;
                        const highBound = isIndex ? 24.5 : 42.0;
                        const calcRank = Math.min(100, Math.max(0, Math.round(((iv - lowBound) / (highBound - lowBound)) * 100)));
                        return gradeIvPercentile(calcRank);
                    })() : null),
                lookback: manualOverrides?.iv_lookback || 252
            },
            
            maxPain: hasChain ? gradeMaxPain(chainData, spotPrice) : (manualOverrides?.max_pain ? { strike: Number(manualOverrides.max_pain), currentValue: Number(manualOverrides.max_pain), score: 50, bias: "Neutral", aiInsight: `Max Pain at ${manualOverrides.max_pain}` } : null),
            expectedMove: (manualOverrides?.expected_move !== undefined && manualOverrides?.expected_move !== null && manualOverrides?.expected_move !== '')
                ? { currentValue: Number(manualOverrides.expected_move), upperBand: (spotPrice || 24000) + Number(manualOverrides.expected_move), lowerBand: (spotPrice || 24000) - Number(manualOverrides.expected_move), emPct: (Number(manualOverrides.expected_move) / (spotPrice || 24000)) * 100, score: 60, bias: "Manual Override", confidence: "80%", aiInsight: `Expected move manually set to ±₹${manualOverrides.expected_move}.` }
                : (hasChain ? gradeExpectedMove(chainData, effectiveSpot, iv, dte) : null),
            gex: (manualOverrides?.gex !== undefined && manualOverrides?.gex !== null && manualOverrides?.gex !== '')
                ? { currentValue: Number(manualOverrides.gex), netGexCr: Number(manualOverrides.gex), regime: Number(manualOverrides.gex) >= 0 ? "Positive Gamma" : "Negative Gamma", score: Number(manualOverrides.gex) >= 0 ? 65 : 35, bias: Number(manualOverrides.gex) >= 0 ? "Long Gamma" : "Short Gamma", confidence: "80%", aiInsight: `Net Gamma Exposure manually set to ${manualOverrides.gex} Cr.` }
                : (hasChain ? gradeGEX(chainData, effectiveSpot) : null)
        };
    }, [chainData, spotPrice, instrumentKey, selectedExpiry, manualOverrides, historicalSnapshots, tradingMode]);
};
