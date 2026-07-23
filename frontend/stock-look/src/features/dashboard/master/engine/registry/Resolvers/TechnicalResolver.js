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
    scoreWilliamsRCard
} from '../../../technical/engine/TechnicalCompositeEngine';

export function resolveTechnical(cardDef, rawTechnicals, currentPrice) {
    if (!rawTechnicals) return { hasLiveData: false, status: 'missing', reason: 'No upstream data' };

    const t = rawTechnicals || {};
    const p = currentPrice || t.current_price;

    let result = { hasLiveData: false, reason: 'Algorithm unavailable' };

    switch (cardDef.id) {
        case 'adx':
            if (t.adx) result = { hasLiveData: true, value: JSON.stringify(t.adx), score: scoreADXCard(t.adx).score };
            break;
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
        case 'kc_20_2':
            if (t.kc_20_2) result = { hasLiveData: true, value: JSON.stringify(t.kc_20_2), score: scoreKCCard(t.kc_20_2).score };
            break;
        case 'macd':
            if (t.macd) result = { hasLiveData: true, value: JSON.stringify(t.macd), score: scoreMACDCard(t.macd).score };
            break;
        case 'obv':
            if (t.obv) result = { hasLiveData: true, value: JSON.stringify(t.obv), score: scoreObvCard(t.obv).score };
            break;
        case 'pivot_points':
            if (t.pivot_points && p) result = { hasLiveData: true, value: JSON.stringify(t.pivot_points), score: scorePivotCard(t.pivot_points, p).score };
            break;
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
            if (t.volume_sma) result = { hasLiveData: true, value: JSON.stringify(t.volume_sma), score: scoreVolumeSmaCard(t.volume_sma).score };
            break;
        case 'vwap':
            if (t.vwap && p) result = { hasLiveData: true, value: JSON.stringify(t.vwap), score: scoreVwapCard(t.vwap, p).score };
            break;
        case 'williams_r':
            if (t.williams_r) result = { hasLiveData: true, value: JSON.stringify(t.williams_r), score: scoreWilliamsRCard(t.williams_r).score };
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
