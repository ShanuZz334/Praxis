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

        const routePlan = await getRouteForTask(tier, taskType);
        let messages = [];
        if (data) {
            messages.push({ role: 'system', content: `Context/Data:\n${JSON.stringify(data)}` });
        }
        if (schema && jsonMode) {
            messages.push({ role: 'system', content: `Output strictly as JSON matching this schema:\n${JSON.stringify(schema)}` });
        }
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
