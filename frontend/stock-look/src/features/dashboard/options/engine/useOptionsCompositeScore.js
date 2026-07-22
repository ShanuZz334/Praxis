import { useMemo } from 'react';
import { getIndicatorColor } from '@/shared/config/scoreColors';
import { getOptionsRegime, getOptionsGauge } from './optionsHelper';

import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

export function useOptionsCompositeScore(compositeData, instrumentKey, metrics = null, proDeskPicks = null, spotPrice = null) {
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
            [CARD_REGISTRY.total_call_oi.id]: safeScore(compositeData.totalCallOI),
            [CARD_REGISTRY.total_put_oi.id]: safeScore(compositeData.totalPutOI),
            [CARD_REGISTRY.oi_change.id]: safeScore(compositeData.oiChange),
            [CARD_REGISTRY.pcr_oi.id]: safeScore(compositeData.pcrOi),
            [CARD_REGISTRY.pcr_volume.id]: safeScore(compositeData.pcrVolume),
            [CARD_REGISTRY.delta.id]: safeScore(compositeData.atmGreeks?.delta),
            [CARD_REGISTRY.gamma.id]: safeScore(compositeData.atmGreeks?.gamma),
            [CARD_REGISTRY.theta.id]: safeScore(compositeData.atmGreeks?.theta),
            [CARD_REGISTRY.vega.id]: safeScore(compositeData.atmGreeks?.vega),
            [CARD_REGISTRY.atm_iv.id]: safeScore(compositeData.volatility?.atmIv),
            [CARD_REGISTRY.iv_rank.id]: safeScore(compositeData.volatility?.ivRank),
            [CARD_REGISTRY.iv_percentile.id]: safeScore(compositeData.volatility?.ivPercentile),
            [CARD_REGISTRY.max_pain.id]: safeScore(compositeData.maxPain),
        };

        const avg = (...keys) => {
            const vals = keys.map(k => cardScores[k]).filter(v => v !== null);
            if (vals.length === 0) return null;
            return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        };

        const sectionsData = [
            { id: 'Open Interest',      label: 'Open Interest',      shortLabel: 'OI',  score: avg(CARD_REGISTRY.total_call_oi.id, CARD_REGISTRY.total_put_oi.id, CARD_REGISTRY.oi_change.id), weight: 0.25 },
            { id: 'Put-Call Ratio',     label: 'Put-Call Ratio',     shortLabel: 'PCR', score: avg(CARD_REGISTRY.pcr_oi.id, CARD_REGISTRY.pcr_volume.id),                       weight: 0.20 },
            { id: 'Greeks',             label: 'Greeks',             shortLabel: 'GRK', score: avg(CARD_REGISTRY.delta.id, CARD_REGISTRY.gamma.id, CARD_REGISTRY.theta.id, CARD_REGISTRY.vega.id),             weight: 0.20 },
            { id: 'Market Positioning', label: 'Market Positioning', shortLabel: 'POS', score: avg(CARD_REGISTRY.max_pain.id),                                   weight: 0.20 },
            { id: 'Volatility',         label: 'Volatility',         shortLabel: 'VOL', score: avg(CARD_REGISTRY.atm_iv.id, CARD_REGISTRY.iv_rank.id, CARD_REGISTRY.iv_percentile.id),          weight: 0.15 },
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

        const formatTitle = (id) => {
            if (!id) return '';
            return id.split('_').map(word => {
                if (word.match(/^(oi|pcr|iv)$/i)) return word.toUpperCase();
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
        };

        const sectionsMap = {};
        sectionsData.forEach(sec => {
            sectionsMap[sec.label] = {
                name: sec.label,
                score: sec.score,
                weight: sec.weight,
                cards: []
            };
        });

        const SECTION_MAPPING = {
            [CARD_REGISTRY.total_call_oi.id]: 'Open Interest', [CARD_REGISTRY.total_put_oi.id]: 'Open Interest', [CARD_REGISTRY.oi_change.id]: 'Open Interest',
            [CARD_REGISTRY.pcr_oi.id]: 'Put-Call Ratio', [CARD_REGISTRY.pcr_volume.id]: 'Put-Call Ratio',
            [CARD_REGISTRY.delta.id]: 'Greeks', [CARD_REGISTRY.gamma.id]: 'Greeks', [CARD_REGISTRY.theta.id]: 'Greeks', [CARD_REGISTRY.vega.id]: 'Greeks',
            [CARD_REGISTRY.atm_iv.id]: 'Volatility', [CARD_REGISTRY.iv_rank.id]: 'Volatility', [CARD_REGISTRY.iv_percentile.id]: 'Volatility',
            [CARD_REGISTRY.max_pain.id]: 'Market Positioning'
        };

        Object.entries(cardScores).forEach(([id, score]) => {
            if (score === null || score === undefined || isNaN(score)) return;
            const secName = SECTION_MAPPING[id] || 'General';
            if (sectionsMap[secName]) {
                let normalized = 0;
                if (score > 70) normalized = 1;
                else if (score < 30) normalized = -1;
                const config = getIndicatorConfig(id);
                sectionsMap[secName].cards.push({
                    name: config?.title || formatTitle(config?.id) || formatTitle(id),
                    score: normalized,
                    value: Number(score),
                    weight: config?.creditScore ?? 5
                });
            }
        });

        const nestedTreePayload = {
            engines: [{
                name: "Options Dashboard",
                score: compositeScore,
                sections: Object.values(sectionsMap),
                marketContext: metrics ? {
                    spotPrice: spotPrice,
                    pcr: metrics.pcr,
                    maxPain: metrics.maxPain,
                    ivRank: metrics.ivRank
                } : null,
                proDeskPicks: proDeskPicks ? {
                    bullish: proDeskPicks.bullish ? {
                        strike: proDeskPicks.bullish.strike,
                        premium: proDeskPicks.bullish.ltp,
                        delta: proDeskPicks.bullish.delta,
                        theta: proDeskPicks.bullish.theta,
                        gamma: proDeskPicks.bullish.gamma,
                        vega: proDeskPicks.bullish.vega,
                        iv: proDeskPicks.bullish.iv
                    } : null,
                    bearish: proDeskPicks.bearish ? {
                        strike: proDeskPicks.bearish.strike,
                        premium: proDeskPicks.bearish.ltp,
                        delta: proDeskPicks.bearish.delta,
                        theta: proDeskPicks.bearish.theta,
                        gamma: proDeskPicks.bearish.gamma,
                        vega: proDeskPicks.bearish.vega,
                        iv: proDeskPicks.bearish.iv
                    } : null,
                    atm: proDeskPicks.atm ? {
                        strike: proDeskPicks.atm.strike,
                        type: proDeskPicks.atm.type,
                        premium: proDeskPicks.atm.ltp,
                        delta: proDeskPicks.atm.delta,
                        theta: proDeskPicks.atm.theta,
                        gamma: proDeskPicks.atm.gamma,
                        vega: proDeskPicks.atm.vega,
                        iv: proDeskPicks.atm.iv
                    } : null,
                    momentum: proDeskPicks.momentum ? {
                        strike: proDeskPicks.momentum.strike,
                        type: proDeskPicks.momentum.type,
                        premium: proDeskPicks.momentum.ltp,
                        delta: proDeskPicks.momentum.delta,
                        theta: proDeskPicks.momentum.theta,
                        gamma: proDeskPicks.momentum.gamma,
                        vega: proDeskPicks.momentum.vega,
                        iv: proDeskPicks.momentum.iv
                    } : null,
                    liquidity: proDeskPicks.liquidity ? {
                        strike: proDeskPicks.liquidity.strike,
                        type: proDeskPicks.liquidity.type,
                        premium: proDeskPicks.liquidity.ltp,
                        delta: proDeskPicks.liquidity.delta,
                        theta: proDeskPicks.liquidity.theta,
                        gamma: proDeskPicks.liquidity.gamma,
                        vega: proDeskPicks.liquidity.vega,
                        iv: proDeskPicks.liquidity.iv
                    } : null
                } : null
            }]
        };

        const result = {
            compositeScore,
            gauge,
            regime: { ...regime, description: aiInsight, confidence: validSections.length > 0 ? Math.round((validSections.length / sectionsData.length) * 100) : 0 },
            sections: sectionsData,
            tailwinds,
            risks,
            aiInsight,
            cardScores,
            nestedTreePayload
        };

        // Fire & Forget DB Sync
        if (typeof window !== 'undefined' && compositeData && instrumentKey) {
            import('@/shared/utils/axiosInstance').then(({ default: axiosInstance }) => {
                const ik = typeof instrumentKey === 'object' ? instrumentKey.value || instrumentKey.id : instrumentKey;
                axiosInstance.post('/api/v1/snapshots/header', {
                    instrument_key: ik || 'NIFTY',
                    category: 'options',
                    composite_score: compositeScore,
                    regime_json: result.regime,
                    tailwinds_json: tailwinds,
                    risks_json: risks
                }).catch(err => console.error("Failed to sync Options header:", err));
            });
        }

        return result;
    }, [compositeData, instrumentKey, metrics, proDeskPicks, spotPrice]);
}
