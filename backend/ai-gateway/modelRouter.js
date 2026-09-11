import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AI_CONFIG } from './config.js';
import { providerCache } from './cache/providerCache.js';
import AiRouting from '../models/AiRouting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CB_STATE_FILE = path.join(__dirname, 'cache', 'cbState.json');

let circuitBreakerState = {};
try {
    if (fs.existsSync(CB_STATE_FILE)) {
        circuitBreakerState = JSON.parse(fs.readFileSync(CB_STATE_FILE, 'utf8'));
    }
} catch (e) {
    console.warn("[AI Gateway] Failed to load circuit breaker state:", e.message);
}

function saveCBState() {
    try {
        fs.writeFileSync(CB_STATE_FILE, JSON.stringify(circuitBreakerState));
    } catch (e) {
        // ignore write errors to prevent blocking
    }
}

export function checkProviderHealth(providerId, modelId) {
    const key = `${providerId}::${modelId}`;
    const state = circuitBreakerState[key];
    if (!state) return true;
    if (state.failures >= AI_CONFIG.CIRCUIT_BREAKER.MAX_FAILURES) {
        if (Date.now() - state.lastFailedAt > AI_CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT) {
            return true; // Wait period over
        }
        return false; // Circuit open
    }
    return true; // Circuit closed (healthy)
}

export function recordProviderFailure(providerId, modelId) {
    const key = `${providerId}::${modelId}`;
    if (!circuitBreakerState[key]) circuitBreakerState[key] = { failures: 0, lastFailedAt: null };
    circuitBreakerState[key].failures += 1;
    circuitBreakerState[key].lastFailedAt = Date.now();
    saveCBState();
}

export function recordProviderSuccess(providerId, modelId) {
    const key = `${providerId}::${modelId}`;
    if (circuitBreakerState[key]) {
        delete circuitBreakerState[key];
        saveCBState();
    }
}

export async function getRouteForTask(level, taskType) {
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
            else explicitPref = routing.pageInsight;
            
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
    const explicitProviders = new Set(routePlan.map(r => `${r.provider}::${r.model}`));

    // Primary requested level
    sorted.filter(p => p.supportedLevels && p.supportedLevels.includes(level) && p.isActive).forEach(p => {
        if (p.models[level] && !explicitProviders.has(`${p.providerId}::${p.models[level]}`)) {
            routePlan.push({ provider: p.providerId, model: p.models[level] });
            explicitProviders.add(`${p.providerId}::${p.models[level]}`);
        }
    });

    // Fallbacks to lower levels if this is a high-level task
    if (['level5_reasoner', 'level4_expert', 'level3_advanced', 'level2_standard'].includes(level)) {
        let fallbackLevels = [];
        if (level === 'level5_reasoner' || level === 'level4_expert') fallbackLevels = ['level3_advanced', 'level2_standard'];
        if (level === 'level3_advanced') fallbackLevels = ['level2_standard', 'level1_fast'];
        if (level === 'level2_standard') fallbackLevels = ['level1_fast'];

        for (const fbLevel of fallbackLevels) {
            sorted.filter(p => p.supportedLevels && p.supportedLevels.includes(fbLevel) && p.isActive).forEach(p => {
                if (p.models[fbLevel] && !explicitProviders.has(`${p.providerId}::${p.models[fbLevel]}`)) {
                    routePlan.push({ provider: p.providerId, model: p.models[fbLevel] });
                    explicitProviders.add(`${p.providerId}::${p.models[fbLevel]}`);
                }
            });
        }
    }

    // Limit fallback fan-out to max 5 total routes to ensure we hit stable cloud providers if local/free ones fail
    return routePlan.slice(0, 5);
}
