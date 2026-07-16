import { useMemo } from 'react';
import { getIndicatorColor } from '@/shared/config/scoreColors';
import { getOptionsRegime, getOptionsGauge } from './optionsHelper';

export function useOptionsCompositeScore(compositeData) {
    return useMemo(() => {
        const empty = {
            compositeScore: 50,
            gauge: { label: '-', color: '#64748B' },
            regime: { label: '-', description: 'Awaiting options data...', color: '#64748B', confidence: 0 },
            sections: [],
            tailwinds: [],
            risks: [],
            aiInsight: 'Awaiting options data...',
            cardScores: {}
        };
        if (!compositeData) return empty;

        const safeScore = (obj) =>
            (obj && obj.score !== undefined && obj.score !== null && !isNaN(obj.score))
                ? Math.round(obj.score) : null;

        const cardScores = {
            total_call_oi:  safeScore(compositeData.totalCallOI),
            total_put_oi:   safeScore(compositeData.totalPutOI),
            oi_change:      safeScore(compositeData.oiChange),
            pcr_oi:         safeScore(compositeData.pcrOi),
            pcr_volume:     safeScore(compositeData.pcrVolume),
            delta:          safeScore(compositeData.atmGreeks?.delta),
            gamma:          safeScore(compositeData.atmGreeks?.gamma),
            theta:          safeScore(compositeData.atmGreeks?.theta),
            vega:           safeScore(compositeData.atmGreeks?.vega),
            atm_iv:         safeScore(compositeData.volatility?.atmIv),
            iv_rank:        safeScore(compositeData.volatility?.ivRank),
            iv_percentile:  safeScore(compositeData.volatility?.ivPercentile),
            max_pain:       safeScore(compositeData.maxPain),
        };

        const avg = (...keys) => {
            const vals = keys.map(k => cardScores[k]).filter(v => v !== null);
            if (vals.length === 0) return null;
            return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        };

        const sectionsData = [
            { id: 'Open Interest',      label: 'Open Interest',      shortLabel: 'OI',  score: avg('total_call_oi', 'total_put_oi', 'oi_change'), weight: 0.25 },
            { id: 'Put-Call Ratio',     label: 'Put-Call Ratio',     shortLabel: 'PCR', score: avg('pcr_oi', 'pcr_volume'),                       weight: 0.20 },
            { id: 'Greeks',             label: 'Greeks',             shortLabel: 'GRK', score: avg('delta', 'gamma', 'theta', 'vega'),             weight: 0.20 },
            { id: 'Market Positioning', label: 'Market Positioning', shortLabel: 'POS', score: avg('max_pain'),                                   weight: 0.20 },
            { id: 'Volatility',         label: 'Volatility',         shortLabel: 'VOL', score: avg('atm_iv', 'iv_rank', 'iv_percentile'),          weight: 0.15 },
        ];

        const validSections = sectionsData.filter(s => s.score !== null);
        let compositeScore = 50;
        if (validSections.length > 0) {
            const totalW = validSections.reduce((acc, s) => acc + s.weight, 0);
            compositeScore = validSections.reduce((acc, s) => acc + (s.score * s.weight), 0) / totalW;
            const distressCount = validSections.filter(s => s.score < 25).length;
            compositeScore = Math.max(0, compositeScore - distressCount * 3);
            compositeScore = Math.min(100, Math.round(compositeScore));
        }

        const gauge  = getOptionsGauge(compositeScore);
        const regime = getOptionsRegime(compositeScore);

        const tailwindImpact = (s) => (s.score - 50) * s.weight;
        const tailwinds = sectionsData
            .filter(s => s.score !== null && s.score >= 60)
            .sort((a, b) => tailwindImpact(b) - tailwindImpact(a))
            .slice(0, 3)
            .map(s => ({ id: s.id, label: s.label, value: s.score, sub: Math.round(s.weight * 100) + '% weight · ' + getIndicatorColor(s.score).label }));

        const riskImpact = (s) => (50 - s.score) * s.weight;
        const risks = sectionsData
            .filter(s => s.score !== null && s.score <= 40)
            .sort((a, b) => riskImpact(b) - riskImpact(a))
            .slice(0, 3)
            .map(s => ({ id: s.id, label: s.label, value: s.score, sub: Math.round(s.weight * 100) + '% weight · ' + getIndicatorColor(s.score).label }));

        const pcrOiVal   = compositeData.pcrOi?.currentValue;
        const pcrVolVal  = compositeData.pcrVolume?.currentValue;
        const atmIvVal   = compositeData.volatility?.atmIv?.currentValue;
        const maxPainVal = compositeData.maxPain?.currentValue;

        let aiInsight;
        if (compositeScore >= 70) {
            aiInsight = 'Options sentiment is strongly Bullish at ' + compositeScore + '/100.' +
                (pcrOiVal != null ? ' PCR OI at ' + parseFloat(pcrOiVal).toFixed(2) + ' reflects heavy put hedging - a contrarian bullish signal.' : '') +
                (atmIvVal != null ? ' ATM IV at ' + parseFloat(atmIvVal).toFixed(1) + '% ' + (atmIvVal < 15 ? 'is low, making long options cost-effective.' : 'is elevated - premium selling may be favored.') : '');
        } else if (compositeScore >= 55) {
            aiInsight = 'Options positioning is moderately Bullish (' + compositeScore + '/100).' +
                (maxPainVal != null ? ' Spot gravitating towards Max Pain at ' + parseFloat(maxPainVal).toLocaleString('en-IN') + ', suggesting pinning pressure.' : '') +
                (pcrOiVal != null ? ' PCR OI of ' + parseFloat(pcrOiVal).toFixed(2) + ' signals ' + (pcrOiVal > 1 ? 'protective put accumulation.' : 'call-heavy positioning.') : '');
        } else if (compositeScore >= 45) {
            aiInsight = 'Options market is Neutral (' + compositeScore + '/100).' +
                (pcrVolVal != null ? ' PCR Volume at ' + parseFloat(pcrVolVal).toFixed(2) + ' confirms balanced activity.' : '') +
                (atmIvVal != null ? ' ATM IV at ' + parseFloat(atmIvVal).toFixed(1) + '% - consider range-bound strategies like Iron Condors.' : ' Range-bound strategies are suited for current conditions.');
        } else if (compositeScore >= 30) {
            aiInsight = 'Options sentiment is turning Bearish (' + compositeScore + '/100).' +
                (pcrOiVal != null ? ' PCR OI at ' + parseFloat(pcrOiVal).toFixed(2) + ' shows ' + (pcrOiVal < 0.8 ? 'aggressive call writing - bears are in control.' : 'elevated put buying.') : '') +
                ' Consider protective strategies or premium selling on calls.';
        } else {
            aiInsight = 'Options sentiment is strongly Bearish (' + compositeScore + '/100).' +
                (atmIvVal != null ? ' ATM IV at ' + parseFloat(atmIvVal).toFixed(1) + '% is ' + (atmIvVal > 25 ? 'elevated, indicating market fear - premiums are expensive.' : 'moderate.') : '') +
                ' Defensive positioning and bear spreads are statistically favorable.';
        }

        return {
            compositeScore,
            gauge,
            regime: { ...regime, description: aiInsight, confidence: validSections.length > 0 ? Math.round((validSections.length / sectionsData.length) * 100) : 0 },
            sections: sectionsData,
            tailwinds,
            risks,
            aiInsight,
            cardScores
        };
    }, [compositeData]);
}
