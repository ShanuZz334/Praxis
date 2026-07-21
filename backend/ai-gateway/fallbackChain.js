import { checkProviderHealth, recordProviderFailure, recordProviderSuccess } from './modelRouter.js';
import { validateOutput } from './guardrails/outputGuard.js';

export async function executeWithFallback(routePlan, providers, requestConfig) {
    let fallbackTriggered = false;
    let fallbackReason = null;
    let attempts = 0;

    for (const route of routePlan) {
        if (!checkProviderHealth(route.provider)) {
            console.log(`[AI Gateway] Skipping ${route.provider} due to circuit breaker.`);
            continue;
        }

        const providerModule = providers[route.provider];
        if (!providerModule) {
            console.warn(`[AI Gateway] Provider ${route.provider} not implemented yet, skipping...`);
            continue;
        }

        let providerAttempts = 0;
        
        while (providerAttempts < 2) {
            providerAttempts++;
            attempts++;
            
            if (attempts > 1) fallbackTriggered = true;

            try {
                console.log(`[AI Gateway] Attempting ${route.provider} (${route.model}) - Try ${providerAttempts}`);
                
                const result = await providerModule.call({
                    model: route.model,
                    ...requestConfig
                });
                
                const { parsed, raw } = validateOutput(result.text, requestConfig.jsonMode, requestConfig.schema);
                
                recordProviderSuccess(route.provider);
                
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
                console.error(`[AI Gateway] Error with ${route.provider}:`, error.message);
                if (error.message.includes('Malformed JSON')) {
                    console.warn(`[AI Gateway] Malformed JSON from ${route.provider}, retrying...`);
                    fallbackReason = "Malformed JSON";
                } else {
                    recordProviderFailure(route.provider);
                    fallbackReason = error.message;
                    break; 
                }
            }
        }
    }

    return {
        error: true,
        message: "AI temporarily unavailable",
        details: "All configured providers failed or were rate-limited."
    };
}
