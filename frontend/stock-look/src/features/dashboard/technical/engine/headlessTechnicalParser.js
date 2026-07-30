import axiosInstance from '@/shared/utils/axiosInstance';

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
    scoreBreadthRatioCard,
    scoreADLineCard,
    scoreMcClellanCard,
    scoreNhnlCard,
    scoreTrinCard,
    scoreTrendlineCard,
    scoreBetaCorrelationCard
} from './TechnicalCompositeEngine';

import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

function parseHeadlessTechnicals(rawTechnicals, currentPrice, manualOverrides = {}) {
    const scores = {};
    const cards = [];
    const t = rawTechnicals || {};
    const p = currentPrice || t.current_price;

    const attemptComputation = (id) => {
        let overrideVal = manualOverrides[id];
        let useOverride = overrideVal !== undefined && overrideVal !== null && overrideVal !== '';
        
        if (!rawTechnicals && !useOverride) return { success: false, reason: "No upstream data" };
        
        switch (id) {
            case 'adx':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreADXCard(overrideVal).score };
                if (t.adx) return { success: true, valueObj: t.adx, score: scoreADXCard(t.adx).score };
                break;
            case 'atr':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreATRCard(overrideVal, p).score };
                if (t.atr && p) return { success: true, valueObj: t.atr, score: scoreATRCard(t.atr, p).score };
                break;
            case 'bb_20_2':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreBBCard(overrideVal).score };
                if (t.bb_20_2) return { success: true, valueObj: t.bb_20_2, score: scoreBBCard(t.bb_20_2).score };
                break;
            case 'cmf':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreCmfCard(overrideVal).score };
                if (t.cmf) return { success: true, valueObj: t.cmf, score: scoreCmfCard(t.cmf).score };
                break;
            case 'ema_20':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreEMA20Card(overrideVal, p).score };
                if (t.ema_20 && p) return { success: true, valueObj: t.ema_20, score: scoreEMA20Card(t.ema_20, p).score };
                break;
            case 'ema_50':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreEMA50Card(overrideVal, p).score };
                if (t.ema_50 && p) return { success: true, valueObj: t.ema_50, score: scoreEMA50Card(t.ema_50, p).score };
                break;
            case 'ema_200':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreEMA200Card(overrideVal, p).score };
                if (t.ema_200 && p) return { success: true, valueObj: t.ema_200, score: scoreEMA200Card(t.ema_200, p).score };
                break;
            case 'fibonacci':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreFibonacciCard(overrideVal, p).score };
                if (t.fibonacci && p) return { success: true, valueObj: t.fibonacci, score: scoreFibonacciCard(t.fibonacci, p).score };
                break;
            case 'kc':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreKCCard(overrideVal, p).score };
                if (t.kc && p) return { success: true, valueObj: t.kc, score: scoreKCCard(t.kc, p).score };
                break;
            case 'macd':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreMACDCard(overrideVal).score };
                if (t.macd) return { success: true, valueObj: t.macd, score: scoreMACDCard(t.macd).score };
                break;
            case 'obv':
                if (useOverride && t.obv_sma) return { success: true, valueObj: overrideVal, score: scoreObvCard(overrideVal, t.obv_sma).score };
                if (t.obv && t.obv_sma) return { success: true, valueObj: t.obv, score: scoreObvCard(t.obv, t.obv_sma).score };
                break;
            case 'pivot':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scorePivotCard(overrideVal, p).score };
                if (t.pivot && p) return { success: true, valueObj: t.pivot, score: scorePivotCard(t.pivot, p).score };
                break;
            case 'resistance':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreResistanceCard(overrideVal, p).score };
                if (t.resistance && p) return { success: true, valueObj: t.resistance, score: scoreResistanceCard(t.resistance, p).score };
                break;
            case 'rsi':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreRSICard(overrideVal).score };
                if (t.rsi) return { success: true, valueObj: t.rsi, score: scoreRSICard(t.rsi).score };
                break;
            case 'sma_50':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreSMA50Card(overrideVal, p).score };
                if (t.sma_50 && p) return { success: true, valueObj: t.sma_50, score: scoreSMA50Card(t.sma_50, p).score };
                break;
            case 'sma_200':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreSMA200Card(overrideVal, p).score };
                if (t.sma_200 && p) return { success: true, valueObj: t.sma_200, score: scoreSMA200Card(t.sma_200, p).score };
                break;
            case 'stoch_rsi':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreStochRSICard(overrideVal).score };
                if (t.stoch_rsi) return { success: true, valueObj: t.stoch_rsi, score: scoreStochRSICard(t.stoch_rsi).score };
                break;
            case 'supertrend':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreSupertrendCard(overrideVal, p).score };
                if (t.supertrend && p) return { success: true, valueObj: t.supertrend, score: scoreSupertrendCard(t.supertrend, p).score };
                break;
            case 'support':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreSupportCard(overrideVal, p).score };
                if (t.support && p) return { success: true, valueObj: t.support, score: scoreSupportCard(t.support, p).score };
                break;
            case 'volume_sma':
                if (useOverride && t.current_volume) return { success: true, valueObj: overrideVal, score: scoreVolumeSmaCard(overrideVal, t.current_volume).score };
                if (t.volume_sma && t.current_volume) return { success: true, valueObj: t.volume_sma, score: scoreVolumeSmaCard(t.volume_sma, t.current_volume).score };
                break;
            case 'vwap':
                if (useOverride && p) return { success: true, valueObj: overrideVal, score: scoreVwapCard(overrideVal, p).score };
                if (t.vwap && p) return { success: true, valueObj: t.vwap, score: scoreVwapCard(t.vwap, p).score };
                break;
            case 'williams_r':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreWilliamsRCard(overrideVal).score };
                if (t.williams_r) return { success: true, valueObj: t.williams_r, score: scoreWilliamsRCard(t.williams_r).score };
                break;
            // Additional overrides specifically for Breadth which might not be generated from Headless Upstox response
            case 'breadth_ratio':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreBreadthRatioCard(overrideVal).score };
                break;
            case 'ad_line':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreADLineCard(overrideVal).score };
                break;
            case 'mcclellan':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreMcClellanCard(overrideVal).score };
                break;
            case 'nh_nl':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreNhnlCard(overrideVal).score };
                break;
            case 'trin':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreTrinCard(overrideVal).score };
                break;
            case 'trendline':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreTrendlineCard(overrideVal).score };
                if (t.trendline) return { success: true, valueObj: t.trendline, score: scoreTrendlineCard(t.trendline).score };
                break;
            case 'beta_correlation':
                if (useOverride) return { success: true, valueObj: overrideVal, score: scoreBetaCorrelationCard(overrideVal).score };
                if (t.beta !== undefined && t.beta !== null) return { success: true, valueObj: t.beta, score: scoreBetaCorrelationCard(t.beta).score };
                break;
            default:
                return { success: false, reason: "Algorithm unavailable or data missing" };
        }
        return { success: false, reason: "Data missing in Upstox response or calculation failed" };
    };

    Object.values(CARD_REGISTRY).forEach(cardConfig => {
        if (cardConfig.page?.toLowerCase() !== 'technical') return;
        if (cardConfig.type === 'widget') return;

        const result = attemptComputation(cardConfig.id);
        
        if (result.success) {
            scores[cardConfig.id] = result.score;
            let val = result.valueObj;
            if (typeof val === 'object' && val !== null) {
                val = val.value ?? val.histogram ?? val.rsi ?? JSON.stringify(val);
            }
            cards.push({
                id: cardConfig.id,
                displayName: cardConfig.displayName,
                value: val,
                score: result.score,
                hasLiveData: true
            });
        } else {
            cards.push({
                id: cardConfig.id,
                displayName: cardConfig.displayName,
                value: null,
                score: null,
                hasLiveData: false,
                status: "missing",
                reason: result.reason,
                source: "Upstox API",
                lastAttempt: Date.now(),
                retryAfter: 10000,
                supportsRealtime: true,
                appliesTo: cardConfig.appliesTo || 'both',
                severity: "low"
            });
        }
    });

    return { scores, cards };
}


export class TechnicalEngine {
    constructor() {
        this.intervalId = null;
        this.instrument = null;
        this.callbacks = {};
        this.cache = { scores: {}, cards: [] };
        this.previousSnapshot = null;
    }

    start(instrument, callbacks = {}) {
        this.instrument = instrument;
        this.callbacks = callbacks;
        this.manualOverrides = callbacks.initialOverrides || {};
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.poll();
        this.intervalId = setInterval(() => this.poll(), 10000);
    }

    setOverrides(overrides) {
        this.manualOverrides = overrides || {};
        if (this.lastRawData) {
            this.parse(this.lastRawData, this.lastCurrentLtp, this.manualOverrides);
            this.register();
            this.publish();
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async poll() {
        if (!this.instrument) return;
        
        const currentLtp = this.callbacks.getLtp ? this.callbacks.getLtp() : '';
        try {
            const res = await axiosInstance.get(`/api/v1/upstox/technicals?instrument=${this.instrument}&timeframe=day&ltp=${currentLtp}`);
            if (res.data?.success && res.data?.data) {
                this.lastRawData = res.data.data;
                this.lastCurrentLtp = currentLtp;
                this.parse(this.lastRawData, currentLtp, this.manualOverrides);
                this.register();
                this.publish();
            }
        } catch (e) {
            console.error("TechnicalEngine poll failed", e);
        }
    }

    parse(rawData, currentPrice, manualOverrides = {}) {
        this.previousSnapshot = this.cache;
        this.cache = parseHeadlessTechnicals(rawData, currentPrice, manualOverrides);
    }

    register() {
        if (this.callbacks.registerBulk && this.cache.cards) {
            const registryPayload = this.cache.cards.map(c => {
                const payload = {
                    id: c.id,
                    value: c.value,
                    score: c.score,
                    hasLiveData: c.hasLiveData
                };
                if (!c.hasLiveData) {
                    payload.status = c.status;
                    payload.reason = c.reason;
                    payload.source = c.source;
                    payload.lastAttempt = c.lastAttempt;
                    payload.retryAfter = c.retryAfter;
                    payload.supportsRealtime = c.supportsRealtime;
                    payload.appliesTo = c.appliesTo;
                    payload.severity = c.severity;
                }
                return payload;
            });
            this.callbacks.registerBulk('technical', registryPayload);
        }
    }

    publish() {
        if (this.callbacks.onUpdate) {
            this.callbacks.onUpdate(this.state());
        }
    }

    dispose() {
        this.stop();
        this.cache = { scores: {}, cards: [] };
        this.previousSnapshot = null;
        this.callbacks = {};
    }

    state() {
        return this.cache;
    }
}
