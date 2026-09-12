import { checkProviderHealth, recordProviderFailure, recordProviderSuccess } from './modelRouter.js';
import { validateOutput } from './guardrails/outputGuard.js';
import { aiQuotaTracker } from './aiQuotaTracker.js';

export async function executeWithFallback(routePlan, providers, requestConfig) {
    let fallbackTriggered = false;
    let fallbackReason = null;
    let attempts = 0;
    const providerErrors = [];

    // Determine dynamic timeout based on task level (Bug 5 fix)
    let timeoutMs = 45000; 
    if (['level4_expert', 'level5_reasoner'].includes(requestConfig.level)) {
        timeoutMs = 180000; // 180s for massive CoT context payloads (e.g., Future Vision)
    } else if (['level1_fast'].includes(requestConfig.level)) {
        timeoutMs = 15000; // 15s for fast tasks
    }
    requestConfig.timeoutMs = timeoutMs;

    for (const route of routePlan) {
        if (!checkProviderHealth(route.provider, route.model)) {
            const msg = `${route.provider}/${route.model} skipped - circuit breaker open`;
            console.log(`[AI Gateway] ${msg}`);
            providerErrors.push(msg);
            continue;
        }

        const baseType = route.provider.split('_')[0];
        const providerModule = providers[baseType];
        if (!providerModule) {
            const msg = `${route.provider} not implemented`;
            console.warn(`[AI Gateway] Provider ${route.provider} (Base: ${baseType}) not implemented yet, skipping...`);
            providerErrors.push(msg);
            continue;
        }

        let providerAttempts = 0;
        
        // Bug 3 Fix: Local retry with backoff (up to 2 tries per provider)
        while (providerAttempts < 2) {
            providerAttempts++;
            attempts++;
            
            if (attempts > 1) fallbackTriggered = true;

            try {
                console.log(`[AI Gateway] Attempting ${route.provider} (${route.model}) - Try ${providerAttempts}`);
                
                const result = await providerModule.call({
                    providerId: route.provider,
                    model: route.model,
                    ...requestConfig
                });
                
                const { parsed, raw } = validateOutput(result.text, requestConfig.jsonMode, requestConfig.schema);
                
                recordProviderSuccess(route.provider, route.model);
                aiQuotaTracker.recordSuccess?.(route.provider, result.latencyMs);
                
                return {
                    ...result,
                    text: raw,
                    structured: parsed,
                    provider: route.provider,
                    model: route.model,
                    cached: false,
                    fallbackTriggered,
                    fallbackReason
                };

            } catch (error) {
                const errMsg = `${route.provider}/${route.model}: ${error.message}`;
                console.error(`[AI Gateway] Error with ${route.provider} (${route.model}):`, error.message);
                providerErrors.push(errMsg);
                
                if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
                    aiQuotaTracker.recordRateLimitHit?.(route.provider, error.message);
                } else if (error.message.includes('401') || error.message.includes('403') || error.message.toLowerCase().includes('invalid api key')) {
                    aiQuotaTracker.recordAuthFailure?.(route.provider, error.message);
                }

                // If it's a Malformed JSON or a Transient Network Error (502/503/timeout), we retry
                const isTransient = error.message.includes('timeout') || error.message.includes('502') || error.message.includes('503') || error.message.includes('fetch');
                
                if (error.name === 'AbortError' || error.message.includes('aborted')) {
                    console.log(`[AI Gateway] User aborted generation for ${route.provider}`);
                    break; // Skip recording failure, just exit this provider loop
                } else if (error.message.includes('Malformed JSON') || isTransient) {
                    fallbackReason = isTransient ? "Network/Timeout" : "Malformed JSON";
                    if (providerAttempts < 2) {
                        console.warn(`[AI Gateway] Transient error from ${route.provider}, applying 500ms backoff...`);
                        await new Promise(r => setTimeout(r, 500 * providerAttempts));
                    } else {
                        recordProviderFailure(route.provider, route.model, error);
                    }
                } else {
                    // Hard error (e.g. 400 Bad Request, 401 Unauthorized), don't retry locally
                    recordProviderFailure(route.provider, route.model, error);
                    fallbackReason = error.message;
                    break; 
                }
            }
        }
    }

    // Safety Net Emergency Fallback:
    // If all planned routes were circuit-open or failed, attempt a clean call to high-availability providers (Gemini or Groq)
    const emergencyCandidates = [
        { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
        { provider: 'gemini', model: 'gemini-3.5-flash' },
        { provider: 'groq', model: 'groq/compound-mini' }
    ];

    for (const emer of emergencyCandidates) {
        if (providerErrors.some(e => e.includes(`${emer.provider}/${emer.model}`))) continue;
        const mod = providers[emer.provider];
        if (!mod) continue;

        try {
            console.log(`[AI Gateway] Attempting Emergency Resilience Fallback with ${emer.provider} (${emer.model})...`);
            const result = await mod.call({
                providerId: emer.provider,
                model: emer.model,
                ...requestConfig,
                timeoutMs: 15000
            });
            const { parsed, raw } = validateOutput(result.text, requestConfig.jsonMode, requestConfig.schema);
            recordProviderSuccess(emer.provider, emer.model);
            return {
                ...result,
                text: raw,
                structured: parsed,
                provider: emer.provider,
                model: emer.model,
                cached: false,
                fallbackTriggered: true,
                fallbackReason: 'Primary routes failed - Emergency resilience fallback activated'
            };
        } catch (emerErr) {
            console.error(`[AI Gateway] Emergency fallback ${emer.provider}/${emer.model} failed:`, emerErr.message);
            providerErrors.push(`${emer.provider}/${emer.model}: ${emerErr.message}`);
        }
    }

    const sanitize = (msg) => {
        const clean = msg.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
        let extracted = clean;
        const jsonMatch = clean.match(/\{.*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.error && parsed.error.message) extracted = parsed.error.message;
            } catch(e) {}
        }
        return extracted.length > 150 ? extracted.substring(0, 147) + '...' : extracted;
    };

    const cbSkips = providerErrors.filter(e => e.includes('circuit breaker open'));
    const realErrors = providerErrors.filter(e => !e.includes('circuit breaker open'));

    const parts = [];
    if (cbSkips.length > 0) {
        const uniqueCb = new Set(cbSkips.map(e => e.split(/\s/)[0]));
        parts.push(`${uniqueCb.size} provider(s) circuit-open (retry in ~30s)`);
    }
    realErrors.forEach(e => parts.push(sanitize(e)));

    const errorDetail = parts.length > 0 ? parts.join(' | ') : 'No active providers';

    console.error(`[AI Gateway] All providers failed. Details: ${providerErrors.join(' | ')}`);

    return {
        error: true,
        message: `AI temporarily unavailable: ${errorDetail}`,
        details: errorDetail,
    };
}
