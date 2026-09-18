import {
    scoreADXCard,
    scoreATRCard,
    scoreBBCard,
    scoreCmfCard,
    scoreEMA20Card,
    scoreEMA50Card,
    scoreEMA200Card,
    scoreFibonacciCard,
    scoreKCCard,
    scoreMACDCard,
    scoreObvCard,
    scorePivotCard,
    scoreResistanceCard,
    scoreRSICard,
    scoreSMA200Card,
    scoreSMA50Card,
    scoreStochRSICard,
    scoreSupertrendCard,
    scoreSupportCard,
    scoreVolumeSmaCard,
    scoreVwapCard,
    scoreWilliamsRCard,
    scoreBetaCard,
    scoreTrendlineCard,
    scoreBreadthRatioCard,
    scoreADLineCard,
    scoreMcClellanCard,
    scoreNhnlCard,
    scoreTrinCard
} from '../../../../technical/engine/TechnicalCompositeEngine.js';

export function resolveTechnical(cardDef, rawTechnicals, currentPrice) {
    if (!rawTechnicals) return { hasLiveData: false, status: 'missing', reason: 'No upstream data' };

    const t = rawTechnicals || {};
    const p = currentPrice || t.current_price;

    let result = { hasLiveData: false, reason: 'Algorithm unavailable' };

    switch (cardDef.id) {
        case 'adx': {
            const adxBull = t.adx?.pdi !== undefined ? t.adx.pdi >= t.adx.mdi : (p && t.ema_50 ? p >= t.ema_50 : null);
            if (t.adx) result = { hasLiveData: true, value: JSON.stringify(t.adx), score: scoreADXCard(t.adx, adxBull).score };
            break;
        }
        case 'atr':
            if (t.atr && p) result = { hasLiveData: true, value: JSON.stringify(t.atr), score: scoreATRCard(t.atr, p).score };
            break;
        case 'bb_20_2':
            if (t.bb_20_2) result = { hasLiveData: true, value: JSON.stringify(t.bb_20_2), score: scoreBBCard(t.bb_20_2).score };
            break;
        case 'cmf':
            if (t.cmf) result = { hasLiveData: true, value: JSON.stringify(t.cmf), score: scoreCmfCard(t.cmf).score };
            break;
        case 'ema_20':
            if (t.ema_20 && p) result = { hasLiveData: true, value: JSON.stringify(t.ema_20), score: scoreEMA20Card(t.ema_20, p).score };
            break;
        case 'ema_50':
            if (t.ema_50 && p) result = { hasLiveData: true, value: JSON.stringify(t.ema_50), score: scoreEMA50Card(t.ema_50, p).score };
            break;
        case 'ema_200':
            if (t.ema_200 && p) result = { hasLiveData: true, value: JSON.stringify(t.ema_200), score: scoreEMA200Card(t.ema_200, p).score };
            break;
        case 'fibonacci':
            if (t.fibonacci && p) result = { hasLiveData: true, value: JSON.stringify(t.fibonacci), score: scoreFibonacciCard(t.fibonacci, p).score };
            break;
        case 'kc':
        case 'kc_20_2': {
            const kcVal = t.kc || t.kc_20_2;
            if (kcVal) result = { hasLiveData: true, value: JSON.stringify(kcVal), score: scoreKCCard(kcVal, p).score };
            break;
        }
        case 'macd':
            if (t.macd) result = { hasLiveData: true, value: JSON.stringify(t.macd), score: scoreMACDCard(t.macd).score };
            break;
        case 'obv':
            if (t.obv) result = { hasLiveData: true, value: JSON.stringify(t.obv), score: scoreObvCard(t.obv, t.obv_sma, t.volume_sma).score };
            break;
        case 'pivot':
        case 'pivot_points': {
            const pivVal = t.pivot || t.pivot_points;
            if (pivVal && p) result = { hasLiveData: true, value: JSON.stringify(pivVal), score: scorePivotCard(pivVal, p).score };
            break;
        }
        case 'resistance':
            if (t.resistance && p) result = { hasLiveData: true, value: JSON.stringify(t.resistance), score: scoreResistanceCard(t.resistance, p).score };
            break;
        case 'rsi':
            if (t.rsi) result = { hasLiveData: true, value: JSON.stringify(t.rsi), score: scoreRSICard(t.rsi).score };
            break;
        case 'sma_50':
            if (t.sma_50 && p) result = { hasLiveData: true, value: JSON.stringify(t.sma_50), score: scoreSMA50Card(t.sma_50, p).score };
            break;
        case 'sma_200':
            if (t.sma_200 && p) result = { hasLiveData: true, value: JSON.stringify(t.sma_200), score: scoreSMA200Card(t.sma_200, p).score };
            break;
        case 'stoch_rsi':
            if (t.stoch_rsi) result = { hasLiveData: true, value: JSON.stringify(t.stoch_rsi), score: scoreStochRSICard(t.stoch_rsi).score };
            break;
        case 'supertrend':
            if (t.supertrend && p) result = { hasLiveData: true, value: JSON.stringify(t.supertrend), score: scoreSupertrendCard(t.supertrend, p).score };
            break;
        case 'support':
            if (t.support && p) result = { hasLiveData: true, value: JSON.stringify(t.support), score: scoreSupportCard(t.support, p).score };
            break;
        case 'volume_sma':
            if (t.volume_sma) result = { hasLiveData: true, value: JSON.stringify(t.volume_sma), score: scoreVolumeSmaCard(t.volume_sma, t.current_volume, p, t.open_price).score };
            break;
        case 'vwap':
            if (t.vwap && p) result = { hasLiveData: true, value: JSON.stringify(t.vwap), score: scoreVwapCard(t.vwap, p).score };
            break;
        case 'williams_r':
            if (t.williams_r) result = { hasLiveData: true, value: JSON.stringify(t.williams_r), score: scoreWilliamsRCard(t.williams_r).score };
            break;
        case 'trendline':
            if (t.trendline) result = { hasLiveData: true, value: JSON.stringify(t.trendline), score: scoreTrendlineCard(t.trendline).score };
            break;
        case 'beta':
        case 'beta_correlation':
            if (t.beta !== undefined && t.beta !== null) {
                const bVal = typeof t.beta === 'object' ? t.beta.value ?? t.beta.beta : t.beta;
                result = { hasLiveData: true, value: JSON.stringify(t.beta), score: scoreBetaCard(bVal).score };
            }
            break;
        case 'breadth_ratio':
            if (t.breadth_ratio !== undefined && t.breadth_ratio !== null) {
                result = { hasLiveData: true, value: JSON.stringify(t.breadth_ratio), score: scoreBreadthRatioCard(t.breadth_ratio).score };
            }
            break;
        case 'ad_line':
            if (t.ad_line !== undefined && t.ad_line !== null) {
                result = { hasLiveData: true, value: JSON.stringify(t.ad_line), score: scoreADLineCard(t.ad_line).score };
            }
            break;
        case 'mcclellan':
            if (t.mcclellan !== undefined && t.mcclellan !== null) {
                result = { hasLiveData: true, value: JSON.stringify(t.mcclellan), score: scoreMcClellanCard(t.mcclellan).score };
            }
            break;
        case 'nh_nl':
            if (t.nh_nl !== undefined && t.nh_nl !== null) {
                result = { hasLiveData: true, value: JSON.stringify(t.nh_nl), score: scoreNhnlCard(t.nh_nl).score };
            }
            break;
        case 'trin':
            if (t.trin !== undefined && t.trin !== null) {
                result = { hasLiveData: true, value: JSON.stringify(t.trin), score: scoreTrinCard(t.trin).score };
            }
            break;
        default:
            result = { hasLiveData: false, reason: 'Algorithm unavailable for ' + cardDef.id };
            break;
    }

    if (!result.hasLiveData && !result.reason) {
        result.reason = 'Missing from upstream API';
    }

    return result;
}
