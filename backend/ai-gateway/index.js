import { classifyTask } from './taskClassifier.js';
import { getRouteForTask } from './modelRouter.js';
import { executeWithFallback } from './fallbackChain.js';

import * as ollama from './providers/ollamaProvider.js';
import * as groq from './providers/groqProvider.js';
import * as gemini from './providers/geminiProvider.js';
import * as openrouter from './providers/openrouterProvider.js';
import * as zai from './providers/zaiProvider.js';

import { validateInput } from './guardrails/inputGuard.js';
import { responseCache } from './cache/responseCache.js';
import { semanticCache } from './cache/semanticCache.js';
import { costLogger } from './costLogger.js';
import AiRouting from '../models/AiRouting.js';

const providers = {
    ollama,
    groq,
    gemini,
    openrouter,
    zai
};

// Bug 31 Fix: Sanitize user input to prevent prompt injection via control tokens
function sanitizeInput(text) {
    if (!text) return text;
    return text.replace(/<\|.*?\|>/g, '').replace(/```system/g, '```');
}

export const aiGateway = {
    async process(request) {
        try {
            validateInput(request);
        } catch (e) {
            return { error: true, message: "Input validation failed", details: e.message };
        }

        const { taskType, prompt, data, jsonMode, schema, maxTokens } = request;
        let temperature = request.temperature;
        if (temperature === undefined || temperature === null) {
            try {
                const routingDoc = await AiRouting.findOne({ isSingleton: true }).lean();
                if (routingDoc && routingDoc.temperature !== undefined && routingDoc.temperature !== null) {
                    temperature = routingDoc.temperature;
                }
            } catch (err) {
                // fallback
            }
        }
        if (temperature === undefined || temperature === null) {
            temperature = 0.7;
        }

        const level = classifyTask(taskType);
        
        request.level = level; 

        let routePlan = await getRouteForTask(level, taskType);
        
        // UI manual override for interactive chat
        if (request.explicitProvider && request.explicitModel) {
            routePlan = [{ provider: request.explicitProvider, model: request.explicitModel, isExplicit: true }, ...routePlan];
        }

        request.targetModel = routePlan.length > 0 ? routePlan[0].model : 'fallback';

        if (!request.bypassCache && !request.forceRefresh) {
            const exactHit = responseCache.get(request);
            if (exactHit) {
                costLogger.log(request, exactHit);
                return exactHit;
            }

            const semanticHit = await semanticCache.check(request);
            if (semanticHit) {
                costLogger.log(request, semanticHit);
                return semanticHit;
            }
        }

        let messages = [];

        // 1. System instruction
        if (request.systemInstruction) {
            messages.push({ role: 'system', content: request.systemInstruction });
        }

        // 2. Structured data context
        if (data) {
            let dataString = JSON.stringify(data);
            if (dataString.length > 12000) {
                console.warn(`[AI Gateway] Truncating large context data (${dataString.length} chars) to prevent token overflow`);
                dataString = dataString.substring(0, 12000) + '... [TRUNCATED - EXCEEDS CONTEXT LIMIT]';
            }
            messages.push({ role: 'system', content: `Context/Data:\n${dataString}` });
        }
        if (schema && jsonMode) {
            messages.push({ role: 'system', content: `Output strictly as JSON matching this schema:\n${JSON.stringify(schema)}` });
        }

        // 3. Chat history (Sanitized)
        if (request.history && Array.isArray(request.history)) {
            messages.push(...request.history.map(msg => ({
                role: msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user',
                content: sanitizeInput(msg.content)
            })));
        }
        
        // 3.5 Global Formatting Mandate
        if (!jsonMode) {
            messages.push({ role: 'system', content: `[GLOBAL FORMATTING MANDATE: If you output any structured data, lists, or pseudo-tables, you MUST use strict GitHub Flavored Markdown (GFM) table syntax with pipe characters (e.g., | Col | Col |). NEVER use spaces, tabs, or manual indentation for visual alignment. Use markdown for emphasis.]` });
        }

        // 4. User prompt (Sanitized)
        messages.push({ role: 'user', content: sanitizeInput(prompt) });

        console.log(`[AI Gateway] Processing ${level} task '${taskType}'`);

        const result = await executeWithFallback(routePlan, providers, {
            level,
            messages,
            maxTokens,
            temperature,
            jsonMode,
            schema,
            enableWebSearch: request.enableWebSearch
        });

        if (result.error) {
            costLogger.log(request, result);
            return result;
        }

        responseCache.set(request, result);
        await semanticCache.set(request, result);

        costLogger.log(request, result);
        return result;
    }
};

export default aiGateway;
