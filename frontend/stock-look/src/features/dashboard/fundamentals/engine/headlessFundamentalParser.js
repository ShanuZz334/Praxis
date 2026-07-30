import axiosInstance from '../../../../shared/utils/axiosInstance';
import { API_PATHS } from '../../../../shared/utils/apiPaths';

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
} from './scoringEngine';

import { CARD_REGISTRY } from '../../../../shared/config/cardRegistry';

function parseHeadlessFundamentals(rawFundamentals, manualOverrides = {}) {
    const scores = {};
    const cards = [];
    
    const ratios = rawFundamentals && Array.isArray(rawFundamentals.ratios) ? rawFundamentals.ratios : [];
    
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

    const attemptComputation = (id) => {
        let overrideVal = manualOverrides[id];
        let useOverride = overrideVal !== undefined && overrideVal !== null && overrideVal !== '';

        if (!rawFundamentals && !useOverride) return { success: false, reason: "No upstream data" };
        
        switch (id) {
            case 'pe_ratio': {
                if (useOverride) return { success: true, value: overrideVal, score: scorePERatio(overrideVal, null, null).score };
                const r = getRatio('p/e', 'price to earnings');
                if (r.value !== null) return { success: true, value: r.value, score: scorePERatio(r.value, null, r.sector).score };
                break;
            }
            case 'pb_ratio': {
                if (useOverride) return { success: true, value: overrideVal, score: scorePBRatio(overrideVal, null, null).score };
                const r = getRatio('p/b', 'price to book');
                if (r.value !== null) return { success: true, value: r.value, score: scorePBRatio(r.value, null, r.sector).score };
                break;
            }
            case 'ev_ebitda': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreEVEbitda(overrideVal, null).score };
                const r = getRatio('ev/ebitda', 'enterprise value to ebitda');
                if (r.value !== null) return { success: true, value: r.value, score: scoreEVEbitda(r.value, r.sector).score };
                break;
            }
            case 'roe': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreROE(overrideVal, null).score };
                const r = getRatio('return on equity', 'roe');
                if (r.value !== null) return { success: true, value: r.value, score: scoreROE(r.value, r.sector).score };
                break;
            }
            case 'roa': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreROA(overrideVal, null).score };
                const r = getRatio('return on assets', 'roa');
                if (r.value !== null) return { success: true, value: r.value, score: scoreROA(r.value, r.sector).score };
                break;
            }
            case 'roce': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreROCE(overrideVal, null).score };
                const r = getRatio('return on capital employed', 'roce');
                if (r.value !== null) return { success: true, value: r.value, score: scoreROCE(r.value, r.sector).score };
                break;
            }
            case 'operating_margin': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreOperatingMargin(overrideVal, null).score };
                const r = getRatio('operating margin');
                if (r.value !== null) return { success: true, value: r.value, score: scoreOperatingMargin(r.value, r.sector).score };
                break;
            }
            case 'fii_dii_flow': {
                const fiiDii = rawFundamentals?.fii_dii_flow;
                if (fiiDii && Array.isArray(fiiDii)) {
                    const sorted = [...fiiDii].sort((a, b) => new Date(b.date) - new Date(a.date));
                    if (sorted.length > 0) {
                        const latest = sorted[0];
                        return { success: true, value: null, score: scoreInstitutionalFlow(parseFloat(latest.fii_net) || 0, parseFloat(latest.dii_net) || 0).score };
                    }
                }
                break;
            }
            case 'net_margin': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreNetMargin(overrideVal, null).score };
                const r = getRatio('net margin', 'net profit margin', 'profit margin');
                if (r.value !== null) return { success: true, value: r.value, score: scoreNetMargin(r.value, r.sector).score };
                break;
            }
            case 'debt_to_equity': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreDebtToEquity(overrideVal, null).score };
                const r = getRatio('debt to equity', 'debt/equity', 'debt equity');
                if (r.value !== null) return { success: true, value: r.value, score: scoreDebtToEquity(r.value, r.sector).score };
                break;
            }
            case 'current_ratio': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreCurrentRatio(overrideVal).score };
                const r = getRatio('current ratio');
                if (r.value !== null) return { success: true, value: r.value, score: scoreCurrentRatio(r.value).score };
                break;
            }
            case 'interest_coverage': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreInterestCoverage(overrideVal, null).score };
                const r = getRatio('interest coverage', 'interest coverage ratio');
                if (r.value !== null) return { success: true, value: r.value, score: scoreInterestCoverage(r.value, r.sector).score };
                break;
            }
            case 'dividend_yield': {
                if (useOverride) return { success: true, value: overrideVal, score: scoreDividendYield(overrideVal, null).score };
                const r = getRatio('dividend yield');
                if (r.value !== null) return { success: true, value: r.value, score: scoreDividendYield(r.value, null).score };
                break;
            }
        }
        return { success: false, reason: "Data missing in Upstox response or calculation failed" };
    };

    Object.values(CARD_REGISTRY).forEach(cardConfig => {
        if (cardConfig.page?.toLowerCase() !== 'fundamentals') return;
        if (cardConfig.type === 'widget') return;

        const result = attemptComputation(cardConfig.id);
        
        if (result.success) {
            scores[cardConfig.id] = result.score;
            cards.push({
                id: cardConfig.id,
                displayName: cardConfig.displayName,
                value: result.value,
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


export class FundamentalEngine {
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
            this.parse(this.lastRawData, this.manualOverrides);
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
        
        try {
            const res = await axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(this.instrument));
            if (res.data?.success && res.data?.data) {
                this.lastRawData = res.data.data;
                this.parse(this.lastRawData, this.manualOverrides);
                this.register();
                this.publish();
            }
        } catch (e) {
            console.error("FundamentalEngine poll failed", e);
        }
    }

    parse(rawData, manualOverrides = {}) {
        this.previousSnapshot = this.cache;
        this.cache = parseHeadlessFundamentals(rawData, manualOverrides);
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
            this.callbacks.registerBulk('fundamental', registryPayload);
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
