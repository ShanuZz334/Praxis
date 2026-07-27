import { classifyTask } from './taskClassifier.js';
import { getRouteForTask } from './modelRouter.js';
import { executeWithFallback } from './fallbackChain.js';

import * as ollama from './providers/ollamaProvider.js';
import * as groq from './providers/groqProvider.js';
import * as gemini from './providers/geminiProvider.js';
import * as openrouter from './providers/openrouterProvider.js';

import { validateInput } from './guardrails/inputGuard.js';
import { responseCache } from './cache/responseCache.js';
import { semanticCache } from './cache/semanticCache.js';
import { costLogger } from './costLogger.js';

const providers = {
    ollama,
    groq,
    gemini,
    openrouter
};

export const aiGateway = {
    async process(request) {
        try {
            validateInput(request);
        } catch (e) {
            return { error: true, message: "Input validation failed", details: e.message };
        }

        const { taskType, prompt, data, jsonMode, schema, maxTokens, temperature } = request;
        const tier = classifyTask(taskType);
        
        request.tier = tier; 

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

        let routePlan = await getRouteForTask(tier, taskType);
        
        // UI manual override for interactive chat
        if (request.explicitProvider && request.explicitModel) {
            routePlan = [{ provider: request.explicitProvider, model: request.explicitModel, isExplicit: true }, ...routePlan];
        }

        let messages = [];

        // 1. System instruction (custom per-card prompt from Prompts Studio, or default)
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

        // 3. Chat history
        if (request.history && Array.isArray(request.history)) {
            messages.push(...request.history.map(msg => ({
                role: msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            })));
        }

        // 4. User prompt
        messages.push({ role: 'user', content: prompt });


        console.log(`[AI Gateway] Processing Tier ${tier} task '${taskType}'`);

        const result = await executeWithFallback(routePlan, providers, {
            messages,
            maxTokens,
            temperature,
            jsonMode,
            schema 
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
