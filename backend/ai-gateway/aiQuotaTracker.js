import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decrypt } from './utils/encryption.js';
import { sanitizeAiErrorMessage } from './utils/aiErrorSanitizer.js';
import { clearProviderCircuitBreaker } from './modelRouter.js';
import { broadcast } from '../services/socketBroadcast.js';

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

export function calculateRemainingPercent(remaining, limit) {
    if (typeof remaining !== 'number' || typeof limit !== 'number' || limit <= 0) return 100;
    if (remaining <= 0) return 0;
    if (remaining >= limit) return 100;
    const rawPct = (remaining / limit) * 100;
    // When requests are consumed, never round up to 100%
    if (rawPct >= 99 && rawPct < 100) {
        return Number(rawPct.toFixed(1));
    }
    return Math.max(0, Math.min(100, Math.round(rawPct)));
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
        this.liveHealth = {};
        this.healthPingCache = {};
        this._ollamaCache = { ts: 0, result: null };
        this.loadState();
        this.startPeriodicHealthCheck();
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

    recordRateLimitHit(providerId, errorMsg = '') {
        const pId = (providerId || '').toLowerCase();
        const now = Date.now();
        const utcReset = getTimeToMidnight('UTC');
        const ptReset = getTimeToMidnight('America/Los_Angeles');

        const sanitized = sanitizeAiErrorMessage(errorMsg, pId);

        if (!this.liveHealth) this.liveHealth = {};
        this.liveHealth[pId] = {
            status: 'exhausted',
            errorType: 'rate_limit',
            lastError: sanitized.cleanMessage,
            timestamp: now
        };

        try {
            broadcast("ai:limit_alert", {
                type: 'reached',
                providerId: pId,
                name: pId === 'groq' ? 'Groq' : pId === 'openrouter' ? 'OpenRouter' : pId === 'gemini' ? 'Gemini' : pId,
                message: sanitized.cleanMessage,
                reason: sanitized.reason,
                model: sanitized.model,
                retryAfter: sanitized.retryAfter,
                timestamp: now
            });
        } catch (_) {}

        if (pId === 'openrouter') {
            const resetTs = now + utcReset.diffMs;
            if (this.state.openrouterLiveHeaders) {
                this.state.openrouterLiveHeaders.remainingRequests = 0;
                this.state.openrouterLiveHeaders.resetTimestamp = resetTs;
                this.state.openrouterLiveHeaders.updatedAt = now;
            } else {
                this.state.openrouterLiveHeaders = { limitRequests: 50, remainingRequests: 0, resetTimestamp: resetTs, updatedAt: now };
            }
        } else if (pId === 'openrouter_2') {
            const resetTs = now + utcReset.diffMs;
            if (this.state.openrouter2LiveHeaders) {
                this.state.openrouter2LiveHeaders.remainingRequests = 0;
                this.state.openrouter2LiveHeaders.resetTimestamp = resetTs;
                this.state.openrouter2LiveHeaders.updatedAt = now;
            } else {
                this.state.openrouter2LiveHeaders = { limitRequests: 50, remainingRequests: 0, resetTimestamp: resetTs, updatedAt: now };
            }
        } else if (pId === 'groq') {
            const resetTs = now + 10 * 60 * 1000;
            if (this.state.groqLiveHeaders) {
                this.state.groqLiveHeaders.remainingRequests = 0;
                this.state.groqLiveHeaders.resetTimestamp = resetTs;
                this.state.groqLiveHeaders.updatedAt = now;
            }
        } else if (pId === 'groq_2') {
            const resetTs = now + 10 * 60 * 1000;
            if (this.state.groq2LiveHeaders) {
                this.state.groq2LiveHeaders.remainingRequests = 0;
                this.state.groq2LiveHeaders.resetTimestamp = resetTs;
                this.state.groq2LiveHeaders.updatedAt = now;
            }
        } else if (pId === 'gemini') {
            const resetTs = now + ptReset.diffMs;
            if (this.state.geminiLiveHeaders) {
                this.state.geminiLiveHeaders.remainingRequests = 0;
                this.state.geminiLiveHeaders.resetTimestamp = resetTs;
                this.state.geminiLiveHeaders.updatedAt = now;
            }
        }
        this.saveState();
    }

    recordAuthFailure(providerId, errorMsg = '') {
        const pId = (providerId || '').toLowerCase();
        if (!this.liveHealth) this.liveHealth = {};
        this.liveHealth[pId] = {
            status: 'auth_error',
            errorType: 'auth',
            lastError: errorMsg || 'Authentication failed (401/403)',
            timestamp: Date.now()
        };
    }

    recordSuccess(providerId, latencyMs = 0) {
        const pId = (providerId || '').toLowerCase();
        if (!this.liveHealth) this.liveHealth = {};
        
        this.liveHealth[pId] = {
            status: 'healthy',
            errorType: null,
            lastError: null,
            latencyMs,
            lastSuccessAt: Date.now(),
            timestamp: Date.now()
        };

        clearProviderCircuitBreaker(pId);

        let modified = false;
        if (pId === 'openrouter') {
            if (this.state.openrouterLiveHeaders && this.state.openrouterLiveHeaders.remainingRequests <= 0) {
                this.state.openrouterLiveHeaders.remainingRequests = this.state.openrouterLiveHeaders.limitRequests || 50;
                delete this.state.openrouterLiveHeaders.resetTimestamp;
                this.state.openrouterLiveHeaders.updatedAt = Date.now();
                modified = true;
            }
            if (this.openrouterKeyCache?.openrouter) {
                this.openrouterKeyCache.openrouter.timestamp = 0;
            }
        } else if (pId === 'openrouter_2') {
            if (this.state.openrouter2LiveHeaders && this.state.openrouter2LiveHeaders.remainingRequests <= 0) {
                this.state.openrouter2LiveHeaders.remainingRequests = this.state.openrouter2LiveHeaders.limitRequests || 50;
                delete this.state.openrouter2LiveHeaders.resetTimestamp;
                this.state.openrouter2LiveHeaders.updatedAt = Date.now();
                modified = true;
            }
            if (this.openrouterKeyCache?.openrouter_2) {
                this.openrouterKeyCache.openrouter_2.timestamp = 0;
            }
        } else if (pId === 'groq') {
            if (this.state.groqLiveHeaders && this.state.groqLiveHeaders.remainingRequests <= 0) {
                this.state.groqLiveHeaders.remainingRequests = this.state.groqLiveHeaders.limitRequests || 1000;
                this.state.groqLiveHeaders.updatedAt = Date.now();
                modified = true;
            }
        } else if (pId === 'groq_2') {
            if (this.state.groq2LiveHeaders && this.state.groq2LiveHeaders.remainingRequests <= 0) {
                this.state.groq2LiveHeaders.remainingRequests = this.state.groq2LiveHeaders.limitRequests || 1000;
                this.state.groq2LiveHeaders.updatedAt = Date.now();
                modified = true;
            }
        } else if (pId === 'gemini') {
            if (this.state.geminiLiveHeaders && this.state.geminiLiveHeaders.remainingRequests <= 0) {
                this.state.geminiLiveHeaders.remainingRequests = this.state.geminiLiveHeaders.limitRequests || 1500;
                this.state.geminiLiveHeaders.updatedAt = Date.now();
                modified = true;
            }
        }

        if (modified) {
            this.saveState();
        }
    }

    checkAndReplenishExpiredQuotas() {
        const now = Date.now();
        const utcReset = getTimeToMidnight('UTC');
        const ptReset = getTimeToMidnight('America/Los_Angeles');
        let modified = false;

        // 1. OpenRouter (Primary)
        if (this.state.openrouterLiveHeaders) {
            const orLive = this.state.openrouterLiveHeaders;
            const isExpired = orLive.resetTimestamp ? now >= orLive.resetTimestamp : (now - (orLive.updatedAt || 0) > 60000);
            if (isExpired && orLive.remainingRequests <= 0) {
                console.log('[aiQuotaTracker] Auto-replenishing OpenRouter quota (reset period reached).');
                orLive.remainingRequests = orLive.limitRequests || 50;
                orLive.resetTimestamp = now + utcReset.diffMs;
                orLive.updatedAt = now;
                if (this.liveHealth?.openrouter?.status === 'exhausted') {
                    delete this.liveHealth.openrouter;
                }
                clearProviderCircuitBreaker('openrouter');
                modified = true;
            }
        }

        // 2. OpenRouter 2 (Secondary)
        if (this.state.openrouter2LiveHeaders) {
            const or2Live = this.state.openrouter2LiveHeaders;
            const isExpired = or2Live.resetTimestamp ? now >= or2Live.resetTimestamp : (now - (or2Live.updatedAt || 0) > 60000);
            if (isExpired && or2Live.remainingRequests <= 0) {
                console.log('[aiQuotaTracker] Auto-replenishing OpenRouter 2 quota (reset period reached).');
                or2Live.remainingRequests = or2Live.limitRequests || 50;
                or2Live.resetTimestamp = now + utcReset.diffMs;
                or2Live.updatedAt = now;
                if (this.liveHealth?.openrouter_2?.status === 'exhausted') {
                    delete this.liveHealth.openrouter_2;
                }
                clearProviderCircuitBreaker('openrouter_2');
                modified = true;
            }
        }

        // 3. Groq (Primary) - 10-15m rolling window
        if (this.state.groqLiveHeaders) {
            const gh = this.state.groqLiveHeaders;
            const isExpired = gh.resetTimestamp ? now >= gh.resetTimestamp : ((now - (gh.updatedAt || 0)) > 10 * 60 * 1000);
            if (isExpired && gh.remainingRequests <= 0) {
                console.log('[aiQuotaTracker] Auto-replenishing Groq quota (rolling window reached).');
                gh.remainingRequests = gh.limitRequests || 1000;
                gh.remainingTokens = gh.limitTokens || 8000;
                delete gh.resetTimestamp;
                gh.updatedAt = now;
                if (this.liveHealth?.groq?.status === 'exhausted') {
                    delete this.liveHealth.groq;
                }
                clearProviderCircuitBreaker('groq');
                modified = true;
            }
        }

        // 4. Groq 2 (Load Balancer) - 10-15m rolling window
        if (this.state.groq2LiveHeaders) {
            const gh2 = this.state.groq2LiveHeaders;
            const isExpired = gh2.resetTimestamp ? now >= gh2.resetTimestamp : ((now - (gh2.updatedAt || 0)) > 10 * 60 * 1000);
            if (isExpired && gh2.remainingRequests <= 0) {
                console.log('[aiQuotaTracker] Auto-replenishing Groq 2 quota (rolling window reached).');
                gh2.remainingRequests = gh2.limitRequests || 1000;
                gh2.remainingTokens = gh2.limitTokens || 8000;
                delete gh2.resetTimestamp;
                gh2.updatedAt = now;
                if (this.liveHealth?.groq_2?.status === 'exhausted') {
                    delete this.liveHealth.groq_2;
                }
                clearProviderCircuitBreaker('groq_2');
                modified = true;
            }
        }

        // 5. Gemini - Midnight PT reset
        if (this.state.geminiLiveHeaders) {
            const gem = this.state.geminiLiveHeaders;
            const isExpired = gem.resetTimestamp ? now >= gem.resetTimestamp : ((now - (gem.updatedAt || 0)) > 24 * 3600 * 1000);
            if (isExpired && gem.remainingRequests <= 0) {
                console.log('[aiQuotaTracker] Auto-replenishing Gemini quota (midnight PT reached).');
                gem.remainingRequests = gem.limitRequests || 1500;
                gem.resetTimestamp = now + ptReset.diffMs;
                gem.updatedAt = now;
                if (this.liveHealth?.gemini?.status === 'exhausted') {
                    delete this.liveHealth.gemini;
                }
                clearProviderCircuitBreaker('gemini');
                modified = true;
            }
        }

        if (modified) {
            this.saveState();
        }
    }

    startPeriodicHealthCheck() {
        if (this._healthInterval) clearInterval(this._healthInterval);
        this._healthInterval = setInterval(async () => {
            try {
                this.checkAndReplenishExpiredQuotas();
                const { providerCache } = await import('./cache/providerCache.js');
                const providers = await providerCache.getProviders();
                if (Array.isArray(providers) && providers.length > 0) {
                    for (const p of providers) {
                        if (p.isActive) {
                            await this.pingProviderHealth(p, false).catch(() => {});
                        }
                    }
                }
            } catch (_) {}
        }, 45000);
        if (this._healthInterval?.unref) this._healthInterval.unref();
    }

    async pingProviderHealth(provider, forceRefresh = false) {
        if (!provider) return { status: 'offline', error: 'No provider config' };
        const pId = provider.providerId;
        const now = Date.now();

        if (!forceRefresh && this.healthPingCache[pId] && (now - this.healthPingCache[pId].timestamp < 30000)) {
            return this.healthPingCache[pId].result;
        }

        let result = { status: 'healthy', latencyMs: 0, error: null };
        const startTime = Date.now();

        try {
            if (provider.isActive === false) {
                result = { status: 'inactive', error: 'Provider is disabled' };
            } else if (pId === 'ollama') {
                const url = provider.baseUrl || 'http://localhost:11434';
                const status = await this.checkOllamaStatus(url);
                if (status.isOnline) {
                    result = { status: 'healthy', latencyMs: Date.now() - startTime, modelCount: status.models.length };
                    this.recordSuccess(pId, result.latencyMs);
                } else {
                    result = { status: 'offline', error: `Unreachable on ${url}` };
                    this.liveHealth[pId] = { status: 'offline', errorType: 'offline', lastError: result.error, timestamp: now };
                }
            } else if (pId.startsWith('openrouter')) {
                const keyData = await this.getOpenRouterKeyData(provider);
                const latency = Date.now() - startTime;
                if (!keyData && this.liveHealth[pId]?.status === 'auth_error') {
                    result = { status: 'auth_error', error: this.liveHealth[pId].lastError };
                } else {
                    result = { status: 'healthy', latencyMs: latency, keyData };
                    this.recordSuccess(pId, latency);
                }
            } else if (pId.startsWith('groq')) {
                let apiKey = provider.apiKey;
                if (apiKey && (apiKey.includes(':') || apiKey.length > 60)) {
                    try { apiKey = decrypt(apiKey); } catch (_) {}
                }
                const url = provider.baseUrl || 'https://api.groq.com/openai/v1';
                const endpoint = url.endsWith('/models') ? url : `${url}/models`;
                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                    signal: AbortSignal.timeout(3500)
                });
                const latency = Date.now() - startTime;
                this.recordGroqHeaders(res.headers, pId);
                if (res.status === 401 || res.status === 403) {
                    this.recordAuthFailure(pId, `[${res.status}] Invalid Groq API Key`);
                    result = { status: 'auth_error', error: 'Invalid API Key' };
                } else if (res.status === 429) {
                    this.recordRateLimitHit(pId, `[429] Groq Rate Limit Reached`);
                    result = { status: 'exhausted', error: 'Rate limit reached' };
                } else if (!res.ok) {
                    result = { status: 'cooling', error: `HTTP ${res.status}` };
                } else {
                    result = { status: 'healthy', latencyMs: latency };
                    this.recordSuccess(pId, latency);
                }
            } else if (pId.startsWith('gemini')) {
                let apiKey = provider.apiKey;
                if (apiKey && (apiKey.includes(':') || apiKey.length > 60)) {
                    try { apiKey = decrypt(apiKey); } catch (_) {}
                }
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const res = await fetch(endpoint, { signal: AbortSignal.timeout(3500) });
                const latency = Date.now() - startTime;
                this.recordGeminiHeaders(res.headers);
                if (res.status === 400 || res.status === 403 || res.status === 401) {
                    this.recordAuthFailure(pId, `[${res.status}] Invalid Gemini API Key`);
                    result = { status: 'auth_error', error: 'Invalid API Key' };
                } else if (res.status === 429) {
                    this.recordRateLimitHit(pId, `[429] Gemini Rate Limit Reached`);
                    result = { status: 'exhausted', error: 'Rate limit reached' };
                } else if (res.ok) {
                    result = { status: 'healthy', latencyMs: latency };
                    this.recordSuccess(pId, latency);
                } else {
                    result = { status: 'healthy', latencyMs: latency };
                }
            } else {
                result = { status: 'healthy', latencyMs: Date.now() - startTime };
                this.recordSuccess(pId, result.latencyMs);
            }
        } catch (err) {
            const isConn = err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed') || err.message.includes('timeout');
            result = {
                status: isConn ? 'offline' : 'cooling',
                error: err.message
            };
            if (isConn) {
                this.liveHealth[pId] = { status: 'offline', errorType: 'offline', lastError: err.message, timestamp: now };
            }
        }

        this.healthPingCache[pId] = { timestamp: now, result };
        return result;
    }

    async getOpenRouterKeyData(provider) {
        if (!provider || !provider.apiKey) return null;
        const pId = provider.providerId || 'openrouter';
        const now = Date.now();
        if (!this.openrouterKeyCache) this.openrouterKeyCache = {};
        if (this.openrouterKeyCache[pId] && (now - this.openrouterKeyCache[pId].timestamp < 45000)) {
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
                if (this.liveHealth[pId]?.status === 'auth_error') {
                    delete this.liveHealth[pId];
                }
                return this.openrouterKeyCache[pId].data;
            } else if (res.status === 401 || res.status === 403) {
                this.recordAuthFailure(pId, `[${res.status}] Invalid OpenRouter API Key`);
            } else if (res.status === 429) {
                this.recordRateLimitHit(pId, `[429] OpenRouter Rate Limit Exceeded`);
            }
        } catch (e) {
            // Silently fall back to cached
        }
        return this.openrouterKeyCache[pId]?.data || null;
    }

    async checkOllamaStatus(baseUrl = 'http://localhost:11434') {
        const now = Date.now();
        if (this._ollamaCache && (now - this._ollamaCache.ts < 15000)) {
            return this._ollamaCache.result;
        }
        try {
            const res = await fetch(`${baseUrl}/api/tags`, {
                signal: AbortSignal.timeout(600)
            });
            if (res.ok) {
                const data = await res.json();
                const result = { isOnline: true, models: data.models || [] };
                this._ollamaCache = { ts: now, result };
                return result;
            }
        } catch (_) {}
        const result = { isOnline: false, models: [] };
        this._ollamaCache = { ts: now, result };
        return result;
    }

    async computeQuotas(providers = []) {
        this.checkAndReplenishExpiredQuotas();
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

                    const remainingPercent = calculateRemainingPercent(remaining, limit);
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
                    const remainingPercent = calculateRemainingPercent(remaining, limit);

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
                    const remainingPercent = calculateRemainingPercent(remaining, limit);

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
                    const remainingPercent = calculateRemainingPercent(remaining, limit);

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
        this.checkAndReplenishExpiredQuotas();
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
        const groqReqPercent = calculateRemainingPercent(groqRemReq, groqLimitReq);
        const groqTokPercent = calculateRemainingPercent(groqRemTok, groqLimitTok);
        const groqResetTs = gh?.resetTimestamp || (gh?.updatedAt ? gh.updatedAt + 10 * 60 * 1000 : Date.now() + 10 * 60 * 1000);

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
        const groq2ReqPercent = calculateRemainingPercent(groq2RemReq, groq2LimitReq);
        const groq2TokPercent = calculateRemainingPercent(groq2RemTok, groq2LimitTok);
        const groq2ResetTs = gh2?.resetTimestamp || (gh2?.updatedAt ? gh2.updatedAt + 10 * 60 * 1000 : Date.now() + 10 * 60 * 1000);

        // 3. OpenRouter 1 Gateway Metrics
        const orLive = this.state.openrouterLiveHeaders;
        const orUsedToday = providerUsage.openrouter?.requests || 0;
        const orLimit = orLive?.limitRequests || (openrouterKeyData?.limit !== undefined && openrouterKeyData.limit !== null ? openrouterKeyData.limit : 50);
        const orRemReq = orLive?.remainingRequests !== undefined 
            ? orLive.remainingRequests 
            : Math.max(0, orLimit - orUsedToday);
        const orReqPercent = calculateRemainingPercent(orRemReq, orLimit);
        const orResetTs = (orLive?.resetTimestamp && orLive.resetTimestamp > Date.now()) ? orLive.resetTimestamp : (Date.now() + utcReset.diffMs);

        // 4. OpenRouter 2 Gateway Metrics (Secondary)
        const or2Live = this.state.openrouter2LiveHeaders;
        const or2UsedToday = providerUsage.openrouter_2?.requests || 0;
        const or2Limit = or2Live?.limitRequests || (openrouter2KeyData?.limit !== undefined && openrouter2KeyData.limit !== null ? openrouter2KeyData.limit : 50);
        const or2RemReq = or2Live?.remainingRequests !== undefined 
            ? or2Live.remainingRequests 
            : Math.max(0, or2Limit - or2UsedToday);
        const or2ReqPercent = calculateRemainingPercent(or2RemReq, or2Limit);
        const or2ResetTs = (or2Live?.resetTimestamp && or2Live.resetTimestamp > Date.now()) ? or2Live.resetTimestamp : (Date.now() + utcReset.diffMs);

        // 5. Gemini Gateway Metrics
        const gemLive = this.state.geminiLiveHeaders;
        const gemUsedToday = providerUsage.gemini?.requests || 0;
        const gemLimit = gemLive?.limitRequests || 1500;
        const gemRemReq = gemLive?.remainingRequests !== undefined
            ? gemLive.remainingRequests
            : Math.max(0, gemLimit - gemUsedToday);
        const gemReqPercent = calculateRemainingPercent(gemRemReq, gemLimit);
        const gemRemTok = gemLive?.remainingTokens !== undefined ? gemLive.remainingTokens : 1000000;
        const gemLimitTok = gemLive?.limitTokens || 1000000;
        const gemTokPercent = calculateRemainingPercent(gemRemTok, gemLimitTok);

        // 6. Z.AI Gateway Metrics
        const zaiUsedToday = providerUsage.zai?.requests || 0;
        const zaiLimit = 100;
        const zaiRemReq = Math.max(0, zaiLimit - zaiUsedToday);
        const zaiReqPercent = calculateRemainingPercent(zaiRemReq, zaiLimit);

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
                    resetTimestamp: groqResetTs,
                    resetType: 'rolling',
                    isLiveHeader: !!gh,
                    status: !groqProv || groqProv.isActive === false ? 'Offline' : (groqRemReq <= 0 ? 'Exhausted' : 'Online'),
                    healthStatus: !groqProv || groqProv.isActive === false ? 'inactive' : (groqRemReq <= 0 ? 'exhausted' : (groqReqPercent <= 20 ? 'throttling' : 'healthy'))
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
                    resetTimestamp: groq2ResetTs,
                    resetType: 'rolling',
                    isLiveHeader: !!this.state.groq2LiveHeaders,
                    status: !groq2Prov || groq2Prov.isActive === false ? 'Offline' : (groq2RemReq <= 0 ? 'Exhausted' : 'Online'),
                    healthStatus: !groq2Prov || groq2Prov.isActive === false ? 'inactive' : (groq2RemReq <= 0 ? 'exhausted' : (groq2ReqPercent <= 20 ? 'throttling' : 'healthy'))
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
                    status: !openrouterProv || openrouterProv.isActive === false ? 'Offline' : (orRemReq <= 0 ? 'Exhausted' : 'Online'),
                    healthStatus: !openrouterProv || openrouterProv.isActive === false ? 'inactive' : (orRemReq <= 0 ? 'exhausted' : (orReqPercent <= 20 ? 'throttling' : 'healthy'))
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
                    status: !openrouter2Prov || openrouter2Prov.isActive === false ? 'Offline' : (or2RemReq <= 0 ? 'Exhausted' : 'Online'),
                    healthStatus: !openrouter2Prov || openrouter2Prov.isActive === false ? 'inactive' : (or2RemReq <= 0 ? 'exhausted' : (or2ReqPercent <= 20 ? 'throttling' : 'healthy'))
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
                    status: !geminiProv || geminiProv.isActive === false ? 'Offline' : (gemRemReq <= 0 ? 'Exhausted' : 'Online'),
                    healthStatus: !geminiProv || geminiProv.isActive === false ? 'inactive' : (gemRemReq <= 0 ? 'exhausted' : (gemReqPercent <= 20 ? 'throttling' : 'healthy'))
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
                    status: !zaiProv || zaiProv.isActive === false ? 'Offline' : (zaiRemReq <= 0 ? 'Exhausted' : 'Online'),
                    healthStatus: !zaiProv || zaiProv.isActive === false ? 'inactive' : (zaiRemReq <= 0 ? 'exhausted' : (zaiReqPercent <= 20 ? 'throttling' : 'healthy'))
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
                    status: !ollamaProv || ollamaProv.isActive === false ? 'Offline' : (ollamaHealth.isOnline ? 'Online' : 'Offline'),
                    healthStatus: !ollamaProv || ollamaProv.isActive === false ? 'inactive' : (ollamaHealth.isOnline ? 'healthy' : 'offline')
                }
            }
        };
    }

    computeProviderHealth(provider, gatewayStatus, cbStatus = null) {
        this.checkAndReplenishExpiredQuotas();
        if (!provider) return { status: 'offline', label: 'Offline', badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25', icon: 'WifiOff' };
        const pId = provider.providerId;
        const liveH = this.liveHealth[pId];
        const provMeta = gatewayStatus?.providers?.[pId] || {};

        // 1. Inactive check (User disabled provider)
        if (provider.isActive === false) {
            return {
                status: 'inactive',
                label: 'Inactive',
                badgeClass: 'bg-white/[0.04] text-text-tertiary border-white/[0.08]',
                icon: 'Shield',
                remainingPercent: 0,
                remainingRequests: provMeta.remainingRequests ?? 0,
                limitRequests: provMeta.limitRequests ?? 0,
                remainingTokens: provMeta.remainingTokens ?? null,
                limitTokens: provMeta.limitTokens ?? null,
                resetCountdown: 'Inactive',
                resetSchedule: 'Provider Disabled',
                subtext: 'Disabled',
                reason: 'Provider is deactivated in gateway settings.',
                lastCheckedAt: new Date().toISOString(),
                latencyMs: liveH?.latencyMs || null
            };
        }

        // 2. Auth Error check (401/403 or invalid API Key)
        if (liveH?.status === 'auth_error' || cbStatus?.errorType === 'auth') {
            return {
                status: 'auth_error',
                label: 'Auth Error',
                badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
                icon: 'Lock',
                remainingPercent: 0,
                remainingRequests: 0,
                limitRequests: provMeta.limitRequests ?? 0,
                remainingTokens: 0,
                limitTokens: provMeta.limitTokens ?? null,
                resetCountdown: 'Auth Failed',
                resetSchedule: 'Authentication Error',
                subtext: 'Invalid Key',
                reason: liveH?.lastError || cbStatus?.lastError || 'Authentication failed: Invalid or expired API Key.',
                lastCheckedAt: new Date().toISOString(),
                latencyMs: null
            };
        }

        // 3. Offline check (Daemon unreachable or network timeout)
        if (pId === 'ollama' && provMeta.status === 'Offline') {
            return {
                status: 'offline',
                label: 'Offline',
                badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25',
                icon: 'WifiOff',
                remainingPercent: 0,
                remainingRequests: '0',
                limitRequests: 'Unlimited (Local)',
                remainingTokens: null,
                limitTokens: null,
                resetCountdown: 'Daemon Down',
                resetSchedule: 'Local Compute Offline',
                subtext: 'Daemon Down',
                reason: `Local Ollama service unreachable at ${provider.baseUrl || 'http://localhost:11434'}`,
                lastCheckedAt: new Date().toISOString(),
                latencyMs: null
            };
        }
        if (liveH?.status === 'offline' || cbStatus?.errorType === 'offline') {
            return {
                status: 'offline',
                label: 'Offline',
                badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25',
                icon: 'WifiOff',
                remainingPercent: 0,
                remainingRequests: 0,
                limitRequests: provMeta.limitRequests ?? 0,
                remainingTokens: null,
                limitTokens: null,
                resetCountdown: 'Unreachable',
                resetSchedule: 'Network / Daemon Down',
                subtext: 'Offline',
                reason: liveH?.lastError || cbStatus?.lastError || 'Service unreachable: Network or connection error.',
                lastCheckedAt: new Date().toISOString(),
                latencyMs: null
            };
        }

        // 4. Circuit Breaker Cooling check
        if (cbStatus?.isTripped) {
            return {
                status: 'cooling',
                label: 'Cooling',
                badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
                icon: 'Activity',
                remainingPercent: provMeta.requestsPercent ?? 0,
                remainingRequests: provMeta.remainingRequests ?? 0,
                limitRequests: provMeta.limitRequests ?? 0,
                remainingTokens: provMeta.remainingTokens ?? null,
                limitTokens: provMeta.limitTokens ?? null,
                resetCountdown: 'Cooldown',
                resetSchedule: 'Circuit Breaker Open',
                subtext: `${cbStatus.failures} Failures`,
                reason: `Circuit breaker tripped after ${cbStatus.failures} consecutive failures. Cooling down before retrying.`,
                lastCheckedAt: new Date().toISOString(),
                latencyMs: null
            };
        }

        // 5. Exhausted check (0 requests left, 0% quota, or 429 received)
        const reqLeft = provMeta.remainingRequests !== undefined ? provMeta.remainingRequests : null;
        const reqLimit = provMeta.limitRequests !== undefined ? provMeta.limitRequests : null;
        const reqPct = provMeta.requestsPercent !== undefined ? provMeta.requestsPercent : null;
        const tokPct = provMeta.tokensPercent !== undefined ? provMeta.tokensPercent : 100;

        const isExhausted = (reqLeft !== null && reqLeft !== 'Unlimited' && reqLeft <= 0) || 
                            (reqPct !== null && reqPct <= 0) ||
                            (tokPct !== null && tokPct <= 0) ||
                            liveH?.status === 'exhausted' ||
                            cbStatus?.errorType === 'rate_limit';

        if (isExhausted) {
            const rCount = provMeta.resetCountdown || 'Daily Reset';
            return {
                status: 'exhausted',
                label: 'Exhausted',
                badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
                icon: 'Ban',
                remainingPercent: 0,
                remainingRequests: reqLeft ?? 0,
                limitRequests: reqLimit ?? 50,
                remainingTokens: provMeta.remainingTokens ?? null,
                limitTokens: provMeta.limitTokens ?? null,
                resetCountdown: rCount,
                resetSchedule: provMeta.resetSchedule || 'Daily @ 12:00 AM UTC',
                subtext: reqLeft !== null && reqLimit !== null ? `${reqLeft} / ${reqLimit} left` : '0% left',
                reason: `Rate limit reached / Quota exhausted (${reqLeft ?? 0} requests left). Gateway routes all traffic to backup providers. Resets in ${rCount}.`,
                lastCheckedAt: new Date().toISOString(),
                latencyMs: liveH?.latencyMs || null
            };
        }

        // 6. Low Quota / Throttling check (≤ 20% remaining)
        const effectivePct = Math.min(reqPct !== null ? reqPct : 100, tokPct !== null ? tokPct : 100);
        if (reqLeft !== 'Unlimited' && effectivePct <= 20) {
            const rCount = provMeta.resetCountdown || 'Window';
            return {
                status: 'throttling',
                label: 'Low Quota',
                badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                icon: 'Timer',
                remainingPercent: effectivePct,
                remainingRequests: reqLeft ?? 'Low',
                limitRequests: reqLimit ?? 100,
                remainingTokens: provMeta.remainingTokens ?? null,
                limitTokens: provMeta.limitTokens ?? null,
                resetCountdown: rCount,
                resetSchedule: provMeta.resetSchedule || 'Rolling / Daily',
                subtext: `${reqLeft} / ${reqLimit} (${effectivePct}%)`,
                reason: `Approaching rate limit: ${effectivePct}% remaining (${reqLeft} requests left). Gateway throttling may apply. Resets in ${rCount}.`,
                lastCheckedAt: new Date().toISOString(),
                latencyMs: liveH?.latencyMs || null
            };
        }

        // 7. Healthy
        return {
            status: 'healthy',
            label: 'Healthy',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
            icon: 'CheckCircle2',
            remainingPercent: reqPct ?? 100,
            remainingRequests: reqLeft ?? 'Unlimited',
            limitRequests: reqLimit ?? 'Unlimited',
            remainingTokens: provMeta.remainingTokens ?? null,
            limitTokens: provMeta.limitTokens ?? null,
            resetCountdown: provMeta.resetCountdown || 'Active',
            resetSchedule: provMeta.resetSchedule || 'Active Window',
            subtext: reqLeft === 'Unlimited' ? 'Unlimited' : (reqLeft !== null && reqLimit !== null ? `${reqLeft} / ${reqLimit}` : `${effectivePct}%`),
            reason: `API limits healthy. Gateway operates with unthrottled throughput. (${reqLeft ?? 100} requests remaining)`,
            lastCheckedAt: new Date().toISOString(),
            latencyMs: liveH?.latencyMs || null
        };
    }
}

export const aiQuotaTracker = new AiQuotaTracker();
export default aiQuotaTracker;
