import { AI_CONFIG } from './config.js';
import { providerCache } from './cache/providerCache.js';

const circuitBreakerState = {};

export function checkProviderHealth(providerId) {
    const state = circuitBreakerState[providerId];
    if (!state) return true;
    if (state.failures >= AI_CONFIG.CIRCUIT_BREAKER.MAX_FAILURES) {
        if (Date.now() - state.lastFailedAt > AI_CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT) {
            return true;
        }
        return false;
    }
    return true;
}
export function recordProviderFailure(providerId) {
    if (!circuitBreakerState[providerId]) circuitBreakerState[providerId] = { failures: 0, lastFailedAt: null };
    circuitBreakerState[providerId].failures += 1;
    circuitBreakerState[providerId].lastFailedAt = Date.now();
}
export function recordProviderSuccess(providerId) {
    if (circuitBreakerState[providerId]) {
        circuitBreakerState[providerId].failures = 0;
        circuitBreakerState[providerId].lastFailedAt = null;
    }
}

export async function getRouteForTask(tier, taskType) {
    const providers = await providerCache.getProviders();
    const routePlan = [];
    
    const sorted = [...providers].sort((a, b) => a.priority - b.priority);
    const available = sorted.filter(p => p.supportedTiers.includes(tier.toString()) && p.isActive);

    if (tier === 1) {
        const ollama = available.find(p => p.providerId === 'ollama');
        if (ollama && ollama.models.tier1_simple) {
            routePlan.push({ provider: 'ollama', model: ollama.models.tier1_simple });
        }
        available.filter(p => p.providerId !== 'ollama').forEach(p => {
            if (p.models.tier1_simple) routePlan.push({ provider: p.providerId, model: p.models.tier1_simple });
        });
        return routePlan;
    }

    if (tier === 3) {
        const ollamaSpecific = ['journal_behavioral_patterns'];
        const cloudSpecific = ['stock_narrative', 'report_generation', 'strategy_suggestion', 'macro_cycle_assessment'];
        
        if (ollamaSpecific.includes(taskType)) {
            const ollama = available.find(p => p.providerId === 'ollama');
            if (ollama && ollama.models.tier3_complex) {
                routePlan.push({ provider: 'ollama', model: ollama.models.tier3_complex });
            }
            available.filter(p => p.providerId !== 'ollama').forEach(p => {
                if (p.models.tier3_complex) routePlan.push({ provider: p.providerId, model: p.models.tier3_complex });
            });
            return routePlan;
        } else if (cloudSpecific.includes(taskType)) {
            available.filter(p => p.providerId !== 'ollama').forEach(p => {
                if (p.models.tier3_complex) routePlan.push({ provider: p.providerId, model: p.models.tier3_complex });
            });
            return routePlan;
        }
        
        available.forEach(p => {
            if (p.models.tier3_complex) routePlan.push({ provider: p.providerId, model: p.models.tier3_complex });
        });
        return routePlan;
    }

    available.forEach(p => {
        if (tier === 2 && p.models.tier2_medium && p.providerId !== 'ollama') {
            routePlan.push({ provider: p.providerId, model: p.models.tier2_medium });
        }
        if (tier === 4 && p.models.tier4_vision && p.providerId !== 'ollama') {
            routePlan.push({ provider: p.providerId, model: p.models.tier4_vision });
        }
    });

    return routePlan;
}
