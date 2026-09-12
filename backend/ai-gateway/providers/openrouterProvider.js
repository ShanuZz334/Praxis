import { providerCache } from '../cache/providerCache.js';
import { aiQuotaTracker } from '../aiQuotaTracker.js';

export async function call({ model, messages, maxTokens, temperature, jsonMode, providerId = 'openrouter', timeoutMs, enableWebSearch }) {
    const p = await providerCache.getProvider(providerId);
    if (!p || !p.apiKey) throw new Error(`${providerId} provider is not configured.`);

    const url = p.baseUrl || 'https://openrouter.ai/api/v1';
    const endpoint = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;

    const payload = { model, messages, temperature: temperature ?? 0.7, max_tokens: maxTokens ?? 1024 };
    
    if (enableWebSearch) {
        payload.plugins = [{ id: "web" }];
    }
    
    // We do NOT append response_format for OpenRouter because many free/open models 
    // will throw a 400 error if it is present. Our outputGuard regex will extract the JSON block.

    const startTime = Date.now();
    const response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs || 45000), // 45 second timeout per attempt
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${p.apiKey}`,
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Praxis AI'
        },
        body: JSON.stringify(payload)
    });

    // Intercept live OpenRouter rate-limit headers (supports openrouter and openrouter_2)
    aiQuotaTracker.recordOpenRouterHeaders(response.headers, providerId);

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) throw new Error(`[429] OpenRouter Rate Limit: ${errorText}`);
        throw new Error(`[${response.status}] OpenRouter Error: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error(`[OpenRouter] Malformed response from ${model}:`, JSON.stringify(data).substring(0, 200));
        throw new Error(`Invalid response structure from OpenRouter for model ${model}`);
    }

    return {
        text: data.choices[0].message.content || '',
        tokensIn: data.usage?.prompt_tokens || 0,
        tokensOut: data.usage?.completion_tokens || 0,

        latencyMs: Date.now() - startTime
    };
}
