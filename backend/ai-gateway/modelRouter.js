import { AI_CONFIG } from './config.js';
import { providerCache } from './cache/providerCache.js';
import AiRouting from '../models/AiRouting.js';

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
    
    // First, check explicit user routing preferences
    try {
        const routing = await AiRouting.findOne({ isSingleton: true }).lean();
        if (routing) {
            let explicitPref = null;
            if (taskType === 'per_card_insight') explicitPref = routing.cardInsight;
            else if (taskType === 'page_header_insight') explicitPref = routing.headerInsight;
            else if (taskType === 'chat_conversation') explicitPref = routing.manualChat;
            else if (taskType === 'future_vision_prediction') explicitPref = routing.futureVision;
            else explicitPref = routing.pageInsight; // Default map for others or actual pageInsight
            
            if (explicitPref && explicitPref.providerId && explicitPref.modelId) {
                const explicitProvider = providers.find(p => p.providerId === explicitPref.providerId && p.isActive);
                if (explicitProvider) {
                    routePlan.push({ provider: explicitProvider.providerId, model: explicitPref.modelId, isExplicit: true });
                }
            }
        }
    } catch (err) {
        console.error("Failed to fetch explicit routing:", err);
    }
    
    const sorted = [...providers].sort((a, b) => a.priority - b.priority);
    const available = sorted.filter(p => p.supportedTiers.includes(tier.toString()) && p.isActive);

    if (tier === 1) {
        // If an explicit route was added, we don't need to add the default tier 1 ollama unless they are different
        const ollama = available.find(p => p.providerId === 'ollama');
        if (ollama && ollama.models.tier1_simple) {
            const hasOllamaT1 = routePlan.some(r => r.provider === 'ollama' && r.model === ollama.models.tier1_simple);
            if (!hasOllamaT1) {
                routePlan.push({ provider: 'ollama', model: ollama.models.tier1_simple });
            }
        }
        available.filter(p => p.providerId !== 'ollama').forEach(p => {
            if (p.models.tier1_simple) {
                const hasModel = routePlan.some(r => r.provider === p.providerId && r.model === p.models.tier1_simple);
                if (!hasModel) routePlan.push({ provider: p.providerId, model: p.models.tier1_simple });
            }
        });
        return routePlan;
    }

    if (tier === 3) {
        const ollamaSpecific = ['journal_behavioral_patterns'];
        const cloudSpecific = ['stock_narrative', 'report_generation', 'strategy_suggestion', 'macro_cycle_assessment', 'future_vision_prediction'];
        
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
            // Robust multi-tier fallback:
            // 1. Explicit user-selected model is already at position 0 in routePlan
            // 2. Fill with tier3_complex from other providers (not duplicating the same provider)
            // 3. Then tier2_medium as lighter fallbacks
            // 4. Then tier4_vision if available
            // This ensures maximum coverage even if 2-3 providers are rate-limited
            const explicitProviders = new Set(routePlan.map(r => r.provider));

            // Tier 3 fallbacks (same tier, different providers)
            available.filter(p => p.providerId !== 'ollama').forEach(p => {
                if (p.models.tier3_complex && !explicitProviders.has(p.providerId)) {
                    routePlan.push({ provider: p.providerId, model: p.models.tier3_complex });
                    explicitProviders.add(p.providerId); // prevent duplicating same provider in next loop
                }
            });

            // Tier 2 fallbacks (lighter models, but still structured JSON capable)
            const allProviders = [...providers].sort((a, b) => a.priority - b.priority);
            allProviders.filter(p => p.isActive && p.providerId !== 'ollama').forEach(p => {
                if (p.models.tier2_medium && !explicitProviders.has(`${p.providerId}_t2`)) {
                    routePlan.push({ provider: p.providerId, model: p.models.tier2_medium });
                    explicitProviders.add(`${p.providerId}_t2`);
                }
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
