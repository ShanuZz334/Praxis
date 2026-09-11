import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decrypt } from './utils/encryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, 'cache');
const STATE_FILE = path.join(CACHE_DIR, 'quotaUsage.json');

function getUtcTodayStr() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

export function to12HourTime(str) {
    if (!str || typeof str !== 'string') return str || '';
    if (/\b(AM|PM)\b/i.test(str)) return str;
    return str.replace(/(\b\d{1,2}):(\d{2})(?::(\d{2}))?\b/g, (match, h, m, s) => {
        let hour = parseInt(h, 10);
        if (hour >= 24) return match;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return s !== undefined ? `${hour}:${m}:${s} ${ampm}` : `${hour}:${m} ${ampm}`;
    });
}

function getTimeToMidnight(timeZone) {
    try {
        const now = new Date();
        const invDate = new Date(now.toLocaleString('en-US', { timeZone }));
        const nextMidnight = new Date(invDate);
        nextMidnight.setHours(24, 0, 0, 0);
        const diffMs = Math.max(0, nextMidnight.getTime() - invDate.getTime());
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        return {
            diffMs,
            str: `${hours}h ${mins}m ${secs}s`,
            shortStr: `${hours}h ${mins}m`,
            targetIso: new Date(now.getTime() + diffMs).toISOString()
        };
    } catch (e) {
        return { diffMs: 0, str: '0h 0m 0s', shortStr: '0h 0m', targetIso: new Date().toISOString() };
    }
}

class AiQuotaTracker {
    constructor() {
        this.state = {
            date: getUtcTodayStr(),
            usage: {},
            groqLiveHeaders: null,
            groq2LiveHeaders: null,
            openrouterLiveHeaders: null,
            openrouter2LiveHeaders: null,
            geminiLiveHeaders: null
        };
        this.openrouterKeyCache = {
            openrouter: { timestamp: 0, data: null },
            openrouter_2: { timestamp: 0, data: null }
        };
        this.loadState();
    }

    loadState() {
        try {
            if (!fs.existsSync(CACHE_DIR)) {
                fs.mkdirSync(CACHE_DIR, { recursive: true });
            }
            if (fs.existsSync(STATE_FILE)) {
                const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
                if (data.date === getUtcTodayStr()) {
                    this.state = data;
                } else {
                    this.state = {
                        date: getUtcTodayStr(),
                        usage: {},
                        groqLiveHeaders: data.groqLiveHeaders || null,
                        groq2LiveHeaders: data.groq2LiveHeaders || null,
                        openrouterLiveHeaders: data.openrouterLiveHeaders || null,
                        openrouter2LiveHeaders: data.openrouter2LiveHeaders || null,
                        geminiLiveHeaders: data.geminiLiveHeaders || null
                    };
                    this.saveState();
                }
            }
        } catch (e) {
            console.error('[aiQuotaTracker] Failed to load state:', e.message);
        }
    }

    saveState() {
        try {
            if (!fs.existsSync(CACHE_DIR)) {
                fs.mkdirSync(CACHE_DIR, { recursive: true });
            }
            fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
        } catch (e) {
            console.error('[aiQuotaTracker] Failed to save state:', e.message);
        }
    }

    recordUsage({ provider, model, tokensIn = 0, tokensOut = 0 }) {
        if (!provider || !model) return;
        const today = getUtcTodayStr();
        if (this.state.date !== today) {
            this.state.date = today;
            this.state.usage = {};
        }

        const key = `${provider}::${model}`;
        if (!this.state.usage[key]) {
            this.state.usage[key] = {
                requests: 0,
                tokensIn: 0,
                tokensOut: 0,
                lastCalled: null
            };
        }

        this.state.usage[key].requests += 1;
        this.state.usage[key].tokensIn += (tokensIn || 0);
        this.state.usage[key].tokensOut += (tokensOut || 0);
        this.state.usage[key].lastCalled = new Date().toISOString();

        this.saveState();
    }

    recordGroqHeaders(headers, providerId = 'groq') {
        if (!headers) return;
        try {
            const getHeader = (name) => {
                if (typeof headers.get === 'function') return headers.get(name);
                return headers[name] || headers[name.toLowerCase()] || null;
            };

            const limitReq = getHeader('x-ratelimit-limit-requests');
            const remainingReq = getHeader('x-ratelimit-remaining-requests');
            const resetReq = getHeader('x-ratelimit-reset-requests');
            const limitTok = getHeader('x-ratelimit-limit-tokens');
            const remainingTok = getHeader('x-ratelimit-remaining-tokens');
            const resetTok = getHeader('x-ratelimit-reset-tokens');

            if (limitReq || remainingReq) {
                const headerObj = {
                    limitRequests: limitReq ? parseInt(limitReq, 10) : 250,
                    remainingRequests: remainingReq ? parseInt(remainingReq, 10) : 250,
                    resetRequests: resetReq || 'Rolling window',
                    limitTokens: limitTok ? parseInt(limitTok, 10) : 70000,
                    remainingTokens: remainingTok ? parseInt(remainingTok, 10) : 70000,
                    resetTokens: resetTok || '8ms',
                    updatedAt: Date.now()
                };
                if (providerId === 'groq_2') {
                    this.state.groq2LiveHeaders = headerObj;
                } else {
                    this.state.groqLiveHeaders = headerObj;
                }
                this.saveState();
            }
        } catch (e) {
            console.error('[aiQuotaTracker] Failed to record Groq headers:', e.message);
        }
    }

    recordOpenRouterHeaders(headers, providerId = 'openrouter') {
        if (!headers) return;
        try {
            const getHeader = (name) => {
                if (typeof headers.get === 'function') return headers.get(name);
                return headers[name] || headers[name.toLowerCase()] || null;
            };

            const limit = getHeader('x-ratelimit-limit');
            const remaining = getHeader('x-ratelimit-remaining');
            const reset = getHeader('x-ratelimit-reset');

            if (limit !== null || remaining !== null) {
                const headerObj = {
                    limitRequests: limit ? parseInt(limit, 10) : 200,
                    remainingRequests: remaining !== null ? parseInt(remaining, 10) : 200,
                    resetTimestamp: reset ? (parseInt(reset, 10) > 10000000000 ? parseInt(reset, 10) : parseInt(reset, 10) * 1000) : null,
                    updatedAt: Date.now()
                };
                if (providerId === 'openrouter_2') {
                    this.state.openrouter2LiveHeaders = headerObj;
                } else {
                    this.state.openrouterLiveHeaders = headerObj;
                }
                this.saveState();
            }
        } catch (e) {
            console.error('[aiQuotaTracker] Failed to record OpenRouter headers:', e.message);
        }
    }

    recordGeminiHeaders(headers) {
        if (!headers) return;
        try {
            const getHeader = (name) => {
                if (typeof headers.get === 'function') return headers.get(name);
                return headers[name] || headers[name.toLowerCase()] || null;
            };

            const limitReq = getHeader('x-ratelimit-limit-requests') || getHeader('quota-limit');
            const remainingReq = getHeader('x-ratelimit-remaining-requests') || getHeader('quota-remaining');
            const resetReq = getHeader('x-ratelimit-reset-requests');
            const limitTok = getHeader('x-ratelimit-limit-tokens');
            const remainingTok = getHeader('x-ratelimit-remaining-tokens');

            if (limitReq || remainingReq) {
                this.state.geminiLiveHeaders = {
                    limitRequests: limitReq ? parseInt(limitReq, 10) : 1500,
                    remainingRequests: remainingReq ? parseInt(remainingReq, 10) : 1500,
                    resetRequests: resetReq ? to12HourTime(resetReq) : '12:00 AM PT',
                    limitTokens: limitTok ? parseInt(limitTok, 10) : 1000000,
                    remainingTokens: remainingTok ? parseInt(remainingTok, 10) : 1000000,
                    updatedAt: Date.now()
                };
                this.saveState();
            }
        } catch (e) {
            console.error('[aiQuotaTracker] Failed to record Gemini headers:', e.message);
        }
    }

    async getOpenRouterKeyData(provider) {
        if (!provider || !provider.apiKey) return null;
        const pId = provider.providerId || 'openrouter';
        const now = Date.now();
        if (!this.openrouterKeyCache) this.openrouterKeyCache = {};
        if (this.openrouterKeyCache[pId] && (now - this.openrouterKeyCache[pId].timestamp < 60000)) {
            return this.openrouterKeyCache[pId].data;
        }

        try {
            let apiKey = provider.apiKey;
            if (apiKey.includes(':') || apiKey.length > 60) {
                try {
                    apiKey = decrypt(apiKey);
                } catch (_) {}
            }

            const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: { 'Authorization': `Bearer ${apiKey}` },
                signal: AbortSignal.timeout(4000)
            });

            if (res.ok) {
                const json = await res.json();
                this.openrouterKeyCache[pId] = {
                    timestamp: now,
                    data: json.data || null
                };
                return this.openrouterKeyCache[pId].data;
            }
        } catch (e) {
            // Silently fall back to cached
        }
        return this.openrouterKeyCache[pId]?.data || null;
    }

    async checkOllamaStatus(baseUrl = 'http://localhost:11434') {
        try {
            const res = await fetch(`${baseUrl}/api/tags`, {
                signal: AbortSignal.timeout(2000)
            });
            if (res.ok) {
                const data = await res.json();
                return { isOnline: true, models: data.models || [] };
            }
        } catch (_) {}
        return { isOnline: false, models: [] };
    }

    async computeQuotas(providers = []) {
        const today = getUtcTodayStr();
        if (this.state.date !== today) {
            this.state.date = today;
            this.state.usage = {};
            this.saveState();
        }

        const utcReset = getTimeToMidnight('UTC');
        const ptReset = getTimeToMidnight('America/Los_Angeles');
        const cstReset = getTimeToMidnight('Asia/Shanghai');

        const openrouterProv = providers.find(p => p.providerId === 'openrouter');
        const openrouter2Prov = providers.find(p => p.providerId === 'openrouter_2');
        const openrouterKeyData = openrouterProv ? await this.getOpenRouterKeyData(openrouterProv) : null;
        const openrouter2KeyData = openrouter2Prov ? await this.getOpenRouterKeyData(openrouter2Prov) : null;

        const ollamaProv = providers.find(p => p.providerId === 'ollama');
        const ollamaUrl = ollamaProv?.baseUrl || 'http://localhost:11434';
        const ollamaHealth = await this.checkOllamaStatus(ollamaUrl);

        const quotaMap = {};

        for (const p of providers) {
            const pId = p.providerId;
            const models = p.models || {};

            for (const [tier, modelId] of Object.entries(models)) {
                if (!modelId || typeof modelId !== 'string' || !modelId.trim()) continue;
                const cleanModel = modelId.trim();
                const slotKey = `${pId}::${tier}::${cleanModel.toLowerCase()}`;
                const usageKey = `${pId}::${cleanModel}`;
                const usage = this.state.usage[usageKey] || { requests: 0, tokensIn: 0, tokensOut: 0 };

                let quotaInfo = {
                    slotKey,
                    providerId: pId,
                    modelId: cleanModel,
                    tier,
                    requestsToday: usage.requests,
                    tokensToday: usage.tokensIn + usage.tokensOut,
                    lastCalled: usage.lastCalled || null
                };

                if (pId.startsWith('groq')) {
                    const gh = pId === 'groq_2' ? (this.state.groq2LiveHeaders || this.state.groqLiveHeaders) : this.state.groqLiveHeaders;
                    const limit = gh?.limitRequests || 1000;
                    let remaining = gh?.remainingRequests !== undefined ? gh.remainingRequests : limit;

                    if (gh && gh.updatedAt && (Date.now() - gh.updatedAt > 15 * 60 * 1000)) {
                        remaining = limit;
                    }

                    const remainingPercent = Math.max(0, Math.min(100, Math.round((remaining / limit) * 100)));
                    quotaInfo = {
                        ...quotaInfo,
                        limitRequests: limit,
                        remainingRequests: remaining,
                        remainingPercent,
                        resetType: 'rolling',
                        resetTimeStr: gh?.resetRequests || 'Rolling window',
                        resetSchedule: 'Rolling Rate Limit Window',
                        isLiveHeader: !!gh,
                        status: 'Active'
                    };
                } else if (pId.startsWith('openrouter')) {
                    const keyData = pId === 'openrouter_2' ? (openrouter2KeyData || openrouterKeyData) : openrouterKeyData;
                    const orLive = pId === 'openrouter_2' ? (this.state.openrouter2LiveHeaders || this.state.openrouterLiveHeaders) : this.state.openrouterLiveHeaders;
                    const limit = orLive?.limitRequests || (keyData?.limit !== undefined && keyData?.limit !== null ? keyData.limit : 200);
                    const remaining = orLive?.remainingRequests !== undefined ? orLive.remainingRequests : Math.max(0, limit - usage.requests);
                    const remainingPercent = Math.max(0, Math.min(100, Math.round((remaining / limit) * 100)));

                    quotaInfo = {
                        ...quotaInfo,
                        limitRequests: limit,
                        remainingRequests: remaining,
                        remainingPercent,
                        resetType: 'daily',
                        resetTimezone: 'UTC',
                        resetSchedule: 'Daily @ 12:00 AM UTC',
                        resetTimeStr: utcReset.shortStr,
                        resetCountdownSec: Math.floor(utcReset.diffMs / 1000),
                        resetTimestamp: Date.now() + utcReset.diffMs,
                        isFreeTier: keyData?.is_free_tier ?? true,
                        accountUsage: keyData?.usage_daily ?? 0,
                        status: 'Active'
                    };
                } else if (pId.startsWith('gemini')) {
                    const isLite = cleanModel.toLowerCase().includes('lite');
                    const limit = isLite ? 1000 : 1500;
                    const remaining = Math.max(0, limit - usage.requests);
                    const remainingPercent = Math.max(0, Math.min(100, Math.round((remaining / limit) * 100)));

                    quotaInfo = {
                        ...quotaInfo,
                        limitRequests: limit,
                        remainingRequests: remaining,
                        remainingPercent,
                        resetType: 'daily',
                        resetTimezone: 'Pacific Time (PT)',
                        resetSchedule: 'Daily @ 12:00 AM PT',
                        resetTimeStr: ptReset.shortStr,
                        resetCountdownSec: Math.floor(ptReset.diffMs / 1000),
                        resetTimestamp: Date.now() + ptReset.diffMs,
                        rpmLimit: 15,
                        tpmLimit: 1000000,
                        status: 'Active'
                    };
                } else if (pId.startsWith('zai')) {
                    const limit = 100;
                    const remaining = Math.max(0, limit - usage.requests);
                    const remainingPercent = Math.max(0, Math.min(100, Math.round((remaining / limit) * 100)));

                    quotaInfo = {
                        ...quotaInfo,
                        limitRequests: limit,
                        remainingRequests: remaining,
                        remainingPercent,
                        resetType: 'daily',
                        resetTimezone: 'CST (UTC+8)',
                        resetSchedule: 'Daily @ 12:00 AM CST',
                        resetTimeStr: cstReset.shortStr,
                        resetCountdownSec: Math.floor(cstReset.diffMs / 1000),
                        resetTimestamp: Date.now() + cstReset.diffMs,
                        status: 'Active'
                    };
                } else if (pId.startsWith('ollama')) {
                    quotaInfo = {
                        ...quotaInfo,
                        limitRequests: 'Unlimited (Local)',
                        remainingRequests: 'Unlimited',
                        remainingPercent: ollamaHealth.isOnline ? 100 : 0,
                        resetType: 'continuous',
                        resetTimezone: 'Local Compute',
                        resetSchedule: 'Continuous On-Device',
                        resetTimeStr: ollamaHealth.isOnline ? 'Local' : 'Offline',
                        status: ollamaHealth.isOnline ? 'Online' : 'Offline'
                    };
                } else {
                    quotaInfo = {
                        ...quotaInfo,
                        limitRequests: 500,
                        remainingRequests: Math.max(0, 500 - usage.requests),
                        remainingPercent: Math.max(0, Math.min(100, Math.round(((500 - usage.requests) / 500) * 100))),
                        resetType: 'daily',
                        resetSchedule: 'Daily @ 12:00 AM UTC',
                        resetTimeStr: utcReset.shortStr,
                        resetTimestamp: Date.now() + utcReset.diffMs,
                        status: 'Active'
                    };
                }

                quotaMap[slotKey] = quotaInfo;
            }
        }

        if (ollamaHealth.isOnline && ollamaHealth.models.length > 0) {
            ollamaHealth.models.forEach(m => {
                const cleanId = m.name.trim();
                const slotKey = `ollama::local::${cleanId.toLowerCase()}`;
                const usageKey = `ollama::${cleanId}`;
                const usage = this.state.usage[usageKey] || { requests: 0, tokensIn: 0, tokensOut: 0 };
                quotaMap[slotKey] = {
                    slotKey,
                    providerId: 'ollama',
                    modelId: cleanId,
                    tier: 'Local Compute',
                    requestsToday: usage.requests,
                    tokensToday: usage.tokensIn + usage.tokensOut,
                    limitRequests: 'Unlimited (Local)',
                    remainingRequests: 'Unlimited',
                    remainingPercent: 100,
                    resetType: 'continuous',
                    resetSchedule: 'Continuous On-Device',
                    resetTimeStr: 'Local',
                    status: 'Online'
                };
            });
        }

        return {
            date: today,
            timezones: {
                utc: utcReset,
                pt: ptReset,
                cst: cstReset
            },
            quotas: quotaMap
        };
    }

    async getGatewayStatus(providers = []) {
        const today = getUtcTodayStr();
        const utcReset = getTimeToMidnight('UTC');
        const ptReset = getTimeToMidnight('America/Los_Angeles');
        const cstReset = getTimeToMidnight('Asia/Shanghai');

        const groqProv = providers.find(p => p.providerId === 'groq');
        const groq2Prov = providers.find(p => p.providerId === 'groq_2');
        const openrouterProv = providers.find(p => p.providerId === 'openrouter');
        const openrouter2Prov = providers.find(p => p.providerId === 'openrouter_2');
        const geminiProv = providers.find(p => p.providerId === 'gemini');
        const zaiProv = providers.find(p => p.providerId === 'zai');
        const ollamaProv = providers.find(p => p.providerId === 'ollama');

        const openrouterKeyData = openrouterProv ? await this.getOpenRouterKeyData(openrouterProv) : null;
        const openrouter2KeyData = openrouter2Prov ? await this.getOpenRouterKeyData(openrouter2Prov) : null;

        const ollamaUrl = ollamaProv?.baseUrl || 'http://localhost:11434';
        const ollamaHealth = await this.checkOllamaStatus(ollamaUrl);

        // Calculate usage today per provider
        const providerUsage = {};
        for (const [key, usage] of Object.entries(this.state.usage)) {
            const pId = key.split('::')[0];
            if (!providerUsage[pId]) {
                providerUsage[pId] = { requests: 0, tokensIn: 0, tokensOut: 0 };
            }
            providerUsage[pId].requests += usage.requests || 0;
            providerUsage[pId].tokensIn += usage.tokensIn || 0;
            providerUsage[pId].tokensOut += usage.tokensOut || 0;
        }

        // 1. Groq Gateway Metrics (Primary)
        const gh = this.state.groqLiveHeaders;
        const groqLimitReq = gh?.limitRequests || 1000;
        let groqRemReq = gh?.remainingRequests !== undefined ? gh.remainingRequests : groqLimitReq;
        if (gh && gh.updatedAt && (Date.now() - gh.updatedAt > 15 * 60 * 1000)) {
            groqRemReq = groqLimitReq; // Rolling window replenished
        }
        const groqLimitTok = gh?.limitTokens || 8000;
        let groqRemTok = gh?.remainingTokens !== undefined ? gh.remainingTokens : groqLimitTok;
        if (gh && gh.updatedAt && (Date.now() - gh.updatedAt > 15 * 60 * 1000)) {
            groqRemTok = groqLimitTok;
        }
        const groqReqPercent = Math.max(0, Math.min(100, Math.round((groqRemReq / groqLimitReq) * 100)));
        const groqTokPercent = Math.max(0, Math.min(100, Math.round((groqRemTok / groqLimitTok) * 100)));

        // 2. Groq 2 Gateway Metrics (Load Balancer)
        const gh2 = this.state.groq2LiveHeaders || this.state.groqLiveHeaders;
        const groq2LimitReq = gh2?.limitRequests || 1000;
        const groq2Used = providerUsage.groq_2?.requests || 0;
        let groq2RemReq = this.state.groq2LiveHeaders?.remainingRequests !== undefined 
            ? this.state.groq2LiveHeaders.remainingRequests 
            : Math.max(0, groq2LimitReq - groq2Used);
        if (this.state.groq2LiveHeaders?.updatedAt && (Date.now() - this.state.groq2LiveHeaders.updatedAt > 15 * 60 * 1000)) {
            groq2RemReq = groq2LimitReq;
        }
        const groq2LimitTok = gh2?.limitTokens || 8000;
        let groq2RemTok = this.state.groq2LiveHeaders?.remainingTokens !== undefined 
            ? this.state.groq2LiveHeaders.remainingTokens 
            : groq2LimitTok;
        if (this.state.groq2LiveHeaders?.updatedAt && (Date.now() - this.state.groq2LiveHeaders.updatedAt > 15 * 60 * 1000)) {
            groq2RemTok = groq2LimitTok;
        }
        const groq2ReqPercent = Math.max(0, Math.min(100, Math.round((groq2RemReq / groq2LimitReq) * 100)));
        const groq2TokPercent = Math.max(0, Math.min(100, Math.round((groq2RemTok / groq2LimitTok) * 100)));

        // 3. OpenRouter 1 Gateway Metrics
        const orLive = this.state.openrouterLiveHeaders;
        const orUsedToday = providerUsage.openrouter?.requests || 0;
        const orLimit = orLive?.limitRequests || (openrouterKeyData?.limit !== undefined && openrouterKeyData.limit !== null ? openrouterKeyData.limit : 50);
        const orRemReq = orLive?.remainingRequests !== undefined 
            ? orLive.remainingRequests 
            : Math.max(0, orLimit - orUsedToday);
        const orReqPercent = Math.max(0, Math.min(100, Math.round((orRemReq / orLimit) * 100)));
        const orResetTs = orLive?.resetTimestamp || (Date.now() + utcReset.diffMs);

        // 4. OpenRouter 2 Gateway Metrics (Secondary)
        const or2Live = this.state.openrouter2LiveHeaders;
        const or2UsedToday = providerUsage.openrouter_2?.requests || 0;
        const or2Limit = or2Live?.limitRequests || (openrouter2KeyData?.limit !== undefined && openrouter2KeyData.limit !== null ? openrouter2KeyData.limit : 50);
        const or2RemReq = or2Live?.remainingRequests !== undefined 
            ? or2Live.remainingRequests 
            : Math.max(0, or2Limit - or2UsedToday);
        const or2ReqPercent = Math.max(0, Math.min(100, Math.round((or2RemReq / or2Limit) * 100)));
        const or2ResetTs = or2Live?.resetTimestamp || (Date.now() + utcReset.diffMs);

        // 5. Gemini Gateway Metrics
        const gemLive = this.state.geminiLiveHeaders;
        const gemUsedToday = providerUsage.gemini?.requests || 0;
        const gemLimit = gemLive?.limitRequests || 1500;
        const gemRemReq = gemLive?.remainingRequests !== undefined
            ? gemLive.remainingRequests
            : Math.max(0, gemLimit - gemUsedToday);
        const gemReqPercent = Math.max(0, Math.min(100, Math.round((gemRemReq / gemLimit) * 100)));
        const gemRemTok = gemLive?.remainingTokens !== undefined ? gemLive.remainingTokens : 1000000;
        const gemLimitTok = gemLive?.limitTokens || 1000000;
        const gemTokPercent = Math.max(0, Math.min(100, Math.round((gemRemTok / gemLimitTok) * 100)));

        // 6. Z.AI Gateway Metrics
        const zaiUsedToday = providerUsage.zai?.requests || 0;
        const zaiLimit = 100;
        const zaiRemReq = Math.max(0, zaiLimit - zaiUsedToday);
        const zaiReqPercent = Math.max(0, Math.min(100, Math.round((zaiRemReq / zaiLimit) * 100)));

        return {
            success: true,
            timestamp: new Date().toISOString(),
            date: today,
            providers: {
                groq: {
                    id: 'groq',
                    name: 'Groq LPU',
                    type: 'Cloud Accelerated',
                    remainingRequests: groqRemReq,
                    limitRequests: groqLimitReq,
                    requestsPercent: groqReqPercent,
                    remainingTokens: groqRemTok,
                    limitTokens: groqLimitTok,
                    tokensPercent: groqTokPercent,
                    resetSchedule: 'Rolling Rate Limit Window',
                    resetCountdown: gh?.resetRequests || '10m window',
                    resetType: 'rolling',
                    isLiveHeader: !!gh,
                    status: groqProv && groqProv.isEnabled !== false ? 'Online' : 'Offline'
                },
                groq_2: {
                    id: 'groq_2',
                    name: 'Groq 2',
                    type: 'Load Balancer',
                    remainingRequests: groq2RemReq,
                    limitRequests: groq2LimitReq,
                    requestsPercent: groq2ReqPercent,
                    remainingTokens: groq2RemTok,
                    limitTokens: groq2LimitTok,
                    tokensPercent: groq2TokPercent,
                    resetSchedule: 'Rolling Rate Limit Window',
                    resetCountdown: gh2?.resetRequests || '10m window',
                    resetType: 'rolling',
                    isLiveHeader: !!this.state.groq2LiveHeaders,
                    status: groq2Prov && groq2Prov.isEnabled !== false ? 'Online' : 'Offline'
                },
                openrouter: {
                    id: 'openrouter',
                    name: 'OpenRouter',
                    type: 'Multi-Provider Mesh',
                    remainingRequests: orRemReq,
                    limitRequests: orLimit,
                    requestsPercent: orReqPercent,
                    requestsUsedToday: orUsedToday,
                    resetSchedule: 'Daily @ 12:00 AM UTC',
                    resetCountdown: utcReset.shortStr,
                    resetTimestamp: orResetTs,
                    resetType: 'daily',
                    isFreeTier: openrouterKeyData?.is_free_tier ?? true,
                    accountUsage: openrouterKeyData?.usage_daily ?? 0,
                    status: openrouterProv && openrouterProv.isEnabled !== false ? 'Online' : 'Offline'
                },
                openrouter_2: {
                    id: 'openrouter_2',
                    name: 'OpenRouter 2',
                    type: 'Secondary Mesh',
                    remainingRequests: or2RemReq,
                    limitRequests: or2Limit,
                    requestsPercent: or2ReqPercent,
                    requestsUsedToday: or2UsedToday,
                    resetSchedule: 'Daily @ 12:00 AM UTC',
                    resetCountdown: utcReset.shortStr,
                    resetTimestamp: or2ResetTs,
                    resetType: 'daily',
                    isFreeTier: openrouter2KeyData?.is_free_tier ?? true,
                    accountUsage: openrouter2KeyData?.usage_daily ?? 0,
                    status: openrouter2Prov && openrouter2Prov.isEnabled !== false ? 'Online' : 'Offline'
                },
                gemini: {
                    id: 'gemini',
                    name: 'Google Gemini',
                    type: 'Multimodal Cognitive',
                    remainingRequests: gemRemReq,
                    limitRequests: gemLimit,
                    requestsPercent: gemReqPercent,
                    requestsUsedToday: gemUsedToday,
                    remainingTokens: gemRemTok,
                    limitTokens: gemLimitTok,
                    tokensPercent: gemTokPercent,
                    resetSchedule: 'Daily @ 12:00 AM PT',
                    resetCountdown: ptReset.shortStr,
                    resetTimestamp: Date.now() + ptReset.diffMs,
                    resetType: 'daily',
                    status: geminiProv && geminiProv.isEnabled !== false ? 'Online' : 'Offline'
                },
                zai: {
                    id: 'zai',
                    name: 'Z.AI (Zhipu)',
                    type: 'High Concurrency LLM',
                    remainingRequests: zaiRemReq,
                    limitRequests: zaiLimit,
                    requestsPercent: zaiReqPercent,
                    requestsUsedToday: zaiUsedToday,
                    resetSchedule: 'Daily @ 12:00 AM CST',
                    resetCountdown: cstReset.shortStr,
                    resetTimestamp: Date.now() + cstReset.diffMs,
                    resetType: 'daily',
                    status: zaiProv && zaiProv.isEnabled !== false ? 'Online' : 'Offline'
                },
                ollama: {
                    id: 'ollama',
                    name: 'Local Ollama',
                    type: 'On-Device Private',
                    remainingRequests: 'Unlimited',
                    limitRequests: 'Unlimited (Local)',
                    requestsPercent: ollamaHealth.isOnline ? 100 : 0,
                    resetSchedule: 'Continuous Local Compute',
                    resetCountdown: 'Continuous',
                    resetType: 'continuous',
                    modelCount: ollamaHealth.models?.length || 0,
                    models: ollamaHealth.models?.map(m => m.name) || [],
                    status: ollamaHealth.isOnline ? 'Online' : 'Offline'
                }
            }
        };
    }
}

export const aiQuotaTracker = new AiQuotaTracker();
export default aiQuotaTracker;
